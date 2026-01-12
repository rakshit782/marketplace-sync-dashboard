# Project Structure

## API Organization: `src/api/{marketplace}/{function}`

This project follows a clean, modular architecture where each API call is in its own file.

```
src/
├── api/
│   ├── amazon/
│   │   ├── products/
│   │   │   ├── fetch.js          # GET all products from Amazon catalog
│   │   │   ├── get.js            # GET single product by SKU
│   │   │   └── update.js         # PATCH update product listing
│   │   ├── inventory/
│   │   │   └── get.js            # GET FBA inventory levels
│   │   └── pricing/
│   │       └── get.js            # GET product pricing
│   │
│   └── walmart/
│       ├── products/
│       │   ├── fetch.js          # GET all Walmart items
│       │   ├── get.js            # GET single item by SKU
│       │   └── update.js         # PUT update item
│       ├── inventory/
│       │   ├── get.js            # GET inventory
│       │   └── update.js         # PUT update inventory
│       └── pricing/
│           └── update.js         # PUT update pricing
│
├── lib/
│   ├── auth/
│   │   ├── amazon.js         # Amazon SP-API authentication
│   │   └── walmart.js        # Walmart API authentication
│   └── aws/
│       ├── ssm.js            # AWS Parameter Store utilities
│       └── dynamodb.js       # DynamoDB utilities
│
└── sync/                     # Sync engines (to be added)
    ├── amazon-sync.js
    └── walmart-sync.js
```

## API Routes Mapping

Each Lambda function maps to a specific API Gateway endpoint:

### Amazon APIs

| Lambda Function | API Route | Method | Description |
|----------------|-----------|--------|-------------|
| `amazon/products/fetch` | `/api/amazon/products` | GET | Fetch all products |
| `amazon/products/get` | `/api/amazon/products/{sku}` | GET | Get single product |
| `amazon/products/update` | `/api/amazon/products/{sku}` | PATCH | Update product |
| `amazon/inventory/get` | `/api/amazon/inventory` | GET | Get inventory levels |
| `amazon/pricing/get` | `/api/amazon/pricing` | GET | Get pricing |

### Walmart APIs

| Lambda Function | API Route | Method | Description |
|----------------|-----------|--------|-------------|
| `walmart/products/fetch` | `/api/walmart/products` | GET | Fetch all items |
| `walmart/products/get` | `/api/walmart/products/{sku}` | GET | Get single item |
| `walmart/products/update` | `/api/walmart/products/{sku}` | PUT | Update item |
| `walmart/inventory/get` | `/api/walmart/inventory` | GET | Get inventory |
| `walmart/inventory/update` | `/api/walmart/inventory` | PUT | Update inventory |
| `walmart/pricing/update` | `/api/walmart/pricing` | PUT | Update pricing |

## Shared Libraries

### Authentication (`src/lib/auth/`)
- **Token caching**: Prevents excessive API calls for access tokens
- **Auto-refresh**: Handles token expiration automatically
- **Error handling**: Proper error propagation

### AWS Utilities (`src/lib/aws/`)
- **SSM Parameter Store**: Secure credential retrieval with caching
- **DynamoDB**: Common database operations (put, get, query, scan, update)

## Benefits of This Structure

1. **Modularity**: Each API function is isolated and can be deployed independently
2. **Clarity**: Easy to find and modify specific API calls
3. **Scalability**: Add new marketplaces by creating new folders
4. **Reusability**: Shared libraries prevent code duplication
5. **Testing**: Each function can be tested in isolation
6. **Maintenance**: Clear separation of concerns

## Adding New Marketplace

To add a new marketplace (e.g., eBay):

```bash
mkdir -p src/api/ebay/products
touch src/api/ebay/products/fetch.js
touch src/api/ebay/products/get.js
touch src/api/ebay/products/update.js
touch src/lib/auth/ebay.js
```

Then update CDK stack to add Lambda functions and API routes.

## Deployment

Each file in `src/api/` becomes a separate Lambda function, allowing:
- Independent scaling
- Granular permissions
- Cost optimization (pay only for what you use)
- Better error isolation