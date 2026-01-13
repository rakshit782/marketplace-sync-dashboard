@echo off
echo ====================================
echo Seeding Test Data - Windows
echo ====================================
echo.

echo [1/4] Registering test user...
curl -X POST http://localhost:3001/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"TestPass123!\",\"fullName\":\"Test User\",\"organizationName\":\"Test Company\"}"

echo.
echo.
echo [2/4] Adding marketplace credentials...
docker exec marketplace-sync-postgres psql -U postgres -d marketplace_credentials -c "INSERT INTO api_credentials (organization_id, marketplace, credentials, created_by) VALUES (1, 'amazon', '{\"clientId\": \"test-amazon-id\", \"clientSecret\": \"test-amazon-secret\", \"refreshToken\": \"test-token\", \"sellerId\": \"TEST_SELLER\", \"marketplaceId\": \"ATVPDKIKX0DER\"}'::jsonb, 1) ON CONFLICT DO NOTHING;"

echo.
echo [3/4] Adding sample products...
cd local-api
node -e "const { DynamoDBClient } = require('@aws-sdk/client-dynamodb'); const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb'); const client = new DynamoDBClient({ region: 'us-east-1', endpoint: 'http://localhost:8000', credentials: { accessKeyId: 'local', secretAccessKey: 'local' } }); const docClient = DynamoDBDocumentClient.from(client); (async () => { const products = [{ PK: 'ORG#1#PRODUCT#ABC123', SK: 'METADATA', organizationId: 1, sku: 'ABC123', marketplace: 'amazon', title: 'Sample Product 1', price: 29.99, currency: 'USD', inventory_quantity: 100, image_url: 'https://via.placeholder.com/200', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { PK: 'ORG#1#PRODUCT#DEF456', SK: 'METADATA', organizationId: 1, sku: 'DEF456', marketplace: 'walmart', title: 'Sample Product 2', price: 49.99, currency: 'USD', inventory_quantity: 50, image_url: 'https://via.placeholder.com/200', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]; for (const product of products) { await docClient.send(new PutCommand({ TableName: 'MarketplaceSyncStack-ProductsTable', Item: product })); } console.log('Products added!'); })();"
cd ..

echo.
echo [4/4] Done!
echo.
echo ====================================
echo Test data seeded successfully!
echo ====================================
echo.
echo Login credentials:
echo   Email:    test@example.com
echo   Password: TestPass123!
echo.
echo Open: http://localhost:5173
echo.
pause
