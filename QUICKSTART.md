# Quick Start Guide

Complete guide to test locally and deploy to production.

## Part 1: Test on Localhost (5 minutes)

### Prerequisites

```bash
# Check if you have these installed:
node --version    # Need 18+
docker --version  # Need for databases
git --version     # Need for cloning
```

If missing, install:
- **Node.js**: https://nodejs.org (download LTS version)
- **Docker Desktop**: https://www.docker.com/products/docker-desktop
- **Git**: https://git-scm.com/downloads

### Step 1: Clone Repository

```bash
# Clone the repo
git clone https://github.com/rakshit782/marketplace-sync-dashboard.git
cd marketplace-sync-dashboard

# Verify files
ls -la
# You should see: frontend/, src/, aws/, schema/, scripts/
```

### Step 2: Start Local Services

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Start everything (Docker + API + Frontend)
./scripts/dev-start.sh
```

**What this does:**
1. ✅ Starts PostgreSQL (credentials database)
2. ✅ Starts DynamoDB Local (products database)
3. ✅ Creates database tables
4. ✅ Starts local API server (port 3001)
5. ✅ Starts frontend dev server (port 5173)

**Expected output:**
```
🚀 Starting Marketplace Sync Dashboard (Localhost)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Starting Docker containers...
⏳ Waiting for databases to be ready...
🔧 Setting up DynamoDB tables...
✅ ProductsTable created successfully!
🌐 Starting local API server...
🎨 Starting frontend dev server...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ All services started!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Frontend:        http://localhost:5173
🔌 API:             http://localhost:3001
🗄️  PostgreSQL:      localhost:5432
💾 DynamoDB:        http://localhost:8000
🎨 DynamoDB Admin:  http://localhost:8001

Press Ctrl+C to stop all services
```

### Step 3: Seed Test Data

**Open a NEW terminal** (keep the first one running):

```bash
cd marketplace-sync-dashboard

# Add test user and sample products
./scripts/seed-test-data.sh
```

**Expected output:**
```
🌱 Seeding test data...

1️⃣  Registering test user...
✅ User registered

2️⃣  Logging in...
✅ Logged in

3️⃣  Adding marketplace credentials...
✅ Credentials added

4️⃣  Adding sample products...
✅ Sample products added

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Test data seeded successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 Email:    test@example.com
🔑 Password: TestPass123!
🏢 Organization: Test Company

You can now login at: http://localhost:5173
```

### Step 4: Test the Application

#### A) Open Frontend

```bash
# Open in browser
open http://localhost:5173
# Or manually visit: http://localhost:5173
```

#### B) Login

- **Email**: `test@example.com`
- **Password**: `TestPass123!`
- Click **"Sign In"**

#### C) Explore Dashboard

**Products Tab**:
- You should see 2 sample products
- Try searching by SKU or title
- Filter by marketplace (Amazon/Walmart)

**Credentials Tab**:
- See configured marketplaces
- Click "Edit" on Amazon
- Try updating credentials (test only)

**Sync Tab**:
- Click "Start Sync" on any marketplace
- Watch the loading state
- See success message

### Step 5: Test API Directly

**In a new terminal**:

```bash
# Test health endpoint
curl http://localhost:3001/health

# Expected: {"status":"healthy","timestamp":"..."}

# Register new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "myuser@test.com",
    "password": "MyPass123!",
    "fullName": "My Name",
    "organizationName": "My Company"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "myuser@test.com",
    "password": "MyPass123!"
  }'

# Copy the "token" from response
TOKEN="paste-token-here"

# List products
curl http://localhost:3001/api/products \
  -H "Authorization: Bearer $TOKEN"
```

### Step 6: Check Databases

#### PostgreSQL (Users & Credentials)

```bash
# Connect to database
psql postgresql://postgres:postgres@localhost:5432/marketplace_credentials

# List all tables
\dt

# View users
SELECT id, email, full_name FROM users;

# View organizations
SELECT id, name, slug FROM organizations;

# View credentials (without secrets)
SELECT id, marketplace, is_active FROM api_credentials;

# Exit
\q
```

#### DynamoDB (Products)

**Option 1: Web UI**
```bash
# Open DynamoDB Admin
open http://localhost:8001

# Click on "MarketplaceSyncStack-ProductsTable"
# Browse products visually
```

**Option 2: AWS CLI**
```bash
# List tables
aws dynamodb list-tables --endpoint-url http://localhost:8000

# Scan all products
aws dynamodb scan \
  --table-name MarketplaceSyncStack-ProductsTable \
  --endpoint-url http://localhost:8000
```

### Step 7: Stop Services

```bash
# Go back to the first terminal (or open new)
cd marketplace-sync-dashboard

# Stop everything
./scripts/dev-stop.sh

