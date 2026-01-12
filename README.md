# Marketplace Sync Dashboard

Centralized dashboard to manage Amazon Seller Central and Walmart Seller Center listings, pricing, and inventory.

## Project Structure

This project uses a clean, modular architecture:

```
src/api/{marketplace}/{function}/
```

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for complete details.

## Features

- ✅ Modular API architecture (each endpoint = separate Lambda)
- ✅ Fetch products from Amazon SP-API and Walmart Marketplace API
- ✅ Get single product by SKU
- ✅ Update product listings (title, description, etc.)
- ✅ Get inventory levels
- ✅ Update pricing and inventory
- ✅ Shared authentication libraries with token caching
- ✅ DynamoDB for product storage
- ✅ AWS Parameter Store for secure credentials
- ✅ Automated sync jobs (EventBridge)

## Tech Stack

- **Backend**: AWS Lambda (Node.js 18.x)
- **API**: API Gateway REST API
- **Database**: DynamoDB (Free Tier: 25GB)
- **Authentication**: AWS Systems Manager Parameter Store
- **Infrastructure**: AWS CDK (TypeScript)
- **Deployment**: AWS (Free Tier optimized)

## API Organization

### Amazon SP-API
- `src/api/amazon/products/fetch.js` - Fetch all products
- `src/api/amazon/products/get.js` - Get single product
- `src/api/amazon/products/update.js` - Update product
- `src/api/amazon/inventory/get.js` - Get FBA inventory
- `src/api/amazon/pricing/get.js` - Get pricing

### Walmart Marketplace API
- `src/api/walmart/products/fetch.js` - Fetch all items
- `src/api/walmart/products/get.js` - Get single item
- `src/api/walmart/products/update.js` - Update item
- `src/api/walmart/inventory/get.js` - Get inventory
- `src/api/walmart/inventory/update.js` - Update inventory
- `src/api/walmart/pricing/update.js` - Update pricing

### Shared Libraries
- `src/lib/auth/amazon.js` - Amazon authentication with caching
- `src/lib/auth/walmart.js` - Walmart authentication with caching
- `src/lib/aws/ssm.js` - Parameter Store utilities
- `src/lib/aws/dynamodb.js` - DynamoDB operations

## Getting Started

### Prerequisites

- Node.js 18+
- AWS Account with CLI configured
- Amazon Seller Central account with SP-API access
- Walmart Seller account with API credentials

### Installation

```bash
# Clone repository
git clone https://github.com/rakshit782/marketplace-sync-dashboard.git
cd marketplace-sync-dashboard

# Install dependencies
npm install

# Install CDK dependencies
cd aws/cdk
npm install
cd ../..
```

### Deployment

1. **Deploy Infrastructure**
```bash
cd aws/cdk
cdk bootstrap  # First time only
cdk deploy
```

2. **Store API Credentials**
```bash
aws ssm put-parameter --name "/marketplace-sync/amazon/client-id" --value "YOUR_VALUE" --type "SecureString"
aws ssm put-parameter --name "/marketplace-sync/amazon/client-secret" --value "YOUR_VALUE" --type "SecureString"
aws ssm put-parameter --name "/marketplace-sync/amazon/refresh-token" --value "YOUR_VALUE" --type "SecureString"
aws ssm put-parameter --name "/marketplace-sync/amazon/seller-id" --value "YOUR_SELLER_ID" --type "String"
aws ssm put-parameter --name "/marketplace-sync/amazon/marketplace-id" --value "ATVPDKIKX0DER" --type "String"

aws ssm put-parameter --name "/marketplace-sync/walmart/client-id" --value "YOUR_VALUE" --type "SecureString"
aws ssm put-parameter --name "/marketplace-sync/walmart/client-secret" --value "YOUR_VALUE" --type "SecureString"
```

3. **Get API Endpoint**
```bash
# CDK will output your API Gateway URL
API Gateway URL: https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
```

## API Endpoints

Base URL: `https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod`

### Amazon
- `GET /api/amazon/products` - Fetch products
- `GET /api/amazon/products/{sku}` - Get product
- `PATCH /api/amazon/products/{sku}` - Update product
- `GET /api/amazon/inventory?skus=SKU1,SKU2` - Get inventory
- `GET /api/amazon/pricing?skus=SKU1,SKU2` - Get pricing

### Walmart
- `GET /api/walmart/products?limit=50&offset=0` - Fetch items
- `GET /api/walmart/products/{sku}` - Get item
- `PUT /api/walmart/products/{sku}` - Update item
- `GET /api/walmart/inventory?sku=SKU` - Get inventory
- `PUT /api/walmart/inventory` - Update inventory
- `PUT /api/walmart/pricing` - Update pricing

## Adding New Marketplace

1. Create marketplace folder structure:
```bash
mkdir -p src/api/ebay/products
```

2. Add API functions (fetch.js, get.js, update.js)

3. Create authentication library:
```bash
touch src/lib/auth/ebay.js
```

4. Update CDK stack to add Lambda functions and routes

## Cost Optimization (AWS Free Tier)

- **Lambda**: 1M requests/month (always free)
- **DynamoDB**: 25GB storage (always free)
- **API Gateway**: 1M calls/month (first 12 months)
- **Parameter Store**: 10,000 parameters (always free)

**Estimated cost**: $0/month within free tier

## License

MIT