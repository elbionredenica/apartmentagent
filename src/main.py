from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Dict, Any
from datetime import datetime
from uuid import UUID
from psycopg.types.json import Jsonb
import os

from src.config import settings
from src.db import db
from src.aerospike_client import aerospike_client
from src.orchestrator import orchestrator
from src.models import ListingState, ListingStatus, User, Listing

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    print("🚀 Starting Scout Backend...")
    await db.connect()
    aerospike_client.connect()
    print("✅ All systems ready!")
    
    yield
    
    # Shutdown
    print("👋 Shutting down...")
    await db.disconnect()
    aerospike_client.disconnect()

app = FastAPI(
    title="Scout API",
    description="AI agent that calls apartment listings and qualifies them",
    version="1.0.0",
    lifespan=lifespan
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

USER_COLUMNS = [
    "id",
    "email",
    "created_at",
    "max_budget",
    "min_bedrooms",
    "max_bedrooms",
    "has_pet",
    "pet_type",
    "pet_weight_lbs",
    "dealbreakers",
    "preferences",
    "learned_preferences",
]

LISTING_COLUMNS = [
    "id",
    "external_id",
    "source",
    "address",
    "city",
    "state",
    "zip_code",
    "bedrooms",
    "bathrooms",
    "rent",
    "deposit",
    "square_feet",
    "phone",
    "email",
    "property_manager",
    "description",
    "amenities",
    "photos",
    "raw_data",
    "first_seen_at",
    "last_updated_at",
    "is_available",
]

AIRBYTE_PHONE_POOL = ["6283036336", "6284887063"]


def _row_to_dict(columns: list[str], row) -> Dict[str, Any] | None:
    if not row:
        return None
    normalized = {}
    for key, value in zip(columns, row):
        if isinstance(value, UUID):
            normalized[key] = str(value)
        elif isinstance(value, datetime):
            normalized[key] = value.isoformat()
        else:
            normalized[key] = value
    return normalized


async def _get_demo_user() -> Dict[str, Any]:
    user_row = await db.fetchrow(
        """
        SELECT * FROM users
        ORDER BY created_at ASC
        LIMIT 1
        """
    )
    if not user_row:
        raise HTTPException(status_code=404, detail="No demo user found")
    return _row_to_dict(USER_COLUMNS, user_row)


async def _resolve_user_by_email(email: str) -> Dict[str, Any]:
    user_row = await db.fetchrow("SELECT * FROM users WHERE email = %s", email)
    if user_row:
        user = _row_to_dict(USER_COLUMNS, user_row)
    else:
        await db.execute(
            """
            INSERT INTO users (
                email, max_budget, min_bedrooms, max_bedrooms, has_pet,
                pet_type, pet_weight_lbs, dealbreakers, preferences, learned_preferences
            )
            VALUES (%s, 999999, 0, 10, FALSE, NULL, NULL, %s::jsonb, %s::jsonb, '{}'::jsonb)
            """,
            email,
            Jsonb([]),
            Jsonb({"onboardingComplete": False}),
        )
        user_row = await db.fetchrow("SELECT * FROM users WHERE email = %s", email)
        user = _row_to_dict(USER_COLUMNS, user_row)

    preferences = user.get("preferences") or {}
    user["onboarding_complete"] = bool(preferences.get("onboardingComplete"))
    return user


async def _run_listing_workflow(listing_id: str, user_id: str) -> None:
    initial_state = ListingState(
        listing_id=listing_id,
        user_id=user_id,
        status=ListingStatus.DISCOVERED,
    )

    thread_id = f"{user_id}:{listing_id}"

    try:
        result = await orchestrator.ainvoke(
            initial_state.dict(),
            config={"configurable": {"thread_id": thread_id}},
        )

        await db.execute(
            """
            UPDATE user_listing_states
            SET status = %s, failure_reason = %s, last_updated_at = NOW()
            WHERE user_id = %s AND listing_id = %s
            """,
            result["status"],
            result.get("failure_reason"),
            user_id,
            listing_id,
        )
        print(f"✅ Workflow completed for {listing_id}: {result['status']}")
    except Exception as e:
        print(f"❌ Workflow failed for {listing_id}: {e}")
        await db.execute(
            """
            UPDATE user_listing_states
            SET status = 'failed', failure_reason = 'WORKFLOW_ERROR', last_updated_at = NOW()
            WHERE user_id = %s AND listing_id = %s
            """,
            user_id,
            listing_id,
        )


def _normalize_preferences(preferences: Dict[str, Any]) -> Dict[str, Any]:
    locations = preferences.get("locations") or []
    must_haves = preferences.get("mustHaves") or []
    custom_questions = preferences.get("customQuestions") or []

    return {
        "max_budget": int(preferences.get("maxBudget") or 3000),
        "min_bedrooms": int(preferences.get("minBedrooms") or 1),
        "max_bedrooms": int(preferences.get("maxBedrooms") or preferences.get("minBedrooms") or 3),
        "has_pet": bool(preferences.get("hasPet")),
        "pet_type": preferences.get("petType"),
        "pet_weight_lbs": preferences.get("petWeightLbs"),
        "dealbreakers": preferences.get("dealbreakers") or [],
        "preferences": {
            "locations": locations,
            "mustHaves": must_haves,
            "moveInTimeline": preferences.get("moveInTimeline"),
            "tourAvailability": preferences.get("tourAvailability"),
            "customQuestions": custom_questions,
            "onboardingComplete": True,
        },
    }


def _coerce_int(value: Any) -> int | None:
    if value is None:
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def _coerce_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _airbyte_address(row: Dict[str, Any]) -> str:
    return (
        row.get("formattedAddress")
        or ", ".join(
            part for part in [row.get("addressLine1"), row.get("addressLine2"), row.get("city"), row.get("state")] if part
        )
        or "Unknown address"
    )


async def _trigger_airbyte_sync_best_effort() -> bool:
    if not settings.airbyte_connection_id or not settings.airbyte_client_id or not settings.airbyte_client_secret:
        return False

    try:
        os.environ["AIRBYTE_CLIENT_ID"] = settings.airbyte_client_id
        os.environ["AIRBYTE_CLIENT_SECRET"] = settings.airbyte_client_secret
        os.environ["AIRBYTE_CONNECTION_ID"] = settings.airbyte_connection_id
        if settings.rent_cast_api:
            os.environ["RENT_CAST_API"] = settings.rent_cast_api
        os.environ["GHOST_CONNECTION_STRING"] = settings.ghost_connection_string

        from Airbyte.ingestion.airbyte_client import trigger_sync, wait_for_sync

        job_id = await trigger_sync(settings.airbyte_connection_id)
        print(f"🔄 Triggered Airbyte sync job {job_id}")
        return await wait_for_sync(job_id, poll_interval_seconds=5, timeout_seconds=45)
    except Exception as exc:
        print(f"⚠️ Airbyte sync skipped: {exc}")
        return False


async def _import_airbyte_listings() -> int:
    table_exists = await db.fetchval(
        """
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'Rental_Listings'
        )
        """
    )
    if not table_exists:
        return 0

    rows = await db.fetch(
        """
        SELECT row_to_json(t)::jsonb
        FROM (
            SELECT *
            FROM "Rental_Listings"
            ORDER BY COALESCE("listedDate", "lastSeenDate") DESC NULLS LAST
            LIMIT 100
        ) t
        """
    )

    imported = 0
    for index, row in enumerate(rows):
        payload = row[0] or {}
        external_id = f"airbyte:{payload.get('id')}"
        if not payload.get("id"):
            continue

        address = _airbyte_address(payload)
        phone = AIRBYTE_PHONE_POOL[index % len(AIRBYTE_PHONE_POOL)]
        description_bits = [
            payload.get("propertyType"),
            payload.get("listingType"),
            f"{_coerce_int(payload.get('squareFootage'))} sqft" if payload.get("squareFootage") else None,
            payload.get("mlsName"),
        ]
        description = ". ".join(bit for bit in description_bits if bit)

        await db.execute(
            """
            INSERT INTO listings (
                external_id, source, address, city, state, zip_code,
                bedrooms, bathrooms, rent, square_feet, phone,
                description, raw_data, is_available
            )
            VALUES (%s, 'airbyte', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s)
            ON CONFLICT (external_id)
            DO UPDATE SET
                address = EXCLUDED.address,
                city = EXCLUDED.city,
                state = EXCLUDED.state,
                zip_code = EXCLUDED.zip_code,
                bedrooms = EXCLUDED.bedrooms,
                bathrooms = EXCLUDED.bathrooms,
                rent = EXCLUDED.rent,
                square_feet = EXCLUDED.square_feet,
                phone = EXCLUDED.phone,
                description = EXCLUDED.description,
                raw_data = EXCLUDED.raw_data,
                is_available = EXCLUDED.is_available,
                last_updated_at = NOW()
            """,
            external_id,
            address,
            payload.get("city") or "",
            payload.get("state") or "",
            payload.get("zipCode"),
            _coerce_int(payload.get("bedrooms")),
            _coerce_float(payload.get("bathrooms")),
            _coerce_int(payload.get("price")) or 0,
            _coerce_int(payload.get("squareFootage")),
            phone,
            description or None,
            Jsonb(payload),
            str(payload.get("status", "")).lower() not in {"removed", "inactive"},
        )
        imported += 1

    if imported:
        print(f"✅ Imported {imported} Airbyte listings into app search pool")
    return imported


def _score_listing_for_user(listing: Dict[str, Any], user: Dict[str, Any]) -> tuple[bool, str | None, int]:
    if not listing.get("is_available", True):
        return False, "UNAVAILABLE", 0

    if listing["rent"] > user["max_budget"]:
        return False, "PRICE", 0

    bedrooms = listing.get("bedrooms")
    if bedrooms is not None and (bedrooms < user["min_bedrooms"] or bedrooms > user["max_bedrooms"]):
        return False, "BEDROOMS", 0

    description = (listing.get("description") or "").lower()
    if user["has_pet"] and any(term in description for term in ["no pets", "pets not allowed", "no dogs"]):
        return False, "PETS", 0

    if not listing.get("phone"):
        return False, "NO_PHONE", 0

    score = 100
    score -= max(0, user["max_budget"] - listing["rent"]) // 100

    preferred_bedrooms = user["min_bedrooms"]
    if bedrooms is not None:
        score -= abs(bedrooms - preferred_bedrooms) * 5

    for location in user.get("preferences", {}).get("locations", []):
        loc = location.lower()
        haystacks = " ".join(
            filter(
                None,
                [
                    (listing.get("address") or "").lower(),
                    (listing.get("city") or "").lower(),
                    description,
                ],
            )
        )
        if loc in haystacks:
            score += 10

    for must_have in user.get("preferences", {}).get("mustHaves", []):
        if must_have.lower() in description:
            score += 8

    return True, None, score

@app.get("/")
async def root():
    return {
        "message": "Scout API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database
        await db.fetchval("SELECT 1")
        db_status = "connected"
    except:
        db_status = "disconnected"
    
    try:
        # Check Aerospike
        aerospike_client.put("health", "check", {"test": True}, ttl=10)
        aerospike_status = "connected"
    except:
        aerospike_status = "disconnected"
    
    return {
        "status": "healthy",
        "database": db_status,
        "aerospike": aerospike_status
    }

@app.get("/api/users/{user_id}")
async def get_user(user_id: str):
    """Get user profile"""
    user_row = await db.fetchrow("SELECT * FROM users WHERE id = %s", user_id)
    
    if not user_row:
        raise HTTPException(status_code=404, detail="User not found")
    
    return _row_to_dict(USER_COLUMNS, user_row)


@app.get("/api/demo/user")
async def get_demo_user():
    """Return the seeded demo user that powers the end-to-end demo."""
    return await _get_demo_user()


@app.post("/api/users/resolve")
async def resolve_user(payload: Dict[str, Any]):
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Missing email")
    return await _resolve_user_by_email(email)

@app.get("/api/listings")
async def get_listings(user_id: str = None):
    """Get all listings, optionally filtered by user"""
    if user_id:
        # Get listings with their status for this user
        rows = await db.fetch("""
            SELECT 
                l.*,
                uls.status,
                uls.failure_reason
            FROM listings l
            LEFT JOIN user_listing_states uls 
                ON uls.listing_id = l.id AND uls.user_id = %s
            ORDER BY l.first_seen_at DESC
        """, user_id)
    else:
        rows = await db.fetch(
            "SELECT * FROM listings ORDER BY first_seen_at DESC"
        )
    
    listings = []
    for row in rows:
        listings.append(
            {
                "id": row[0],
                "external_id": row[1],
                "source": row[2],
                "address": row[3],
                "city": row[4],
                "state": row[5],
                "zip_code": row[6],
                "bedrooms": row[7],
                "bathrooms": row[8],
                "rent": row[9],
                "deposit": row[10],
                "square_feet": row[11],
                "phone": row[12],
                "email": row[13],
                "property_manager": row[14],
                "description": row[15],
                "amenities": row[16],
                "photos": row[17],
            }
        )
    return listings

@app.get("/api/listings/{listing_id}/transcripts")
async def get_transcripts(listing_id: str, user_id: str):
    """Get call transcripts for a listing"""
    rows = await db.fetch("""
        SELECT * FROM call_transcripts
        WHERE listing_id = %s AND user_id = %s
        ORDER BY called_at DESC
    """, listing_id, user_id)
    
    transcripts = []
    for row in rows:
        transcripts.append({
            'id': row[0],
            'user_id': row[1],
            'listing_id': row[2],
            'call_type': row[3],
            'transcript': row[7],
            'outcome': row[9]
        })
    return transcripts

@app.post("/api/demo/process-listing")
async def process_listing(
    listing_id: str,
    user_id: str,
    background_tasks: BackgroundTasks,
    force: bool = False
):
    """
    Trigger processing for a listing.
    This is what Airbyte would call when a new listing arrives.
    """
    # Check if already processed
    cache_key = f"user:{user_id}:listing:{listing_id}"

    if force:
        aerospike_client.delete("listing_states", cache_key)

    if aerospike_client.exists("listing_states", cache_key):
        return {
            "message": "Listing already processed for this user",
            "status": "skipped"
        }
    
    # Mark as processing in Aerospike
    aerospike_client.put(
        "listing_states",
        cache_key,
        {
            "status": "discovered",
            "user_id": user_id,
            "listing_id": listing_id
        },
        ttl=86400  # 24 hours
    )
    
    # Create initial state in Ghost
    await db.execute("""
        INSERT INTO user_listing_states (user_id, listing_id, status)
        VALUES (%s, %s, %s)
        ON CONFLICT (user_id, listing_id)
        DO UPDATE SET status = EXCLUDED.status, failure_reason = NULL, last_updated_at = NOW()
    """, user_id, listing_id, "discovered")
    
    background_tasks.add_task(_run_listing_workflow, listing_id, user_id)
    
    return {
        "message": "Processing started",
        "listing_id": listing_id,
        "user_id": user_id,
        "thread_id": f"{user_id}:{listing_id}"
    }


@app.post("/api/demo/run-search")
async def run_demo_search(payload: Dict[str, Any], background_tasks: BackgroundTasks):
    """
    Update the demo user's preferences, score all listings, and only call the best match.
    """
    user_id = payload.get("user_id")
    preferences = payload.get("preferences") or {}
    reset = payload.get("reset", True)

    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")

    normalized = _normalize_preferences(preferences)

    await db.execute(
        """
        UPDATE users
        SET max_budget = %s,
            min_bedrooms = %s,
            max_bedrooms = %s,
            has_pet = %s,
            pet_type = %s,
            pet_weight_lbs = %s,
            dealbreakers = %s::jsonb,
            preferences = %s::jsonb
        WHERE id = %s
        """,
        normalized["max_budget"],
        normalized["min_bedrooms"],
        normalized["max_bedrooms"],
        normalized["has_pet"],
        normalized["pet_type"],
        normalized["pet_weight_lbs"],
        Jsonb(normalized["dealbreakers"]),
        Jsonb(normalized["preferences"]),
        user_id,
    )

    user_row = await db.fetchrow("SELECT * FROM users WHERE id = %s", user_id)
    if not user_row:
        raise HTTPException(status_code=404, detail="User not found")
    user = _row_to_dict(USER_COLUMNS, user_row)

    airbyte_synced = await _trigger_airbyte_sync_best_effort()
    airbyte_imported = await _import_airbyte_listings()

    listings_rows = await db.fetch("SELECT * FROM listings ORDER BY first_seen_at DESC")
    listings = [_row_to_dict(LISTING_COLUMNS, row) for row in listings_rows]

    if reset:
        await db.execute("DELETE FROM viewings WHERE user_id = %s", user_id)
        await db.execute("DELETE FROM call_transcripts WHERE user_id = %s", user_id)
        await db.execute("DELETE FROM user_listing_states WHERE user_id = %s", user_id)
        for listing in listings:
            aerospike_client.delete("listing_states", f"user:{user_id}:listing:{listing['id']}")

    eligible: list[tuple[int, Dict[str, Any]]] = []

    for listing in listings:
        eligible_for_call, failure_reason, score = _score_listing_for_user(listing, user)

        if eligible_for_call:
            eligible.append((score, listing))
            continue

        await db.execute(
            """
            INSERT INTO user_listing_states (user_id, listing_id, status, failure_reason)
            VALUES (%s, %s, 'failed', %s)
            ON CONFLICT (user_id, listing_id)
            DO UPDATE SET status = 'failed', failure_reason = EXCLUDED.failure_reason, last_updated_at = NOW()
            """,
            user_id,
            listing["id"],
            failure_reason,
        )

    chosen_listing_id = None

    if eligible:
        eligible.sort(key=lambda item: item[0], reverse=True)
        best_score, best_listing = eligible[0]
        chosen_listing_id = best_listing["id"]

        for _, listing in eligible[1:]:
            await db.execute(
                """
                INSERT INTO user_listing_states (user_id, listing_id, status, failure_reason)
                VALUES (%s, %s, 'failed', 'LOW_SCORE')
                ON CONFLICT (user_id, listing_id)
                DO UPDATE SET status = 'failed', failure_reason = 'LOW_SCORE', last_updated_at = NOW()
                """,
                user_id,
                listing["id"],
            )

        cache_key = f"user:{user_id}:listing:{best_listing['id']}"
        aerospike_client.put(
            "listing_states",
            cache_key,
            {
                "status": "discovered",
                "user_id": user_id,
                "listing_id": best_listing["id"],
                "match_score": best_score,
            },
            ttl=86400,
        )
        await db.execute(
            """
            INSERT INTO user_listing_states (user_id, listing_id, status)
            VALUES (%s, %s, 'discovered')
            ON CONFLICT (user_id, listing_id)
            DO UPDATE SET status = 'discovered', failure_reason = NULL, last_updated_at = NOW()
            """,
            user_id,
            best_listing["id"],
        )
        background_tasks.add_task(_run_listing_workflow, best_listing["id"], user_id)

    return {
        "user_id": user_id,
        "search_started": True,
        "eligible_count": len(eligible),
        "chosen_listing_id": chosen_listing_id,
        "airbyte_synced": airbyte_synced,
        "airbyte_imported": airbyte_imported,
    }

@app.post("/webhooks/prescreen")
async def prescreen_webhook(payload: Dict[str, Any]):
    """
    Webhook endpoint for Bland AI pre-screen call completion.
    Resumes the LangGraph workflow with transcript data.
    """
    print(f"📨 Received pre-screen webhook")
    
    call_id = payload.get('call_id')
    transcript = payload.get('concatenated_transcript', '')
    metadata = payload.get('metadata', {})
    
    listing_id = metadata.get('listing_id')
    user_id = metadata.get('user_id')
    
    if not listing_id or not user_id:
        raise HTTPException(status_code=400, detail="Missing metadata")
    
    # Store transcript in Ghost
    await db.execute("""
        INSERT INTO call_transcripts (
            user_id, listing_id, call_type, call_id, 
            transcript, outcome, called_at
        )
        VALUES (%s, %s, 'prescreen', %s, %s, 'PASS', NOW())
    """, user_id, listing_id, call_id, transcript)
    
    # Resume workflow with transcript
    thread_id = f"{user_id}:{listing_id}"
    
    # Get current state
    current_state = await orchestrator.aget_state(
        config={"configurable": {"thread_id": thread_id}}
    )
    
    if current_state:
        # Update state with transcript
        updated_state = {
            **current_state.values,
            "prescreen_transcript": transcript,
            "next_action": "analyze"
        }
        
        # Resume workflow
        result = await orchestrator.ainvoke(
            updated_state,
            config={"configurable": {"thread_id": thread_id}}
        )
        
        print(f"✅ Workflow resumed and completed: {result['status']}")
    
    return {"status": "received"}

@app.get("/api/demo/status")
async def demo_status(user_id: str | None = None):
    """Get status of all listings for demo"""
    if not user_id:
        user = await _get_demo_user()
        user_id = user["id"]

    listings = await db.fetch("""
        SELECT 
            l.id,
            l.address,
            l.city,
            l.rent,
            l.bedrooms,
            l.bathrooms,
            l.phone,
            l.property_manager,
            l.description,
            uls.status,
            uls.failure_reason,
            COUNT(ct.id) as call_count
        FROM listings l
        LEFT JOIN user_listing_states uls ON uls.listing_id = l.id AND uls.user_id = %s
        LEFT JOIN call_transcripts ct ON ct.listing_id = l.id AND ct.user_id = %s
        GROUP BY l.id, l.address, l.city, l.rent, l.bedrooms, l.bathrooms, l.phone, l.property_manager, l.description, uls.status, uls.failure_reason
        ORDER BY l.first_seen_at DESC
    """, user_id, user_id)
    
    result = []
    for row in listings:
        result.append({
            'id': row[0],
            'address': row[1],
            'city': row[2],
            'rent': row[3],
            'bedrooms': row[4],
            'bathrooms': row[5],
            'phone': row[6],
            'property_manager': row[7],
            'description': row[8],
            'status': row[9],
            'failure_reason': row[10],
            'call_count': row[11]
        })
    return result


@app.get("/api/viewings")
async def get_viewings(user_id: str):
    rows = await db.fetch(
        """
        SELECT
            v.id, v.user_id, v.listing_id, v.scheduled_at, v.duration_minutes,
            v.calendar_event_id, v.status, v.attended, v.user_rating, v.user_feedback,
            v.would_apply, v.created_at, v.updated_at,
            l.address, l.rent, l.property_manager
        FROM viewings v
        JOIN listings l ON l.id = v.listing_id
        WHERE v.user_id = %s
        ORDER BY v.scheduled_at ASC
        """,
        user_id,
    )

    return [
        {
            "id": row[0],
            "user_id": row[1],
            "listing_id": row[2],
            "scheduled_at": row[3],
            "duration_minutes": row[4],
            "calendar_event_id": row[5],
            "status": row[6],
            "attended": row[7],
            "user_rating": row[8],
            "user_feedback": row[9],
            "would_apply": row[10],
            "created_at": row[11],
            "updated_at": row[12],
            "address": row[13],
            "rent": row[14],
            "property_manager": row[15],
        }
        for row in rows
    ]


@app.get("/api/demo/dashboard")
async def demo_dashboard(user_id: str):
    user_row = await db.fetchrow("SELECT * FROM users WHERE id = %s", user_id)
    if not user_row:
        raise HTTPException(status_code=404, detail="User not found")

    listings = await demo_status(user_id=user_id)
    transcripts = await db.fetch(
        """
        SELECT
            id, user_id, listing_id, call_type, call_id, phone_number, duration_seconds,
            transcript, extracted_data, outcome, failure_reason, compliance_violation,
            compliance_notes, called_at, management_score, noise_score, value_score,
            flexibility_score, overall_score
        FROM call_transcripts
        WHERE user_id = %s
        ORDER BY called_at DESC
        """,
        user_id,
    )
    viewings = await get_viewings(user_id)

    return {
        "user": _row_to_dict(USER_COLUMNS, user_row),
        "listings": listings,
        "transcripts": [
            {
                "id": row[0],
                "user_id": row[1],
                "listing_id": row[2],
                "call_type": row[3],
                "call_id": row[4],
                "phone_number": row[5],
                "duration_seconds": row[6],
                "transcript": row[7],
                "extracted_data": row[8],
                "outcome": row[9],
                "failure_reason": row[10],
                "compliance_violation": row[11],
                "compliance_notes": row[12],
                "called_at": row[13],
                "management_score": row[14],
                "noise_score": row[15],
                "value_score": row[16],
                "flexibility_score": row[17],
                "overall_score": row[18],
            }
            for row in transcripts
        ],
        "viewings": viewings,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True
    )