# Or press Ctrl+C in the terminal running dev-start.sh
```

---

## Part 2: Deploy to Production (FREE Tier)

### Prerequisites

```bash
# Install required tools
npm install -g aws-cdk vercel

# Verify installations
aws --version
cdk --version
vercel --version
```

### Step 1: Setup AWS Account

#### A) Create AWS Account

1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Enter email, password, account name
4. Verify email
5. Enter credit card (won't be charged on free tier)

#### B) Configure AWS CLI

```bash
# Configure credentials
aws configure

# Enter:
AWS Access Key ID: [Get from AWS Console → IAM]
AWS Secret Access Key: [Get from AWS Console → IAM]
Default region name: us-east-1
Default output format: json

# Test connection
aws sts get-caller-identity
```

**How to get Access Keys:**
1. Go to AWS Console: https://console.aws.amazon.com
2. Click your name (top right) → Security Credentials
3. Scroll to "Access keys"
4. Click "Create access key"
5. Download or copy the keys

### Step 2: Setup Neon Database (FREE)

#### A) Create Neon Account

1. Go to https://neon.tech
2. Sign up with GitHub/Google (or email)
3. Click "Create Project"
4. Name: `marketplace-sync-prod`
5. Region: Select closest to you
6. Click "Create"

#### B) Get Connection String

```bash
# In Neon dashboard:
# 1. Click on your project
# 2. Click "Connection Details"
# 3. Copy the connection string

# Save it
export CRED_DATABASE_URL="postgresql://user:password@ep-xyz.neon.tech/neondb"

# Test connection
psql $CRED_DATABASE_URL -c "SELECT version();"
```

#### C) Apply Database Schema

```bash
# Go to your project folder
cd marketplace-sync-dashboard

# Apply schema
psql $CRED_DATABASE_URL < schema/multi-tenant.sql

# Verify tables created
psql $CRED_DATABASE_URL -c "\dt"

# Should show:
#  users
#  organizations
#  organization_members
#  api_credentials
#  sync_logs
```

### Step 3: Deploy Backend to AWS (FREE)

#### A) Generate JWT Secret

```bash
# Generate a secure random secret
export JWT_SECRET=$(openssl rand -base64 32)

# Save it! Add to your .env file
echo "JWT_SECRET=$JWT_SECRET" >> .env.production
echo "CRED_DATABASE_URL=$CRED_DATABASE_URL" >> .env.production

# Display to save manually
echo "Your JWT Secret: $JWT_SECRET"
```

#### B) Bootstrap CDK (First Time Only)

```bash
# Get your AWS account ID
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

# Bootstrap CDK
cd aws/cdk
npm install
cdk bootstrap aws://$AWS_ACCOUNT/us-east-1

# Expected output: "Environment aws://123456789/us-east-1 bootstrapped"
```

#### C) Deploy Stack

```bash
# Deploy with Lambda Function URLs (FREE)
cdk deploy MarketplaceSyncStackFree --require-approval never

# This takes 3-5 minutes...
# Creates:
# - DynamoDB table
# - 8 Lambda functions
# - Lambda Function URLs (no API Gateway!)
# - IAM roles
```

#### D) Save Lambda URLs

```bash
# Get all function URLs
aws cloudformation describe-stacks \
  --stack-name MarketplaceSyncStackFree \
  --query 'Stacks[0].Outputs' \
  --output table

# Save them
export REGISTER_URL="https://abc.lambda-url.us-east-1.on.aws/"
export LOGIN_URL="https://def.lambda-url.us-east-1.on.aws/"
export PRODUCTS_URL="https://ghi.lambda-url.us-east-1.on.aws/"
export CREDS_URL="https://jkl.lambda-url.us-east-1.on.aws/"
```

### Step 4: Deploy Frontend to Vercel (FREE)

#### A) Create Vercel Account

1. Go to https://vercel.com
2. Sign up with GitHub (recommended)
3. Authorize Vercel to access your repos

#### B) Configure Frontend

```bash
cd ../../frontend

# Create API config file
cat > src/config/api.ts <<EOF
export const API_ENDPOINTS = {
  register: '${REGISTER_URL}',
  login: '${LOGIN_URL}',
  me: '${LOGIN_URL}',
  productsList: '${PRODUCTS_URL}',
  productsGet: '${PRODUCTS_URL}',
  credentialsList: '${CREDS_URL}',
  credentialsGet: '${CREDS_URL}',
  credentialsUpdate: '${CREDS_URL}',
};
EOF

# Verify file created
cat src/config/api.ts
```

#### C) Deploy to Vercel

```bash
# Deploy (will prompt for login first time)
vercel --prod

# Follow prompts:
# - Link to existing project? No
# - Project name? marketplace-sync-dashboard
# - Directory? ./
# - Override settings? No

# Wait for deployment (1-2 minutes)

