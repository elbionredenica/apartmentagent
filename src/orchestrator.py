from langgraph.graph import StateGraph, END
from langgraph.checkpoint.postgres import PostgresSaver
from typing import Dict, Any
import json
import asyncio

from src.models import ListingState, ListingStatus, CallOutcome
from src.db import db
from src.aerospike_client import aerospike_client
from src.bland_client import bland_client
from src.config import settings


def _get_public_webhook_url() -> str | None:
    """Only use webhook mode when we have a real public base URL."""
    base_url = settings.webhook_base_url.rstrip("/")
    if not base_url or "your-domain.com" in base_url or "localhost" in base_url:
        return None
    return f"{base_url}/webhooks/prescreen"


async def _store_transcript_once(
    user_id: str,
    listing_id: str,
    call_id: str,
    transcript: str,
    outcome: str = "PASS"
) -> None:
    """Persist the transcript once even if both polling and webhooks are enabled."""
    existing = await db.fetchval(
        "SELECT id FROM call_transcripts WHERE call_id = %s LIMIT 1",
        call_id
    )
    if existing:
        return

    await db.execute("""
        INSERT INTO call_transcripts (
            user_id, listing_id, call_type, call_id,
            transcript, outcome, called_at
        )
        VALUES (%s, %s, 'prescreen', %s, %s, %s, NOW())
    """, user_id, listing_id, call_id, transcript, outcome)


async def _wait_for_call_completion(call_id: str) -> Dict[str, Any]:
    """Poll Bland until the call completes or times out."""
    timeout_at = asyncio.get_event_loop().time() + settings.bland_poll_timeout_seconds

    while asyncio.get_event_loop().time() < timeout_at:
        call = await bland_client.get_call(call_id)
        status = (call.get("status") or "").lower()
        queue_status = (call.get("queue_status") or "").lower()
        if call.get("completed") or status in {"completed", "failed", "busy", "no-answer"} or queue_status == "complete":
            return call
        await asyncio.sleep(settings.bland_poll_interval_seconds)

    raise TimeoutError(f"Call {call_id} did not complete within timeout")

# Node functions
async def check_criteria_node(state: ListingState) -> Dict[str, Any]:
    """
    Text-based filtering before making calls.
    Check budget, bedrooms, and obvious dealbreakers in description.
    """
    print(f"📋 Checking criteria for listing {state.listing_id}")
    
    # Get listing and user from database
    listing_row = await db.fetchrow(
        "SELECT * FROM listings WHERE id = %s",
        state.listing_id
    )
    listing = dict(zip(['id', 'external_id', 'source', 'address', 'city', 'state', 'zip_code', 
                        'bedrooms', 'bathrooms', 'rent', 'deposit', 'square_feet', 'phone', 
                        'email', 'property_manager', 'description', 'amenities', 'photos', 
                        'raw_data', 'first_seen_at', 'last_updated_at', 'is_available'], 
                       listing_row)) if listing_row else None
    
    user_row = await db.fetchrow(
        "SELECT * FROM users WHERE id = %s",
        state.user_id
    )
    user = dict(zip(['id', 'email', 'created_at', 'max_budget', 'min_bedrooms', 'max_bedrooms',
                     'has_pet', 'pet_type', 'pet_weight_lbs', 'dealbreakers', 'preferences',
                     'learned_preferences'], user_row)) if user_row else None
    
    if not listing or not user:
        return {
            **state.dict(),
            "status": ListingStatus.FAILED,
            "failure_reason": "LISTING_OR_USER_NOT_FOUND",
            "next_action": "end"
        }
    
    # Check budget
    if listing['rent'] > user['max_budget']:
        print(f"❌ Failed: Rent ${listing['rent']} > budget ${user['max_budget']}")
        return {
            **state.dict(),
            "status": ListingStatus.FAILED,
            "failure_reason": "PRICE",
            "next_action": "end"
        }
    
    # Check bedrooms
    if listing['bedrooms'] < user['min_bedrooms'] or listing['bedrooms'] > user['max_bedrooms']:
        print(f"❌ Failed: {listing['bedrooms']}BR not in range {user['min_bedrooms']}-{user['max_bedrooms']}")
        return {
            **state.dict(),
            "status": ListingStatus.FAILED,
            "failure_reason": "BEDROOMS",
            "next_action": "end"
        }
    
    # Check pet policy in description
    if user['has_pet'] and listing['description']:
        desc_lower = listing['description'].lower()
        if 'no pets' in desc_lower or 'pets not allowed' in desc_lower:
            print(f"❌ Failed: Description says no pets")
            return {
                **state.dict(),
                "status": ListingStatus.FAILED,
                "failure_reason": "PETS",
                "next_action": "end"
            }
    
    print(f"✅ Passed criteria check")
    return {
        **state.dict(),
        "status": ListingStatus.QUEUED_FOR_PRESCREEN,
        "next_action": "call_prescreen"
    }

