# System Architecture

## Two-Database Design

This system uses **two separate databases** for optimal performance and security:

### 1. Credentials Database (Neon PostgreSQL)
**Environment Variable**: `CRED_DATABASE_URL`

**Purpose**: Store sensitive authentication and credential data

**Tables**:
- `users` - User accounts
- `organizations` - Tenant/organization data
- `organization_members` - User-org relationships with roles
- `api_credentials` - Marketplace API credentials (per organization)
- `sessions` - Active user sessions
- `sync_logs` - Sync operation audit trail

**Why PostgreSQL?**
- ✅ ACID compliance for sensitive data
- ✅ Complex queries (joins, transactions)
- ✅ Referential integrity
- ✅ JSON support for credentials storage
- ✅ Easy backup and point-in-time recovery

**Connection**:
```javascript
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.CRED_DATABASE_URL);
```

---

### 2. Products Database (AWS DynamoDB)
**Environment Variable**: `PRODUCTS_TABLE_NAME`

**Purpose**: Store high-volume product, inventory, and pricing data

**Data Stored**:
- Products (from Amazon, Walmart, etc.)
- Marketplace listings
- Inventory levels
- Price history
- Product images
- Sync metadata

**Why DynamoDB?**
- ✅ Serverless (no infrastructure management)
- ✅ Auto-scaling (handles millions of products)
- ✅ Low latency (< 10ms reads)
- ✅ Cost-effective for high volume
- ✅ Native AWS integration
- ✅ Built-in replication

**Schema Design**:
```
Table: MarketplaceSyncStack-ProductsTable

Primary Key:
  PK: ORG#{organizationId}#PRODUCT#{sku}
  SK: METADATA

GSI1 (Global Secondary Index):
  PK: organizationId
  SK: created_at

Attributes:
  - organizationId (number)
  - sku (string)
  - marketplace (string)
  - title, description, brand, category
  - price, currency
  - inventory_quantity
  - image_url
  - asin (Amazon)
  - created_at, updated_at, synced_at
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    User Request                         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   API Gateway        │
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │  Lambda Function     │
            │  (with Auth)         │
            └──────────┬───────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│  Neon Database  │         │    DynamoDB     │
│ (Credentials)   │         │   (Products)    │
├─────────────────┤         ├─────────────────┤
│ • Users         │         │ • Products      │
│ • Organizations │         │ • Listings      │
│ • Sessions      │         │ • Inventory     │
│ • API Creds     │         │ • Pricing       │
└─────────────────┘         └─────────────────┘
```

---

## Authentication Flow

```
1. User Login
   POST /api/auth/login
   ↓
2. Query CRED_DATABASE_URL (Neon)
   - Verify user credentials
   - Get organizations
   - Create session
   ↓
3. Return JWT Token
   - Contains: userId, organizationId
   - Expires: 24 hours
   ↓
4. Authenticated Requests
   Authorization: Bearer <token>
   ↓
5. Middleware validates token
   - Query sessions table in Neon
   - Extract organizationId
   ↓
6. Data access scoped to organizationId
   - DynamoDB: Filter by organizationId
   - Neon: Filter by organization_id
```

---

## Product Sync Flow

```
1. Trigger Sync (Manual or Scheduled)
   ↓
2. Get Credentials from Neon
   - Query: api_credentials table
   - Filter: organizationId + marketplace
   ↓
3. Fetch Products from Marketplace
   - Amazon SP-API / Walmart API
   - Paginate through all products
   ↓
4. Transform & Store in DynamoDB
   - PK: ORG#{orgId}#PRODUCT#{sku}
   - Batch write (25 items/request)
   ↓
5. Update Sync Log in Neon
   - Record: success/failure, count, duration
```

---

## Multi-Tenant Isolation

### Neon Database (SQL)
```sql
-- Always filter by organization_id
SELECT * FROM api_credentials
WHERE organization_id = $1
AND marketplace = $2
AND is_active = true;
```

### DynamoDB (NoSQL)
```javascript
// Partition key includes organizationId
const pk = `ORG#${organizationId}#PRODUCT#${sku}`;

// Query by organization using GSI
QueryCommand({
  IndexName: 'GSI1',
  KeyConditionExpression: 'organizationId = :orgId',
  ExpressionAttributeValues: {
    ':orgId': organizationId
  }
});
```

---

## Environment Variables

```bash
# Credentials Database (Neon)
CRED_DATABASE_URL=postgresql://user:pass@host/creds_db

# Products Database (DynamoDB)
PRODUCTS_TABLE_NAME=MarketplaceSyncStack-ProductsTable
AWS_REGION=us-east-1

# Authentication
JWT_SECRET=your-secret-key
```

---

## Database Setup

### Neon (Credentials)
```bash
# 1. Create database on Neon.tech
# 2. Run schema
psql $CRED_DATABASE_URL < schema/multi-tenant.sql

# 3. Verify tables
psql $CRED_DATABASE_URL -c "\dt"
```

### DynamoDB (Products)
```bash
# 1. Deploy CDK stack (creates table automatically)
cd aws/cdk && cdk deploy

# 2. Verify table
aws dynamodb describe-table --table-name MarketplaceSyncStack-ProductsTable
```

---

## Cost Comparison

### Neon Database (Credentials)
- **Free Tier**: 0.5 GB storage, 100 hours compute/month
- **Paid**: ~$20/month for 1GB + 100 hours
- **Data**: < 1 GB (users, orgs, sessions)

### DynamoDB (Products)
- **Free Tier**: 25 GB storage, 25 read/write units
- **On-Demand**: $1.25 per million writes, $0.25 per million reads
- **Data**: Scales to terabytes

**Total Cost**: $0-30/month (within free tiers)

---

## Scaling Considerations

### Neon (Credentials)
- **Limit**: ~10,000 organizations
- **Scaling**: Vertical (increase compute)
- **Bottleneck**: Concurrent connections

### DynamoDB (Products)
- **Limit**: Unlimited products
- **Scaling**: Horizontal (auto-scaling)
- **Bottleneck**: Hot partitions (use random suffixes)

---

## Security

### Neon (Credentials)
- ✅ SSL/TLS connections
- ✅ IP whitelist
- ✅ Credentials stored as JSONB (can encrypt)
- ✅ Automatic backups
- ✅ Point-in-time recovery

### DynamoDB (Products)
- ✅ IAM permissions (Lambda only)
- ✅ Encryption at rest (KMS)
- ✅ VPC endpoints (optional)
- ✅ Point-in-time recovery

---

## Backup Strategy

### Neon
- Automatic daily backups (7-day retention)
- Manual snapshots before major changes

### DynamoDB
- Enable point-in-time recovery
- Export to S3 for long-term storage

---

## Best Practices

1. ✅ **Always use organizationId filter** in all queries
2. ✅ **Cache credentials** (5-minute TTL)
3. ✅ **Batch DynamoDB writes** (25 items max)
4. ✅ **Use connection pooling** for Neon
5. ✅ **Monitor costs** in CloudWatch
6. ✅ **Set up alerts** for sync failures
7. ✅ **Regular backups** of both databases