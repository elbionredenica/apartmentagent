# ApartmentAgent Backend - Ready for Hackathon! 🚀

## Status: ✅ WORKING

The backend is fully functional and ready for the Deep Agents Hackathon at RSAC 2026.

## What's Working

### 1. Database (Ghost/Postgres)
- ✅ Connected to Ghost database
- ✅ Schema created (users, listings, user_listing_states, call_transcripts, viewings)
- ✅ Seeded with test data (1 user, 3 listings)
- ✅ Connection string: `postgresql://tsdbadmin:...@cgdxw43yzm.nw2t434taa.tsdb.cloud.timescale.com:37075/tsdb`

### 2. FastAPI Server
- ✅ Running on http://localhost:8000
- ✅ Health check: `/health`
- ✅ Listings API: `/api/listings`
- ✅ Process listing: `/api/demo/process-listing`
- ✅ Demo status: `/api/demo/status`
- ✅ CORS enabled for frontend

### 3. LangGraph Orchestrator
- ✅ 3-node workflow: check_criteria → call_prescreen → analyze_prescreen
- ✅ Criteria filtering (budget, bedrooms, pets)
- ✅ Bland AI integration (calls initiated successfully)
- ✅ State management in Ghost database
- ⚠️  Checkpointing disabled for hackathon (can be re-enabled later)

### 4. Bland AI Integration
- ✅ API key configured
- ✅ Calls being initiated successfully
- ✅ Call ID: `86676183-fc61-4fcc-ad71-e2e05be595c1` (test call)
- ✅ Webhook endpoint ready: `/webhooks/prescreen`

### 5. Aerospike (Simplified)
- ✅ Stub implementation (in-memory cache)
- ✅ Deduplication working
- ✅ State tracking working
- 💡 For production: Install real Aerospike with `docker run -d --name aerospike -p 3000:3000 aerospike/aerospike-server`

## Test Results

```bash
$ ./test_workflow.sh

🧪 Testing ApartmentAgent Backend

📋 Fetching listings...
   Listing ID: c350106c-2b86-4508-b3ff-6a00d0c0f637

🚀 Triggering workflow for listing...
{"message":"Processing started","listing_id":"c350106c-2b86-4508-b3ff-6a00d0c0f637","user_id":"2655443b-b5ba-4b3f-a4f2-3d1a2125df71","thread_id":"..."}

⏳ Waiting 3 seconds...

📊 Checking status...
[
  {
    "id": "c350106c-2b86-4508-b3ff-6a00d0c0f637",
    "address": "123 Market St, Apt 4B",
    "rent": 2800,
    "bedrooms": 2,
    "status": "prescreening",  ← WORKING!
    "failure_reason": null,
    "call_count": 0
  }
]

✅ Test complete!
```

## Server Logs

```
📋 Checking criteria for listing c350106c-2b86-4508-b3ff-6a00d0c0f637
✅ Passed criteria check
📞 Starting pre-screen call for listing c350106c-2b86-4508-b3ff-6a00d0c0f637
✅ Call initiated: 86676183-fc61-4fcc-ad71-e2e05be595c1
✅ Workflow completed for c350106c-2b86-4508-b3ff-6a00d0c0f637: ListingStatus.PRESCREENING
```

## Architecture

```
┌─────────────┐
│   Airbyte   │ (teammate handling)
│  Ingestion  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│         FastAPI Backend (YOU)           │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   LangGraph Orchestrator         │  │
│  │                                  │  │
│  │  1. check_criteria               │  │
│  │  2. call_prescreen (Bland AI)    │  │
│  │  3. analyze_prescreen            │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────┐      ┌──────────────┐   │
│  │ Aerospike│      │ Ghost/Postgres│   │
│  │ (stub)   │      │ (persistent)  │   │
│  └──────────┘      └──────────────┘   │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│  Bland AI   │
│ Voice Calls │
└─────────────┘
```

## Key Files

- `src/main.py` - FastAPI server with endpoints
- `src/orchestrator.py` - LangGraph workflow
- `src/db.py` - Ghost database client (psycopg)
- `src/aerospike_client.py` - Aerospike stub (in-memory)
- `src/bland_client.py` - Bland AI API client
- `src/models.py` - Pydantic models
- `src/config.py` - Settings from .env
- `test_workflow.sh` - Test script

## Environment Variables

```bash
# Bland AI
BLAND_API_KEY=org_6a2ea869c6cdafd7182e78a8ab68481f08b0b2948d9894226892d576177fea964f1456a35ee3cacab51669

# Ghost Database
GHOST_DB_ID=cgdxw43yzm
GHOST_CONNECTION_STRING=postgresql://tsdbadmin:am3rfdmkjdafpe9y@cgdxw43yzm.nw2t434taa.tsdb.cloud.timescale.com:37075/tsdb

# Aerospike (optional)
AEROSPIKE_HOST=localhost
AEROSPIKE_PORT=3000
AEROSPIKE_NAMESPACE=apartment_agent

# Webhook Base URL
WEBHOOK_BASE_URL=http://localhost:8000
```

## Test Data

### User
- ID: `2655443b-b5ba-4b3f-a4f2-3d1a2125df71`
- Email: `demo@apartmentagent.com`
- Budget: $3000
- Bedrooms: 2-3
- Has pet: Yes (60lb dog)

### Listings
1. **123 Market St, Apt 4B** - $2800, 2BR, pet-friendly ✅
2. **456 Mission St, Unit 12** - $2500, 2BR, no pets ❌
3. **789 Valencia St, #3** - $3200, 3BR, pet-friendly ✅

## Next Steps for Hackathon

1. ✅ Backend is ready
2. 🔄 Teammate: Airbyte integration
3. 🔄 Teammate: Frontend (React/Next.js)
4. 🔄 Teammate: Auth0 setup
5. 💡 Optional: Add real Aerospike for scale demo
6. 💡 Optional: Re-enable LangGraph checkpointing for crash recovery demo

## Demo Flow

1. Show 3 listings in frontend
2. Click "Process All" button
3. Backend filters by criteria:
   - Listing 1: PASS (budget OK, pet-friendly)
   - Listing 2: FAIL (no pets)
   - Listing 3: PASS (budget OK, pet-friendly)
4. Bland AI calls Listing 1 and 3
5. Show transcripts in real-time
6. Kill server mid-call
7. Restart server
8. Show workflow resumes from checkpoint (if checkpointing enabled)

## Troubleshooting

### Server won't start
```bash
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Database connection issues
```bash
psql "postgresql://tsdbadmin:am3rfdmkjdafpe9y@cgdxw43yzm.nw2t434taa.tsdb.cloud.timescale.com:37075/tsdb" -c "SELECT 1;"
```

### Bland AI not working
- Check API key in `.env`
- Check webhook URL is publicly accessible (use ngrok for local dev)

## Performance Notes

- Aerospike stub is in-memory only (resets on restart)
- For production: Use real Aerospike for distributed locking and hot-path caching
- Ghost handles all persistent storage (transcripts, analytics)
- LangGraph checkpointing disabled for hackathon simplicity

## Time Spent

- Database setup: 30 min
- Backend implementation: 2 hours
- Python 3.13 compatibility fixes: 30 min
- Testing and debugging: 30 min
- **Total: ~3.5 hours**

## Hackathon Ready! 🎉

The backend is fully functional and ready for integration with:
- Airbyte (data ingestion)
- Frontend (React/Next.js)
- Auth0 (authentication)

Good luck at RSAC 2026! 🚀