async def call_prescreen_node(state: ListingState) -> Dict[str, Any]:
    """
    Trigger Bland AI pre-screen call.
    Fast dealbreaker check (60-90 seconds).
    """
    print(f"📞 Starting pre-screen call for listing {state.listing_id}")
    
    # Get listing and user
    listing_row = await db.fetchrow(
        "SELECT * FROM listings WHERE id = %s",
        state.listing_id
    )
    listing = dict(zip(['id', 'external_id', 'source', 'address', 'city', 'state', 'zip_code', 
                        'bedrooms', 'bathrooms', 'rent', 'deposit', 'square_feet', 'phone', 
                        'email', 'property_manager', 'description', 'amenities', 'photos', 
                        'raw_data', 'first_seen_at', 'last_updated_at', 'is_available'], 
                       listing_row)) if listing_row else None
    
    user_row = await db.fetchrow(
        "SELECT * FROM users WHERE id = %s",
        state.user_id
    )
    user = dict(zip(['id', 'email', 'created_at', 'max_budget', 'min_bedrooms', 'max_bedrooms',
                     'has_pet', 'pet_type', 'pet_weight_lbs', 'dealbreakers', 'preferences',
                     'learned_preferences'], user_row)) if user_row else None
    
    if not listing['phone']:
        print(f"❌ No phone number for listing")
        return {
            **state.dict(),
            "status": ListingStatus.FAILED,
            "failure_reason": "NO_PHONE",
            "next_action": "end"
        }
    
    pet_line = (
        f'My client has a {user["pet_weight_lbs"]}-pound {user["pet_type"]}. '
        "Is that allowed in the building?"
        if user["has_pet"]
        else "Skip pet questions because the client does not have a pet."
    )

    opening_line = (
        f"Hi, I'm calling on behalf of a client who's interested in the apartment at "
        f"{listing['address']}. Do you have a moment to answer a few quick questions?"
    )

    # Build a tighter, more natural live-call prompt with exact per-call context.
    task = f"""You are making a short, natural outbound phone call on behalf of a renter.

Use this exact context for this call only:

Listing:
- Address: {listing['address']}
- City/state: {listing['city']}, {listing['state']}
- Rent: ${listing['rent']}
- Bedrooms: {listing['bedrooms']}

Renter:
- Budget cap: ${user['max_budget']}
- Bedroom target: {user['min_bedrooms']}-{user['max_bedrooms']}
- Pet details: {str(user['pet_weight_lbs']) + "-pound " + user['pet_type'] if user['has_pet'] else "no pet"}

Your tone:
- Sound like a normal, polite human assistant, not a robot.
- Speak casually but professionally.
- Keep each sentence short and easy to follow.
- Do not over-explain or announce what you are about to do.

Open with this exact sentence:
"{opening_line}"

After they say yes, move through the questions naturally:
- Ask whether the unit is still available.
- Ask: "{pet_line}"
- Ask how quiet it is during normal work hours, around 9 to 5.

Conversation rules:
- Ask one thing at a time and wait for the answer.
- If they already answer the next question early, acknowledge it and move on.
- If they interrupt, adapt naturally.
- Do not repeat the full address unless they ask.
- Do not mention any other address.
- Do not invent details.
- Keep the whole call under 90 seconds.

Ending rules:
- If the unit is unavailable, thank them and end the call.
- If pets are not allowed, thank them and end the call.
- If all three answers are collected, give a brief, natural recap in one sentence, thank them, and end the call.
- After saying goodbye, end the call cleanly without reopening the conversation.
"""
    
    # Only use webhook mode once the app is reachable from Bland.
    webhook_url = _get_public_webhook_url()
    
    try:
        # Trigger Bland AI call
        call_response = await bland_client.create_call(
            phone_number=listing['phone'],
            task=task,
            persona_id=settings.bland_persona_id,
            first_sentence=opening_line,
            metadata={
                "listing_id": state.listing_id,
                "user_id": state.user_id,
                "call_type": "prescreen"
            },
            webhook_url=webhook_url,
            max_duration=2
        )
        
        call_id = call_response.get('call_id')
        print(f"✅ Call initiated: {call_id}")
        
        # Update Aerospike with call status
        aerospike_client.update(
            "listing_states",
            f"user:{state.user_id}:listing:{state.listing_id}",
            {
                "status": "prescreening",
                "call_id": call_id
            }
        )

        if webhook_url:
            return {
                **state.dict(),
                "status": ListingStatus.PRESCREENING,
                "prescreen_call_id": call_id,
                "next_action": "wait_for_webhook"
            }

        # Local demo mode: poll Bland directly so the workflow can finish without deployment.
        completed_call = await _wait_for_call_completion(call_id)
        transcript = completed_call.get("concatenated_transcript", "").strip()

        if not transcript:
            print("❌ Call completed without a transcript")
            return {
                **state.dict(),
                "status": ListingStatus.FAILED,
                "prescreen_call_id": call_id,
                "failure_reason": "NO_TRANSCRIPT",
                "next_action": "end"
            }

        await _store_transcript_once(
            user_id=state.user_id,
            listing_id=state.listing_id,
            call_id=call_id,
            transcript=transcript
        )

        return {
            **state.dict(),
            "status": ListingStatus.PRESCREENING,
            "prescreen_call_id": call_id,
            "prescreen_transcript": transcript,
            "next_action": "analyze_prescreen"
        }
        
    except Exception as e:
        print(f"❌ Call failed: {e}")
        return {
            **state.dict(),
            "status": ListingStatus.FAILED,
            "failure_reason": "CALL_FAILED",
            "next_action": "end"
        }

