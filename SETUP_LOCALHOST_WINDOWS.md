# Complete Localhost Setup - Windows

## ⚠️ Before You Start

**IMPORTANT**: For localhost testing, you do NOT need:
- ❌ AWS keys
- ❌ Neon database
- ❌ .env files

Everything runs on your computer with Docker!

---

## 📋 Prerequisites

### 1. Install Required Software

**Node.js 18+**:
- Download: https://nodejs.org/en/download/
- Choose: LTS version (Windows Installer .msi)
- Install with default settings
- **Restart PowerShell** after install

**Docker Desktop**:
- Download: https://www.docker.com/products/docker-desktop
- Install with default settings
- **Restart computer** after install
- Open Docker Desktop and let it start

**Git** (you already have this):
- Download: https://git-scm.com/download/win

### 2. Verify Installation

```powershell
# Check Node.js
node --version
# Should show: v18.x.x or higher

# Check npm
npm --version
# Should show: 9.x.x or higher

# Check Docker
docker --version
# Should show: Docker version 24.x.x

# Check Git
git --version
# Should show: git version 2.x.x
```

---

## 🚀 Complete Setup Guide

### Step 1: Clean Start

```powershell
# Go to your project folder
cd F:\capel\marketplace-sync-dashboard

# Pull latest code
git pull origin main

# Stop any running containers
docker-compose down

# Remove any .env files (not needed for localhost)
if (Test-Path .env.local) { Remove-Item .env.local }
if (Test-Path .env) { Remove-Item .env }
```

---

### Step 2: Install ALL Dependencies

#### A) Root folder dependencies:

```powershell
# Make sure you're in root folder
cd F:\capel\marketplace-sync-dashboard

# Install root dependencies (if any)
npm install
```

#### B) Local API dependencies:

```powershell
# Go to local-api folder
cd local-api

# Install ALL required packages
npm install express cors dotenv nodemon `
  @neondatabase/serverless `
  @aws-sdk/client-dynamodb `
  @aws-sdk/lib-dynamodb `
  jsonwebtoken `
  bcryptjs `
  pg

# Go back to root
cd ..
```

#### C) Frontend dependencies:

```powershell
# Go to frontend folder
cd frontend

# Install frontend packages
npm install

# Go back to root
cd ..
```

---

### Step 3: Start Docker Databases

```powershell
# Make sure Docker Desktop is running!
# Check system tray - Docker icon should be green

# Start containers
docker-compose up -d

# Wait for containers to start
Start-Sleep -Seconds 15

# Verify containers are running
docker ps

# You should see 3 containers:
# - marketplace-sync-postgres
# - marketplace-sync-dynamodb  
# - marketplace-sync-dynamodb-admin
```

---

### Step 4: Setup PostgreSQL Database

```powershell
# Create tables in PostgreSQL
docker exec marketplace-sync-postgres psql -U postgres -d marketplace_credentials -c "
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organization_members (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  user_id INTEGER REFERENCES users(id),
  role VARCHAR(50) DEFAULT 'MEMBER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS api_credentials (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  marketplace VARCHAR(50) NOT NULL,
  credentials JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, marketplace)
);
"

echo "✅ PostgreSQL tables created!"
```

---

### Step 5: Setup DynamoDB Table

```powershell
cd local-api

# Check if setup script exists
if (Test-Path scripts\setup-dynamodb.js) {
    node scripts\setup-dynamodb.js
} else {
    # Create the table manually
    node -e "
    const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');
    const client = new DynamoDBClient({
      region: 'us-east-1',
      endpoint: 'http://localhost:8000',
      credentials: { accessKeyId: 'local', secretAccessKey: 'local' }
    });
    
    (async () => {
      try {
        await client.send(new CreateTableCommand({
          TableName: 'MarketplaceSyncStack-ProductsTable',
          KeySchema: [
            { AttributeName: 'PK', KeyType: 'HASH' },
            { AttributeName: 'SK', KeyType: 'RANGE' }
          ],
          AttributeDefinitions: [
            { AttributeName: 'PK', AttributeType: 'S' },
            { AttributeName: 'SK', AttributeType: 'S' },
            { AttributeName: 'organizationId', AttributeType: 'N' },
            { AttributeName: 'created_at', AttributeType: 'S' }
          ],
          GlobalSecondaryIndexes: [{
            IndexName: 'GSI1',
            KeySchema: [
              { AttributeName: 'organizationId', KeyType: 'HASH' },
              { AttributeName: 'created_at', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' }
          }],
          BillingMode: 'PAY_PER_REQUEST'
        }));
        console.log('✅ DynamoDB table created!');
      } catch (err) {
        if (err.name === 'ResourceInUseException') {
          console.log('✅ Table already exists!');
        } else {
          console.error('❌ Error:', err.message);
        }
      }
    })();
    "
}

cd ..
```

---

### Step 6: Start API Server

