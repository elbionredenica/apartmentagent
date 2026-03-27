# Bland AI Voice Agent Integration

## Installation via Shipables

Shipables provides production-ready agent skills for Bland AI:

```bash
# Install Bland AI skill from Shipables
npx @senso-ai/shipables install spencerjsmall/bland-ai
```

This installs the complete Bland AI skill with:
- Voice agent setup patterns
- Pathways configuration
- Webhook handling
- Multi-agent orchestration
- Error recovery patterns

## Python SDK Installation
```bash
pip install bland-ai
```

## Basic Call

```python
from bland import BlandAI

client = BlandAI(api_key="your_key")

response = client.calls.create(
    phone_number="+14155551234",
    prompt="You are calling about an apartment listing...",
    voice="maya",  # Natural female voice
    webhook_url="https://your-api.com/webhook"
)

print(response.call_id)
```

## Multi-Agent Setup

```python
# Agent 1: Pre-screener (fast)
prescreen_agent = {
    "prompt": """You are a professional assistant calling about an apartment.
    
Your goal: Quickly check if the listing meets basic requirements.

Questions to ask:
1. Is the unit still available?
2. What is the pet policy? (weight limits, breeds)
3. Is the building quiet during work hours?
4. Does the rent include utilities?

If any answer is a dealbreaker, politely end the call.
Keep the call under 60 seconds.""",
    "voice": "maya",
    "max_duration": 90
}

# Agent 2: Deep screener (thorough)
deepscreen_agent = {
    "prompt": """You are following up on an apartment that passed initial screening.

Your goal: Assess quality and management.

Questions to ask:
1. How quickly does management respond to maintenance? (1-10 scale)
2. Any pest issues in the past year?
3. How thick are the walls?
4. Has rent increased recently?
5. Lease flexibility after first year?
6. Parking situation?
7. Move-in costs breakdown?

Be conversational and adapt based on answers.""",
    "voice": "maya",
    "max_duration": 360
}
```

## Pathways (Conditional Logic)

```python
pathway = {
    "nodes": [
        {
            "id": "check_availability",
            "prompt": "Is the unit still available?",
            "extract": {"available": "boolean"}
        },
        {
            "id": "check_pets",
            "prompt": "What is your pet policy?",
            "extract": {
                "allows_pets": "boolean",
                "weight_limit": "number"
            },
            "condition": {
                "field": "available",
                "equals": True
            }
        },
        {
            "id": "end_call",
            "prompt": "Thank you for your time.",
            "condition": {
                "or": [
                    {"field": "available", "equals": False},
                    {"field": "allows_pets", "equals": False}
                ]
            }
        }
    ]
}

response = client.calls.create(
    phone_number="+14155551234",
    pathway=pathway,
    webhook_url="https://your-api.com/webhook"
)
```

## Webhook Handling

```python
from flask import Flask, request

app = Flask(__name__)

@app.route("/webhook/prescreen", methods=["POST"])
def prescreen_webhook():
    data = request.json
    
    call_id = data["call_id"]
    transcript = data["transcript"]
    extracted = data["extracted_data"]
    
    # Store in database
    store_call_transcript(
        call_id=call_id,
        transcript=transcript,
        outcome=determine_outcome(extracted)
    )
    
    # Update LangGraph state
    update_listing_state(
        listing_id=data["metadata"]["listing_id"],
        status="prescreened"
    )
    
    return {"status": "ok"}
```

## Batch Calling

```python
# Call 20 listings simultaneously
calls = []
for listing in listings_to_call:
    call = client.calls.create(
        phone_number=listing.phone,
        prompt=generate_prompt(listing),
        metadata={
            "listing_id": listing.id,
            "user_id": user.id
        },
        webhook_url=f"{WEBHOOK_BASE}/prescreen"
    )
    calls.append(call)

print(f"Started {len(calls)} calls")
```