async def analyze_prescreen_node(state: ListingState) -> Dict[str, Any]:
    """
    Analyze pre-screen transcript and decide next action.
    This gets called after webhook receives transcript.
    """
    print(f"🔍 Analyzing pre-screen transcript for listing {state.listing_id}")
    
    if not state.prescreen_transcript:
        print(f"❌ No transcript available")
        return {
            **state.dict(),
            "status": ListingStatus.FAILED,
            "failure_reason": "NO_TRANSCRIPT",
            "next_action": "end"
        }
    
    # Simple keyword-based analysis (in production, use Claude)
    transcript_lower = state.prescreen_transcript.lower()
    
    # Check availability
    if any(word in transcript_lower for word in ['not available', 'already rented', 'taken']):
        print(f"❌ Unit not available")
        return {
            **state.dict(),
            "status": ListingStatus.FAILED,
            "failure_reason": "UNAVAILABLE",
            "next_action": "end"
        }
    
    # Check pet policy
    user_row = await db.fetchrow("SELECT * FROM users WHERE id = %s", state.user_id)
    user = dict(zip(['id', 'email', 'created_at', 'max_budget', 'min_bedrooms', 'max_bedrooms',
                     'has_pet', 'pet_type', 'pet_weight_lbs', 'dealbreakers', 'preferences',
                     'learned_preferences'], user_row)) if user_row else None
    if user['has_pet']:
        if any(word in transcript_lower for word in ['no pets', 'no dogs', 'no animals']):
            print(f"❌ No pets allowed")
            return {
                **state.dict(),
                "status": ListingStatus.FAILED,
                "failure_reason": "PETS",
                "next_action": "end"
            }
    
    # Passed pre-screen
    print(f"✅ Passed pre-screen")
    return {
        **state.dict(),
        "status": ListingStatus.PRESCREENED,
        "next_action": "end"  # For hackathon, stop here. In production: "call_deepscreen"
    }

def route_after_criteria(state: ListingState) -> str:
    """Route based on criteria check result"""
    if state.next_action == "end":
        return "end"
    return "call_prescreen"

def route_after_prescreen(state: ListingState) -> str:
    """Route based on pre-screen result"""
    if state.next_action == "end":
        return "end"
    if state.next_action == "wait_for_webhook":
        return "end"  # Workflow pauses, resumes from webhook
    return "analyze_prescreen"

# Build the graph
def create_orchestrator():
    """Create LangGraph orchestrator with Postgres checkpointing"""
    
    # Build state graph
    graph = StateGraph(ListingState)
    
    # Add nodes
    graph.add_node("check_criteria", check_criteria_node)
    graph.add_node("call_prescreen", call_prescreen_node)
    graph.add_node("analyze_prescreen", analyze_prescreen_node)
    
    # Set entry point
    graph.set_entry_point("check_criteria")
    
    # Add conditional edges
    graph.add_conditional_edges(
        "check_criteria",
        route_after_criteria,
        {
            "call_prescreen": "call_prescreen",
            "end": END
        }
    )
    
    graph.add_conditional_edges(
        "call_prescreen",
        route_after_prescreen,
        {
            "analyze_prescreen": "analyze_prescreen",
            "end": END
        }
    )
    
    graph.add_edge("analyze_prescreen", END)
    
    # Compile WITHOUT checkpointing for now (hackathon simplification)
    # In production, add: checkpointer=PostgresSaver.from_conn_string(...)
    app = graph.compile()
    
    return app

# Global orchestrator instance
orchestrator = create_orchestrator()
