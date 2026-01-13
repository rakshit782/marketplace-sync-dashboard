#!/bin/bash

# Test API endpoints

if [ -z "$1" ]; then
  echo "Usage: ./test-api.sh <API_URL>"
  echo "Example: ./test-api.sh https://xxxxx.execute-api.us-east-1.amazonaws.com/prod"
  exit 1
fi

API_URL=$1

echo "🧪 Testing Marketplace Sync API"
echo "API URL: $API_URL"
echo ""

# Test Amazon Products Fetch
echo "📦 Test 1: Fetch Amazon Products"
curl -X POST "${API_URL}/api/amazon/products" \
  -H "Content-Type: application/json" \
  -d '{"pageSize": 5}' \
  -w "\nStatus: %{http_code}\n\n"

# Test Walmart Products Fetch
echo "📦 Test 2: Fetch Walmart Products"
curl -X GET "${API_URL}/api/walmart/products?limit=5" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# Test Amazon Inventory
echo "📊 Test 3: Get Amazon Inventory"
curl -X GET "${API_URL}/api/amazon/inventory" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# Test Walmart Inventory
echo "📊 Test 4: Get Walmart Inventory (requires SKU)"
echo "Skipping - requires SKU parameter"
echo ""

echo "✅ API tests completed"