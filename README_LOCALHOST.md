# Localhost Development Guide

Complete guide to running the Marketplace Sync Dashboard on your local machine.

## 🚀 Quick Start

```bash
# 1. Clone repository
git clone https://github.com/rakshit782/marketplace-sync-dashboard.git
cd marketplace-sync-dashboard

# 2. Start all services
chmod +x scripts/*.sh
./scripts/dev-start.sh

# 3. Seed test data (optional)
./scripts/seed-test-data.sh

# 4. Open browser
open http://localhost:5173
```

## 📋 Prerequisites

- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)

## 🏗️ Architecture (Local)

```
┌─────────────────────────────────────────┐
│  Frontend (Vite + React)                │
│  http://localhost:5173                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Local API Server (Express)             │
│  http://localhost:3001                  │
└──────────┬───────────────────┬──────────┘
           │                   │
           ▼                   ▼
┌──────────────────┐  ┌───────────────────┐
│  PostgreSQL      │  │  DynamoDB Local   │
│  localhost:5432  │  │  localhost:8000   │
│  (Docker)        │  │  (Docker)         │
└──────────────────┘  └───────────────────┘
```

## 🛠️ Services

### 1. Frontend (React + Vite)
- **URL**: http://localhost:5173
- **Port**: 5173
- **Auto-reload**: Yes

### 2. Local API Server (Express)
- **URL**: http://localhost:3001
- **Port**: 3001
- **Purpose**: Simulates AWS Lambda + API Gateway
- **Auto-reload**: Yes (with nodemon)

### 3. PostgreSQL (Docker)
- **URL**: localhost:5432
- **Database**: `marketplace_credentials`
- **Username**: `postgres`
- **Password**: `postgres`
- **Purpose**: Stores users, organizations, credentials

### 4. DynamoDB Local (Docker)
- **URL**: http://localhost:8000
- **Purpose**: Stores products, inventory, pricing
- **Admin UI**: http://localhost:8001

## 📁 Project Structure

```
marketplace-sync-dashboard/
├── frontend/                 # React frontend
│   ├── src/
│   ├── .env.local           # Frontend env vars
│   └── package.json
├── local-api/               # Local Express API server
│   ├── server.js           # Main server
│   ├── scripts/
│   │   └── setup-dynamodb.js
│   └── package.json
├── src/                     # Lambda functions (reused locally)
│   ├── api/
│   └── lib/
├── schema/
│   └── multi-tenant.sql    # PostgreSQL schema
├── docker-compose.yml      # Database services
├── .env.local              # Backend env vars
└── scripts/
    ├── dev-start.sh        # Start all services
    ├── dev-stop.sh         # Stop all services
    ├── dev-logs.sh         # View logs
    └── seed-test-data.sh   # Add test data
```

## 🎯 Step-by-Step Setup

### Step 1: Install Dependencies

```bash
# Root dependencies (if any)
npm install

# Frontend dependencies
cd frontend
npm install
cd ..

# Local API dependencies
cd local-api
npm install
cd ..
```

### Step 2: Start Docker Containers

```bash
# Start PostgreSQL and DynamoDB
docker-compose up -d

# Verify containers are running
docker ps

# You should see:
# - marketplace-sync-postgres
# - marketplace-sync-dynamodb
# - marketplace-sync-dynamodb-admin
```

### Step 3: Setup DynamoDB Tables

```bash
cd local-api
npm run setup-db
cd ..
```

### Step 4: Start API Server

```bash
cd local-api
npm run dev
# Server starts on http://localhost:3001
```

### Step 5: Start Frontend

```bash
cd frontend
npm run dev
# Frontend starts on http://localhost:5173
```

### Step 6: Seed Test Data (Optional)

```bash
./scripts/seed-test-data.sh
```

This creates:
- Test user: `test@example.com` / `TestPass123!`
- Test organization: "Test Company"
- Sample marketplace credentials
- Sample products

## 🧪 Testing the Application

### 1. Register New User

1. Open http://localhost:5173
2. Click "Sign up"
3. Fill in:
   - Full Name: Your Name
   - Email: your@email.com
   - Organization: Your Company
   - Password: (min 8 chars)
4. Click "Create Account"

### 2. Login

1. Use seeded credentials:
   - Email: `test@example.com`
   - Password: `TestPass123!`
2. Click "Sign In"

### 3. View Products

After login, you should see:
- Dashboard with products (if seeded)
- Organization switcher
- User menu

### 4. Test API Endpoints