**Keep this PowerShell window open!**

```powershell
cd F:\capel\marketplace-sync-dashboard\local-api
npm run dev
```

**Expected output:**
```
🚀 Local API Server running!
📍 URL: http://localhost:3001
🗄️  PostgreSQL: localhost:5432
📦 DynamoDB: http://localhost:8000
```

**✅ SUCCESS! Keep this window open!**

---

### Step 7: Start Frontend

**Open a NEW PowerShell window:**

```powershell
cd F:\capel\marketplace-sync-dashboard\frontend
npm run dev
```

**Expected output:**
```
VITE v5.x.x ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**✅ SUCCESS! Keep this window open too!**

---

### Step 8: Create Test User

**Open a THIRD PowerShell window:**

```powershell
# Register test user
curl.exe -X POST http://localhost:3001/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"TestPass123!","fullName":"Test User","organizationName":"Test Company"}'

# Should return: {"success":true,...}
```

---

### Step 9: Add Sample Products

```powershell
cd F:\capel\marketplace-sync-dashboard\local-api

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
    PK: 'ORG#1#PRODUCT#ABC123',
    SK: 'METADATA',
    organizationId: 1,
    sku: 'ABC123',
    marketplace: 'amazon',
    title: 'Sample Product 1 - Wireless Headphones',
    price: 29.99,
    currency: 'USD',
    inventory_quantity: 100,
    image_url: 'https://via.placeholder.com/200/3498db/ffffff?text=Product+1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    PK: 'ORG#1#PRODUCT#DEF456',
    SK: 'METADATA',
    organizationId: 1,
    sku: 'DEF456',
    marketplace: 'walmart',
    title: 'Sample Product 2 - Phone Case',
    price: 49.99,
    currency: 'USD',
    inventory_quantity: 50,
    image_url: 'https://via.placeholder.com/200/e74c3c/ffffff?text=Product+2',
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
  console.log('✅ Sample products added!');
})();
"
```

---

### Step 10: Open in Browser

```powershell
Start-Process "http://localhost:5173"
```

**Login with:**
- Email: `test@example.com`
- Password: `TestPass123!`

---

## ✅ You Should Now See:

1. **Products Tab**: 2 sample products
2. **Credentials Tab**: Empty (ready to add)
3. **Sync Tab**: Sync buttons

---

## 🎯 Summary - What's Running:

```
✅ Docker containers (3):
   - PostgreSQL (users, credentials)
   - DynamoDB (products)
   - DynamoDB Admin UI

✅ API Server (PowerShell Window 1):
   - http://localhost:3001
   
✅ Frontend (PowerShell Window 2):
   - http://localhost:5173
```

---

## 🛑 How to Stop Everything:

```powershell
# 1. Close API server window (Ctrl+C)
# 2. Close Frontend window (Ctrl+C)
# 3. Stop Docker containers:
docker-compose down
```

---

## 🔄 How to Restart Next Time:

```powershell
# 1. Start Docker
docker-compose up -d
Start-Sleep -Seconds 10

# 2. Start API (Window 1)
cd F:\capel\marketplace-sync-dashboard\local-api
npm run dev

# 3. Start Frontend (Window 2)
cd F:\capel\marketplace-sync-dashboard\frontend
npm run dev

# 4. Open browser
Start-Process "http://localhost:5173"
```

---

## 🐛 Troubleshooting

### "Module not found"
```powershell
cd local-api
npm install
```

### "Port already in use"
```powershell
# Kill port 3001
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process -Force

# Kill port 5173  
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force
```

### "Docker not running"
```
1. Open Docker Desktop from Start Menu
2. Wait 30 seconds
3. Try again
```

### "Cannot connect to database"
```powershell
# Restart containers
docker-compose down
docker-compose up -d
Start-Sleep -Seconds 15
```

---

## ✅ Final Checklist

- [ ] Node.js installed (v18+)
- [ ] Docker Desktop installed and running
- [ ] All dependencies installed (`npm install` in local-api and frontend)
- [ ] Docker containers running (`docker ps` shows 3 containers)
- [ ] PostgreSQL tables created
- [ ] DynamoDB table created
- [ ] API server running (port 3001)
- [ ] Frontend running (port 5173)
- [ ] Test user registered
- [ ] Sample products added
- [ ] Can login at http://localhost:5173

---

## 🎉 Success!

Your localhost environment is fully set up! You can now:
- Test the application
- Add more users
- Add marketplace credentials
- Sync products
- Develop new features

**Next step**: Once localhost works, you can deploy to production (AWS + Vercel) using the DEPLOYMENT_FREE.md guide.

---

## 📞 Need Help?

If something doesn't work:
1. Check which step failed
2. Read the error message
3. Check the Troubleshooting section
4. Make sure Docker Desktop is running
5. Make sure you ran `npm install` in both folders

**Happy coding!** 🚀