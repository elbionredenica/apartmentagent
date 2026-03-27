from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List, Dict, Any
import uuid

from src.config import settings
from src.db import db
from src.aerospike_client import aerospike_client
from src.orchestrator import orchestrator
from src.models import ListingState, ListingStatus, User, Listing

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    print("🚀 Starting ApartmentAgent Backend...")
    await db.connect()
    aerospike_client.connect()
    print("✅ All systems ready!")
    
    yield
    
    # Shutdown
    print("👋 Shutting down...")
    await db.disconnect()
    aerospike_client.disconnect()

app = FastAPI(
    title="ApartmentAgent API",
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

@app.get("/")
async def root():
    return {
        "message": "ApartmentAgent API",
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
    user_row = await db.fetchrow(
        "SELECT * FROM users WHERE id = %s",
        user_id
    )
    
    if not user_row:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = dict(zip(['id', 'email', 'created_at', 'max_budget', 'min_bedrooms', 'max_bedrooms',
                     'has_pet', 'pet_type', 'pet_weight_lbs', 'dealbreakers', 'preferences',
                     'learned_preferences'], user_row))
    return user

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
    
    # Convert rows to dicts
    listings = []
    for row in rows:
        listings.append({
            'id': row[0],
            'external_id': row[1],
            'source': row[2],
            'address': row[3],
            'city': row[4],
            'state': row[5],
            'zip_code': row[6],
            'bedrooms': row[7],
            'bathrooms': row[8],
            'rent': row[9],
            'deposit': row[10],
            'square_feet': row[11],
            'phone': row[12],
            'email': row[13],
            'property_manager': row[14],
            'description': row[15],
            'amenities': row[16],
            'photos': row[17]
        })
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
    
    # Start LangGraph workflow in background
    async def run_workflow():
        initial_state = ListingState(
            listing_id=listing_id,
            user_id=user_id,
            status=ListingStatus.DISCOVERED
        )
        
        thread_id = f"{user_id}:{listing_id}"
        
        try:
            result = await orchestrator.ainvoke(
                initial_state.dict(),
                config={"configurable": {"thread_id": thread_id}}
            )
            
            # Update final state in Ghost
            await db.execute("""
                UPDATE user_listing_states
                SET status = %s, failure_reason = %s, last_updated_at = NOW()
                WHERE user_id = %s AND listing_id = %s
            """, result['status'], result.get('failure_reason'), user_id, listing_id)
            
            print(f"✅ Workflow completed for {listing_id}: {result['status']}")
            
        except Exception as e:
            print(f"❌ Workflow failed for {listing_id}: {e}")
            await db.execute("""
                UPDATE user_listing_states
                SET status = 'failed', failure_reason = 'WORKFLOW_ERROR', last_updated_at = NOW()
                WHERE user_id = %s AND listing_id = %s
            """, user_id, listing_id)
    
    background_tasks.add_task(run_workflow)
    
    return {
        "message": "Processing started",
        "listing_id": listing_id,
        "user_id": user_id,
        "thread_id": f"{user_id}:{listing_id}"
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
async def demo_status():
    """Get status of all listings for demo"""
    listings = await db.fetch("""
        SELECT 
            l.id,
            l.address,
            l.rent,
            l.bedrooms,
            uls.status,
            uls.failure_reason,
            COUNT(ct.id) as call_count
        FROM listings l
        LEFT JOIN user_listing_states uls ON uls.listing_id = l.id
        LEFT JOIN call_transcripts ct ON ct.listing_id = l.id
        GROUP BY l.id, l.address, l.rent, l.bedrooms, uls.status, uls.failure_reason
        ORDER BY l.first_seen_at DESC
    """)
    
    result = []
    for row in listings:
        result.append({
            'id': row[0],
            'address': row[1],
            'rent': row[2],
            'bedrooms': row[3],
            'status': row[4],
            'failure_reason': row[5],
            'call_count': row[6]
        })
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True
    )
