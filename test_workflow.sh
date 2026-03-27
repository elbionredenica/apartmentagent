#!/bin/bash

# Test script for ApartmentAgent workflow

echo "🧪 Testing ApartmentAgent Backend"
echo ""

# Get user ID (first user from seed data)
USER_ID="2655443b-b5ba-4b3f-a4f2-3d1a2125df71"

# Get first listing
echo "📋 Fetching listings..."
LISTING_ID=$(curl -s http://localhost:8000/api/listings | jq -r '.[0].id')
echo "   Listing ID: $LISTING_ID"
echo ""

# Trigger processing
echo "🚀 Triggering workflow for listing..."
curl -X POST "http://localhost:8000/api/demo/process-listing?listing_id=$LISTING_ID&user_id=$USER_ID" \
  -H "Content-Type: application/json"
echo ""
echo ""

# Wait a bit
echo "⏳ Waiting 3 seconds..."
sleep 3
echo ""

# Check status
echo "📊 Checking status..."
curl -s http://localhost:8000/api/demo/status | jq '.'
echo ""

echo "✅ Test complete!"
