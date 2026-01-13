#!/bin/bash

set -e

echo "🧪 Testing Localhost Deployment"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected="$3"
    
    echo -n "Testing $name... "
    
    response=$(curl -s "$url" || echo "ERROR")
    
    if echo "$response" | grep -q "$expected"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "  Expected: $expected"
        echo "  Got: $response"
        ((FAILED++))
    fi
}

# Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 3

echo ""
echo "📍 Testing API Endpoints"
echo "───────────────────────────────────────────────────────────"

# Test health endpoint
test_endpoint "Health Check" "http://localhost:3001/health" "healthy"

# Test frontend
echo -n "Testing Frontend... "
if curl -s http://localhost:5173 | grep -q "<!DOCTYPE html>"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

echo ""
echo "🗄️  Testing Databases"
echo "───────────────────────────────────────────────────────────"

# Test PostgreSQL
echo -n "Testing PostgreSQL... "
if psql postgresql://postgres:postgres@localhost:5432/marketplace_credentials -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

# Test DynamoDB
echo -n "Testing DynamoDB... "
if curl -s http://localhost:8000 | grep -q "DynamoDB"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

echo ""
echo "👤 Testing Authentication"
echo "───────────────────────────────────────────────────────────"

# Register test user
echo -n "Testing User Registration... "
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Test123!",
    "fullName": "Test User",
    "organizationName": "Test Org"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

# Login test user
echo -n "Testing User Login... "
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Test123!"
  }')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

echo ""
echo "📦 Testing Product API"
echo "───────────────────────────────────────────────────────────"

# Test products endpoint
if [ ! -z "$TOKEN" ]; then
    echo -n "Testing List Products... "
    PRODUCTS_RESPONSE=$(curl -s http://localhost:3001/api/products \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$PRODUCTS_RESPONSE" | grep -q "success"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED++))
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📊 Test Results"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Your localhost deployment is working!${NC}"
    echo ""
    echo "You can now:"
    echo "  1. Open http://localhost:5173"
    echo "  2. Login with: test@example.com / TestPass123!"
    echo "  3. Explore the dashboard"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the logs above.${NC}"
    exit 1
fi