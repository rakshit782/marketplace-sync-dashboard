#!/bin/bash

set -e

echo "🌱 Seeding test data..."
echo ""

API_URL="http://localhost:3001"

# Register test user
echo "1️⃣  Registering test user..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "fullName": "Test User",
    "organizationName": "Test Company"
  }')

echo "✅ User registered"
echo ""

# Login
echo "2️⃣  Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
ORG_ID=$(echo $LOGIN_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi

echo "✅ Logged in (Token: ${TOKEN:0:20}...)"
echo ""

# Add test credentials to database
echo "3️⃣  Adding marketplace credentials..."
psql "postgresql://postgres:postgres@localhost:5432/marketplace_credentials" <<EOF
INSERT INTO api_credentials (organization_id, marketplace, credentials, created_by)
VALUES (
  $ORG_ID,
  'amazon',
  '{
    "clientId": "test-amazon-client-id",
    "clientSecret": "test-amazon-secret",
    "refreshToken": "test-refresh-token",
    "sellerId": "TEST_SELLER_ID",
    "marketplaceId": "ATVPDKIKX0DER"
  }'::jsonb,
  1
) ON CONFLICT (organization_id, marketplace) DO NOTHING;

INSERT INTO api_credentials (organization_id, marketplace, credentials, created_by)
VALUES (
  $ORG_ID,
  'walmart',
  '{
    "clientId": "test-walmart-client-id",
    "clientSecret": "test-walmart-secret"
  }'::jsonb,
  1
) ON CONFLICT (organization_id, marketplace) DO NOTHING;
EOF

echo "✅ Credentials added"
echo ""

# Add sample products to DynamoDB
echo "4️⃣  Adding sample products..."
node -e "
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000',
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' }
});
const docClient = DynamoDBDocumentClient.from(client);

const products = [
  {
    PK: 'ORG#$ORG_ID#PRODUCT#ABC123',
    SK: 'METADATA',
    organizationId: $ORG_ID,
    sku: 'ABC123',
    marketplace: 'amazon',
    asin: 'B08XYZ1234',
    title: 'Test Product 1',
    brand: 'Test Brand',
    category: 'Electronics',
    price: 29.99,
    currency: 'USD',
    inventory_quantity: 100,
    image_url: 'https://via.placeholder.com/200',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    PK: 'ORG#$ORG_ID#PRODUCT#DEF456',
    SK: 'METADATA',
    organizationId: $ORG_ID,
    sku: 'DEF456',
    marketplace: 'walmart',
    title: 'Test Product 2',
    brand: 'Test Brand',
    category: 'Home & Garden',
    price: 49.99,
    currency: 'USD',
    inventory_quantity: 50,
    image_url: 'https://via.placeholder.com/200',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

(async () => {
  for (const product of products) {
    await docClient.send(new PutCommand({
      TableName: 'MarketplaceSyncStack-ProductsTable',
      Item: product,
    }));
  }
  console.log('✅ Sample products added');
})();
"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Test data seeded successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📧 Email:    test@example.com"
echo "🔑 Password: TestPass123!"
echo "🏢 Organization: Test Company"
echo ""
echo "You can now login at: http://localhost:5173"
echo ""