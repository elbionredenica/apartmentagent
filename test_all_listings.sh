#!/bin/bash

# Test all listings to see which ones match criteria and trigger calls

echo "🏢 ApartmentAgent - Process All Listings"
echo "========================================="
echo ""

USER_ID="2655443b-b5ba-4b3f-a4f2-3d1a2125df71"

echo "👤 User Profile:"
echo "   Budget: $3000"
echo "   Bedrooms: 2-3"
echo "   Pet: 60lb dog"
echo ""

echo "📋 Fetching listings..."
LISTINGS=$(curl -s http://localhost:8000/api/listings | jq -c '.[]')
echo ""

echo "🏠 Listings to process:"
echo "$LISTINGS" | jq -r '"   • " + .address + " - $" + (.rent|tostring) + ", " + (.bedrooms|tostring) + "BR, " + .description[0:50] + "..."'
echo ""

echo "⚠️  WARNING: This will make REAL phone calls to +14155038032 for listings that PASS criteria"
echo ""
read -p "Press ENTER to continue or Ctrl+C to cancel..."
echo ""

# Process each listing
echo "🚀 Processing listings..."
echo ""

COUNTER=1
echo "$LISTINGS" | while IFS= read -r listing; do
    LISTING_ID=$(echo "$listing" | jq -r '.id')
    ADDRESS=$(echo "$listing" | jq -r '.address')
    RENT=$(echo "$listing" | jq -r '.rent')
    BEDROOMS=$(echo "$listing" | jq -r '.bedrooms')
    DESCRIPTION=$(echo "$listing" | jq -r '.description')
    
    echo "[$COUNTER] Processing: $ADDRESS"
    echo "    Rent: \$$RENT, Bedrooms: $BEDROOMS"
    
    # Predict outcome
    WILL_PASS=false
    REASON=""
    
    if [ "$RENT" -gt 3000 ]; then
        REASON="❌ FAIL: Rent \$$RENT > Budget \$3000"
    elif [ "$BEDROOMS" -lt 2 ] || [ "$BEDROOMS" -gt 3 ]; then
        REASON="❌ FAIL: ${BEDROOMS}BR not in range 2-3"
    elif echo "$DESCRIPTION" | grep -qi "no pets"; then
        REASON="❌ FAIL: Description says 'no pets'"
    else
        REASON="✅ PASS: Will trigger Bland AI call to +14155038032"
        WILL_PASS=true
    fi
    
    echo "    Prediction: $REASON"
    
    # Trigger processing
    curl -s -X POST "http://localhost:8000/api/demo/process-listing?listing_id=$LISTING_ID&user_id=$USER_ID" > /dev/null
    
    if [ "$WILL_PASS" = true ]; then
        echo "    📞 Call will be initiated in ~5 seconds..."
    fi
    
    echo ""
    COUNTER=$((COUNTER + 1))
    sleep 2
done

echo "⏳ Waiting for workflows to complete..."
sleep 8
echo ""

echo "📊 Final Status:"
curl -s http://localhost:8000/api/demo/status | jq -r '.[] | "   • " + .address + " - Status: " + (.status // "not_processed") + (if .failure_reason then " (" + .failure_reason + ")" else "" end)'
echo ""

echo "✅ Processing complete!"
echo ""
echo "📱 Expected calls:"
echo "   - Listing 1 (123 Market St): ✅ PASS → You should receive a call"
echo "   - Listing 2 (456 Mission St): ❌ FAIL (no pets) → No call"
echo "   - Listing 3 (789 Valencia St): ❌ FAIL (rent too high) → No call"
echo ""
echo "💡 To view transcripts:"
echo "   curl \"http://localhost:8000/api/listings/{listing_id}/transcripts?user_id=$USER_ID\" | jq '.'"
