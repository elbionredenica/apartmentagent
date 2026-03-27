# ApartmentAgent API Reference

Base URL: `http://localhost:8000`

## Endpoints

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "database": "connected",
  "aerospike": "connected"
}
```

### Get All Listings
```bash
GET /api/listings
GET /api/listings?user_id={user_id}  # Filter by user
```

Response:
```json
[
  {
    "id": "c350106c-2b86-4508-b3ff-6a00d0c0f637",
    "external_id": "zillow-123",
    "source": "zillow",
    "address": "123 Market St, Apt 4B",
    "city": "San Francisco",
    "state": "CA",
    "rent": 2800,
    "bedrooms": 2,
    "bathrooms": 2.0,
    "phone": "+14155551234",
    "description": "Beautiful 2BR apartment..."
  }
]
```

### Get User
```bash
GET /api/users/{user_id}
```

Response:
```json
{
  "id": "2655443b-b5ba-4b3f-a4f2-3d1a2125df71",
  "email": "demo@apartmentagent.com",
  "max_budget": 3000,
  "min_bedrooms": 2,
  "max_bedrooms": 3,
  "has_pet": true,
  "pet_type": "dog",
  "pet_weight_lbs": 60,
  "dealbreakers": ["no_pets", "ground_floor_only"],
  "preferences": {},
  "learned_preferences": {}
}
```

### Process Listing (Trigger Workflow)
```bash
POST /api/demo/process-listing?listing_id={listing_id}&user_id={user_id}
```

Response:
```json
{
  "message": "Processing started",
  "listing_id": "c350106c-2b86-4508-b3ff-6a00d0c0f637",
  "user_id": "2655443b-b5ba-4b3f-a4f2-3d1a2125df71",
  "thread_id": "2655443b-b5ba-4b3f-a4f2-3d1a2125df71:c350106c-2b86-4508-b3ff-6a00d0c0f637"
}
```

### Get Demo Status
```bash
GET /api/demo/status
```

Response:
```json
[
  {
    "id": "c350106c-2b86-4508-b3ff-6a00d0c0f637",
    "address": "123 Market St, Apt 4B",
    "rent": 2800,
    "bedrooms": 2,
    "status": "prescreening",
    "failure_reason": null,
    "call_count": 0
  }
]
```

### Get Call Transcripts
```bash
GET /api/listings/{listing_id}/transcripts?user_id={user_id}
```

Response:
```json
[
  {
    "id": "...",
    "user_id": "...",
    "listing_id": "...",
    "call_type": "prescreen",
    "transcript": "Agent: Hello, I'm calling about...",
    "outcome": "PASS"
  }
]
```

### Webhook (Bland AI Callback)
```bash
POST /webhooks/prescreen
Content-Type: application/json

{
  "call_id": "86676183-fc61-4fcc-ad71-e2e05be595c1",
  "concatenated_transcript": "Full transcript here...",
  "metadata": {
    "listing_id": "c350106c-2b86-4508-b3ff-6a00d0c0f637",
    "user_id": "2655443b-b5ba-4b3f-a4f2-3d1a2125df71",
    "call_type": "prescreen"
  }
}
```

Response:
```json
{
  "status": "received"
}
```

## Listing Status Values

- `discovered` - New listing found
- `queued_for_prescreen` - Passed criteria check, ready for call
- `prescreening` - Bland AI call in progress
- `prescreened` - Call completed, passed
- `failed` - Failed at some stage

## Failure Reasons

- `LISTING_OR_USER_NOT_FOUND` - Invalid IDs
- `PRICE` - Rent exceeds budget
- `BEDROOMS` - Bedroom count out of range
- `PETS` - Pet policy doesn't match
- `NO_PHONE` - No phone number available
- `CALL_FAILED` - Bland AI call failed
- `UNAVAILABLE` - Unit not available
- `NO_TRANSCRIPT` - Transcript missing
- `WORKFLOW_ERROR` - Internal error

## Test User & Listings

### Test User
```
ID: 2655443b-b5ba-4b3f-a4f2-3d1a2125df71
Email: demo@apartmentagent.com
Budget: $3000
Bedrooms: 2-3
Pet: 60lb dog
```

### Test Listings
```
1. c350106c-2b86-4508-b3ff-6a00d0c0f637 - 123 Market St, $2800, 2BR, pet-friendly
2. 373b689c-f181-42f6-8cba-71774ffc50bf - 456 Mission St, $2500, 2BR, no pets
3. 5f235724-57a6-40da-8ea5-e13c14e26534 - 789 Valencia St, $3200, 3BR, pet-friendly
```

## Example: Process All Listings

```bash
#!/bin/bash

USER_ID="2655443b-b5ba-4b3f-a4f2-3d1a2125df71"

# Get all listings
LISTINGS=$(curl -s http://localhost:8000/api/listings | jq -r '.[].id')

# Process each listing
for LISTING_ID in $LISTINGS; do
  echo "Processing $LISTING_ID..."
  curl -X POST "http://localhost:8000/api/demo/process-listing?listing_id=$LISTING_ID&user_id=$USER_ID"
  echo ""
done

# Check status
sleep 3
curl -s http://localhost:8000/api/demo/status | jq '.'
```

## CORS

CORS is enabled for all origins (`*`). In production, update to specific frontend URL:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Rate Limiting

No rate limiting currently implemented. For production, add:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/demo/process-listing")
@limiter.limit("10/minute")
async def process_listing(...):
    ...
```

## Authentication

No authentication currently implemented. For production, integrate Auth0:

```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def verify_token(credentials: HTTPBearer = Depends(security)):
    # Verify Auth0 token
    ...

@app.post("/api/demo/process-listing")
async def process_listing(..., token = Depends(verify_token)):
    ...
```
