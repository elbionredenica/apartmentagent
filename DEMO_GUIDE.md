# ApartmentAgent Demo Guide - Live Calls! 📞

## Your Phone Number
All listings are configured to call: **+1 (415) 503-8032**

## Test Listings

### Listing 1: 123 Market St, Apt 4B
- **Rent**: $2,800
- **Bedrooms**: 2
- **Description**: "Pet-friendly building. Quiet neighborhood."
- **Criteria Check**: ✅ PASS
  - Rent $2,800 < Budget $3,000 ✅
  - 2BR in range 2-3 ✅
  - Pet-friendly ✅
- **Expected**: **YOU WILL RECEIVE A CALL** 📞

### Listing 2: 456 Mission St, Unit 12
- **Rent**: $2,500
- **Bedrooms**: 2
- **Description**: "No pets allowed. Great for professionals."
- **Criteria Check**: ❌ FAIL
  - Rent OK ✅
  - Bedrooms OK ✅
  - "No pets allowed" in description ❌
- **Expected**: No call (filtered out)

### Listing 3: 789 Valencia St, #3
- **Rent**: $3,200
- **Bedrooms**: 3
- **Description**: "Pet-friendly with dog park."
- **Criteria Check**: ❌ FAIL
  - Rent $3,200 > Budget $3,000 ❌
- **Expected**: No call (filtered out)

## User Profile (Criteria)
```
Budget: $3,000
Bedrooms: 2-3
Pet: 60lb dog
Dealbreakers: no_pets, ground_floor_only
```

## Quick Test (Single Listing)

```bash
./test_real_call.sh
```

This will:
1. Process Listing 1 (123 Market St)
2. Check criteria → PASS
3. Initiate Bland AI call to +14155038032
4. **You'll receive a call within 30 seconds**

## Full Test (All Listings)

```bash
./test_all_listings.sh
```

This will:
1. Process all 3 listings
2. Only Listing 1 passes criteria
3. **You'll receive 1 call** (for Listing 1)
4. Listings 2 & 3 are filtered out

## What to Expect on the Call

### The AI Agent Will Say:
```
"Hello, I'm calling on behalf of a client who's interested in 
the 2-bedroom apartment at 123 Market Street, Apartment 4B.

I have a few quick questions:

1. Is the unit still available?
2. My client has a 60-pound dog - is that allowed?
3. How quiet is the building during work hours, say 9am to 5pm?

This should only take about 90 seconds."
```

### Your Role (Act as Landlord):
Answer naturally as if you're the property manager:

**Scenario A: PASS (Listing qualifies)**
- Q: "Is it available?" → "Yes, it's available"
- Q: "60lb dog allowed?" → "Yes, we allow dogs up to 75 pounds"
- Q: "Quiet during work hours?" → "Very quiet, most residents work from home"
- **Result**: Status → `prescreened` (qualified for viewing)

**Scenario B: FAIL (Listing disqualified)**
- Q: "Is it available?" → "No, it was just rented yesterday"
- **Result**: Status → `failed:UNAVAILABLE`

OR

- Q: "60lb dog allowed?" → "Sorry, no dogs over 25 pounds"
- **Result**: Status → `failed:PETS`

## Checking Results

### View Status
```bash
curl http://localhost:8000/api/demo/status | jq '.'
```

### View Transcript
```bash
USER_ID="2655443b-b5ba-4b3f-a4f2-3d1a2125df71"
LISTING_ID="<listing-id-from-status>"

curl "http://localhost:8000/api/listings/$LISTING_ID/transcripts?user_id=$USER_ID" | jq '.'
```

## Workflow Visualization

```
┌─────────────────────────────────────────────────────────┐
│ NEW LISTING: 123 Market St, $2800, 2BR, pet-friendly   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  CHECK CRITERIA       │
         │  • Budget: $2800 < $3000 ✅
         │  • Bedrooms: 2 in 2-3 ✅
         │  • Pets: "pet-friendly" ✅
         └───────────┬───────────┘
                     │ PASS
                     ▼
         ┌───────────────────────┐
         │  BLAND AI CALL        │
         │  Phone: +14155038032  │
         │  Duration: ~90 sec    │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  ANALYZE TRANSCRIPT   │
         │  • Available? Yes ✅   │
         │  • Pets OK? Yes ✅     │
         │  • Quiet? Yes ✅       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  STATUS: PRESCREENED  │
         │  Ready for viewing!   │
         └───────────────────────┘
```

## Troubleshooting

### "No call received"
1. Check server logs: Look for "✅ Call initiated: [call_id]"
2. Check Bland AI dashboard: https://app.bland.ai/calls
3. Verify phone number: Should be +14155038032
4. Check criteria: Listing must PASS all checks

### "Call failed"
- Check Bland AI API key in `.env`
- Check Bland AI account has credits
- Check phone number format (E.164: +14155038032)

### "Transcript not showing"
- Webhook might not be configured
- Check webhook URL in Bland AI dashboard
- For local testing, use ngrok: `ngrok http 8000`

## Bland AI Dashboard

View all calls: https://app.bland.ai/calls

You can:
- Listen to recordings
- View transcripts
- See call duration
- Check call status

## Demo Tips

### For Hackathon Judges:
1. Show the 3 listings
2. Explain the user profile (budget, bedrooms, pet)
3. Click "Process All"
4. Show real-time filtering:
   - Listing 1: ✅ PASS → Call initiated
   - Listing 2: ❌ FAIL (no pets)
   - Listing 3: ❌ FAIL (too expensive)
5. **Answer the call live** (put on speaker)
6. Show transcript appearing in real-time
7. Show final status: `prescreened`

### Talking Points:
- "This is a REAL phone call happening right now"
- "The AI is checking dealbreakers in under 90 seconds"
- "This saves apartment hunters 10+ hours per week"
- "Landlords prefer this over 50 spam calls"
- "Fair Housing compliant - no discriminatory questions"

## Advanced: Webhook Testing

If you want to test webhooks locally:

1. Install ngrok: `brew install ngrok`
2. Start ngrok: `ngrok http 8000`
3. Update `.env`: `WEBHOOK_BASE_URL=https://abc123.ngrok.io`
4. Restart server
5. Bland AI will now send webhooks to your local machine

## Next Steps

After successful demo:
- Add more listings
- Test different user profiles
- Add deep-screen call (4-6 minutes)
- Add viewing scheduler
- Integrate with calendar (Auth0 + Google Calendar)

## Support

- Bland AI Docs: https://docs.bland.ai
- LangGraph Docs: https://langchain-ai.github.io/langgraph/
- Ghost Database: https://ghost.io

---

**Ready to test?** Run `./test_real_call.sh` and answer your phone! 📱
