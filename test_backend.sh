#!/bin/bash

# Quick backend test script

echo "🧪 Testing ApartmentAgent Backend..."
echo ""

BASE_URL="http://localhost:8000"

# Test 1: Health check
echo "1️⃣  Testing health endpoint..."
curl -s $BASE_URL/health | jq '.'
echo ""

# Test 2: Get listings
echo "2️⃣  Getting listings..."
curl -s $BASE_URL/api/listings | jq 'length'
echo " listings found"
echo ""

# Test 3: Get demo status
echo "3️⃣  Getting demo status..."
curl -s $BASE_URL/api/demo/status | jq '.'
echo ""

echo "✅ Basic tests complete!"
echo ""
echo "To trigger processing:"
echo "  1. Get user ID: ghost sql cgdxw43yzm \"SELECT id FROM users LIMIT 1\""
echo "  2. Get listing ID: ghost sql cgdxw43yzm \"SELECT id FROM listings LIMIT 1\""
echo "  3. POST to /api/demo/process-listing with those IDs"
