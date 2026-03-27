#!/bin/bash

# Test script that will actually call +14155038032 (your phone)

echo "📞 ApartmentAgent - Real Call Test"
echo "=================================="
echo ""
echo "⚠️  WARNING: This will make a REAL phone call to +14155038032"
echo ""
read -p "Press ENTER to continue or Ctrl+C to cancel..."
echo ""

# User and listing IDs
USER_ID="2655443b-b5ba-4b3f-a4f2-3d1a2125df71"

# Get first listing (123 Market St - pet-friendly, should PASS criteria)
echo "📋 Fetching listings..."
LISTING_ID=$(curl -s http://localhost:8000/api/listings | jq -r '.[0].id')
LISTING_ADDRESS=$(curl -s http://localhost:8000/api/listings | jq -r '.[0].address')
echo "   Listing: $LISTING_ADDRESS"
echo "   ID: $LISTING_ID"
echo ""

# Trigger processing
echo "🚀 Triggering workflow..."
echo "   This will:"
echo "   1. Check criteria (budget, bedrooms, pets)"
echo "   2. If PASS → Call +14155038032 via Bland AI"
echo "   3. You'll receive a call asking about the apartment"
echo ""

RESPONSE=$(curl -s -X POST "http://localhost:8000/api/demo/process-listing?listing_id=$LISTING_ID&user_id=$USER_ID")
echo "$RESPONSE" | jq '.'
echo ""

# Extract thread ID
THREAD_ID=$(echo "$RESPONSE" | jq -r '.thread_id')

echo "⏳ Waiting for workflow to process..."
echo "   (Criteria check → Bland AI call initiation)"
sleep 5
echo ""

# Check status
echo "📊 Current status:"
curl -s http://localhost:8000/api/demo/status | jq '.[] | select(.id == "'$LISTING_ID'")'
echo ""

echo "📱 Expected behavior:"
echo "   - If criteria PASS: You should receive a call within 30 seconds"
echo "   - The AI will ask about:"
echo "     1. Is the unit still available?"
echo "     2. Pet policy (60lb dog allowed?)"
echo "     3. Is the building quiet during work hours?"
echo ""
echo "   - Answer as the landlord/property manager"
echo "   - The call will be recorded and transcribed"
echo ""

echo "💡 To check call status:"
echo "   curl http://localhost:8000/api/demo/status | jq '.'"
echo ""

echo "💡 To view transcript after call:"
echo "   curl \"http://localhost:8000/api/listings/$LISTING_ID/transcripts?user_id=$USER_ID\" | jq '.'"
echo ""

echo "✅ Test initiated!"
echo ""
echo "🎭 Role-play tips (you're the landlord):"
echo "   - Be friendly and professional"
echo "   - Answer: 'Yes, it's available'"
echo "   - Answer: 'Yes, we allow dogs up to 75 pounds'"
echo "   - Answer: 'Very quiet, most residents work from home'"
echo ""
echo "   This should result in: PASS → Prescreened"