```bash
# Health check
curl http://localhost:3001/health

# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "new@example.com",
    "password": "password123",
    "fullName": "New User",
    "organizationName": "New Company"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -d '{"email":"test@example.com","password":"TestPass123!"}'

# List products (requires token)
curl http://localhost:3001/api/products \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔧 Development Commands

### Start Services
```bash
./scripts/dev-start.sh      # Start all services
```

### Stop Services
```bash
./scripts/dev-stop.sh       # Stop all services
Ctrl+C                      # Stop from dev-start.sh
```

### View Logs
```bash
./scripts/dev-logs.sh postgres   # PostgreSQL logs
./scripts/dev-logs.sh dynamodb   # DynamoDB logs
./scripts/dev-logs.sh all        # All Docker logs
```

### Reset Everything
```bash
# Stop and remove all containers
docker-compose down -v

# Remove all data
rm -rf local-api/node_modules
rm -rf frontend/node_modules

# Start fresh
./scripts/dev-start.sh
```

## 🗄️ Database Access

### PostgreSQL (Credentials DB)

```bash
# Using psql
psql postgresql://postgres:postgres@localhost:5432/marketplace_credentials

# List tables
\dt

# Query users
SELECT * FROM users;

# Query organizations
SELECT * FROM organizations;

# Query credentials
SELECT * FROM api_credentials;
```

### DynamoDB (Products DB)

**Option 1: DynamoDB Admin UI**
- Open http://localhost:8001
- Visual interface to browse tables

**Option 2: AWS CLI**
```bash
# List tables
aws dynamodb list-tables --endpoint-url http://localhost:8000

# Scan products
aws dynamodb scan \
  --table-name MarketplaceSyncStack-ProductsTable \
  --endpoint-url http://localhost:8000
```

**Option 3: Node.js Script**
```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  endpoint: 'http://localhost:8000',
  region: 'us-east-1',
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' }
});

const docClient = DynamoDBDocumentClient.from(client);

(async () => {
  const result = await docClient.send(new ScanCommand({
    TableName: 'MarketplaceSyncStack-ProductsTable'
  }));
  console.log(result.Items);
})();
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find and kill process on port 3001 (API)
lsof -ti:3001 | xargs kill -9

# Find and kill process on port 5173 (Frontend)
lsof -ti:5173 | xargs kill -9

# Find and kill process on port 5432 (PostgreSQL)
lsof -ti:5432 | xargs kill -9
```

### Docker Issues

```bash
# Restart Docker Desktop
# Then:
docker-compose down
docker-compose up -d
```

### Database Connection Failed

```bash
# Check if containers are running
docker ps

# Check container logs
docker logs marketplace-sync-postgres
docker logs marketplace-sync-dynamodb

# Restart containers
docker-compose restart
```

### API Server Not Starting

```bash
# Check if .env.local exists
cat .env.local

# Install dependencies
cd local-api
rm -rf node_modules
npm install
npm run dev
```

### Frontend Not Loading

```bash
# Check if API is running
curl http://localhost:3001/health

# Check frontend env
cat frontend/.env.local

# Rebuild frontend
cd frontend
rm -rf node_modules
npm install
npm run dev
```

## 📊 Environment Variables

### Backend (.env.local)
```bash
CRED_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/marketplace_credentials
PRODUCTS_TABLE_NAME=MarketplaceSyncStack-ProductsTable
DYNAMODB_ENDPOINT=http://localhost:8000
JWT_SECRET=local-dev-secret
LOCAL_API_PORT=3001
```

### Frontend (frontend/.env.local)
```bash
VITE_API_URL=http://localhost:3001
```

## 🚦 Differences from Production

| Feature | Localhost | Production |
|---------|-----------|------------|
| Database (Creds) | PostgreSQL (Docker) | Neon PostgreSQL |
| Database (Products) | DynamoDB Local | AWS DynamoDB |
| API Server | Express (Node) | AWS Lambda |
| API Gateway | Express routes | AWS API Gateway |
| Frontend | Vite dev server | CloudFront + S3 |
| Auth | Same | Same |
| Code | Same | Same |

## ✅ Checklist

- [ ] Docker Desktop installed and running
- [ ] Node.js 18+ installed
- [ ] Repository cloned
- [ ] Docker containers started
- [ ] DynamoDB tables created
- [ ] API server running on :3001
- [ ] Frontend running on :5173
- [ ] Test data seeded
- [ ] Can login with test credentials
- [ ] Can see products in dashboard

## 🎉 Success!

If everything is working, you should see:

1. **Frontend** at http://localhost:5173 with login page
2. **API** responding at http://localhost:3001/health
3. **DynamoDB Admin** at http://localhost:8001 showing tables
4. **PostgreSQL** accepting connections on :5432

Now you can develop locally with full multi-tenant functionality! 🚀