# Your app is live!
# URL: https://marketplace-sync-dashboard.vercel.app
```

### Step 5: Create First Production User

```bash
# Register admin user
curl -X POST $REGISTER_URL \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "YourSecurePassword123!",
    "fullName": "Admin User",
    "organizationName": "Your Company"
  }'

# Test login
curl -X POST $LOGIN_URL \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "YourSecurePassword123!"
  }'

# Should return:
# {
#   "success": true,
#   "token": "eyJhbGc...",
#   "user": {...},
#   "organization": {...}
# }
```

### Step 6: Add Real Marketplace Credentials

#### A) Connect to Neon Database

```bash
psql $CRED_DATABASE_URL
```

#### B) Add Amazon Credentials

**Get credentials from**: https://developer-docs.amazon.com/sp-api/

```sql
-- Add Amazon credentials
INSERT INTO api_credentials (organization_id, marketplace, credentials, created_by)
VALUES (
  1,  -- Your organization ID (check: SELECT id FROM organizations;)
  'amazon',
  '{
    "clientId": "amzn1.application-oa2-client.YOUR_CLIENT_ID",
    "clientSecret": "amzn1.oa2-cs.v1.YOUR_SECRET",
    "refreshToken": "Atzr|IwYOUR_REFRESH_TOKEN",
    "sellerId": "A1XXXXX",
    "marketplaceId": "ATVPDKIKX0DER"
  }'::jsonb,
  1  -- Admin user ID
);
```

#### C) Add Walmart Credentials

**Get credentials from**: https://developer.walmart.com/

```sql
-- Add Walmart credentials
INSERT INTO api_credentials (organization_id, marketplace, credentials, created_by)
VALUES (
  1,
  'walmart',
  '{
    "clientId": "your-walmart-client-id",
    "clientSecret": "your-walmart-secret"
  }'::jsonb,
  1
);

-- Exit
\q
```

### Step 7: Test Production App

```bash
# Open your app
open https://marketplace-sync-dashboard.vercel.app

# Or get the URL from Vercel
vercel inspect --prod
```

**Test Flow**:
1. ✅ Login with admin@yourcompany.com
2. ✅ Go to Credentials tab
3. ✅ Verify Amazon/Walmart show as "Configured"
4. ✅ Go to Sync tab
5. ✅ Click "Start Sync" for Amazon
6. ✅ Go to Products tab
7. ✅ See real products from Amazon!

---

## Troubleshooting

### Localhost Issues

#### "Port 5173 already in use"
```bash
# Kill the process
lsof -ti:5173 | xargs kill -9

# Restart
./scripts/dev-start.sh
```

#### "Docker is not running"
```bash
# Start Docker Desktop
open /Applications/Docker.app  # macOS
# or start from Start Menu (Windows)

# Wait 30 seconds, then retry
./scripts/dev-start.sh
```

#### "Cannot connect to database"
```bash
# Check Docker containers
docker ps

# Should show:
# - marketplace-sync-postgres
# - marketplace-sync-dynamodb

# Restart if missing
docker-compose restart
```

### Production Issues

#### "CDK deploy failed"
```bash
# Check AWS credentials
aws sts get-caller-identity

# Re-bootstrap if needed
cdk bootstrap --force

# Try deploy again
cdk deploy MarketplaceSyncStackFree
```

#### "Vercel deploy failed"
```bash
# Clear cache and retry
vercel --prod --force

# Or link to existing project
vercel link
vercel --prod
```

#### "Can't connect to Neon"
```bash
# Check connection string format
echo $CRED_DATABASE_URL
# Should be: postgresql://user:pass@host.neon.tech/db

# Test connection
psql $CRED_DATABASE_URL -c "SELECT 1;"

# If fails, regenerate in Neon dashboard
```

---

## Summary

### Localhost (Development)
- **Cost**: $0
- **Time**: 5 minutes
- **Use for**: Development, testing, debugging

```bash
./scripts/dev-start.sh
open http://localhost:5173
```

### Production (FREE Tier)
- **Cost**: $0/month
- **Time**: 15 minutes
- **Use for**: Real users, live data

```bash
cdk deploy MarketplaceSyncStackFree
vercel --prod
```

**Your app is live at**: `https://your-app.vercel.app`

---

## Next Steps

1. ✅ **Test locally** - Make sure everything works
2. ✅ **Deploy to production** - Go live for free
3. ✅ **Add real credentials** - Connect marketplaces
4. ✅ **Invite users** - Add team members
5. ✅ **Monitor usage** - Check AWS/Vercel dashboards
6. ✅ **Scale up** - Upgrade when you grow

**Need help?** Check:
- `README_LOCALHOST.md` - Detailed localhost guide
- `DEPLOYMENT_FREE.md` - Free tier deployment details
- `DEPLOYMENT.md` - Full production guide

**Happy building!** 🚀