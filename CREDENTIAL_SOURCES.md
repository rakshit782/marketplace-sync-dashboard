# Credential Source Management

This system supports three different sources for loading marketplace API credentials:

## 1. AWS Systems Manager Parameter Store (Recommended)

**Best for**: Production deployments on AWS

**Pros**:
- ✅ Encrypted at rest
- ✅ Fine-grained IAM permissions
- ✅ Audit logging
- ✅ No database required
- ✅ Free tier: 10,000 parameters

**Setup**:
```bash
# Run the setup script
./scripts/setup-credentials.sh

# Or manually
aws ssm put-parameter --name "/marketplace-sync/amazon/client-id" --value "YOUR_VALUE" --type "SecureString"
aws ssm put-parameter --name "/marketplace-sync/amazon/client-secret" --value "YOUR_VALUE" --type "SecureString"
aws ssm put-parameter --name "/marketplace-sync/amazon/refresh-token" --value "YOUR_VALUE" --type "SecureString"
aws ssm put-parameter --name "/marketplace-sync/amazon/seller-id" --value "YOUR_SELLER_ID" --type "String"
aws ssm put-parameter --name "/marketplace-sync/amazon/marketplace-id" --value "ATVPDKIKX0DER" --type "String"

aws ssm put-parameter --name "/marketplace-sync/walmart/client-id" --value "YOUR_VALUE" --type "SecureString"
aws ssm put-parameter --name "/marketplace-sync/walmart/client-secret" --value "YOUR_VALUE" --type "SecureString"
```

**Set in environment**:
```bash
export CREDENTIAL_SOURCE=ssm
```

---

## 2. Neon Database

**Best for**: Centralized credential management across multiple environments

**Pros**:
- ✅ Centralized storage
- ✅ Easy to update via SQL
- ✅ Version history possible
- ✅ Can be shared across services

**Cons**:
- ⚠️ Requires database connection
- ⚠️ Additional dependency

**Setup**:

1. Create credentials table:
```bash
psql $NEON_DATABASE_URL < schema/credentials-table.sql
```

2. Insert credentials:
```sql
-- Amazon
INSERT INTO api_credentials (marketplace, credentials, is_active)
VALUES (
    'amazon',
    '{
        "clientId": "your-client-id",
        "clientSecret": "your-client-secret",
        "refreshToken": "your-refresh-token",
        "sellerId": "your-seller-id",
        "marketplaceId": "ATVPDKIKX0DER"
    }'::jsonb,
    true
);

-- Walmart
INSERT INTO api_credentials (marketplace, credentials, is_active)
VALUES (
    'walmart',
    '{
        "clientId": "your-client-id",
        "clientSecret": "your-client-secret"
    }'::jsonb,
    true
);
```

3. Set environment variable:
```bash
export CREDENTIAL_SOURCE=neon
export NEON_DATABASE_URL=postgresql://user:password@host/database
```

---

## 3. Environment Variables (.env file)

**Best for**: Local development and testing

**Pros**:
- ✅ Simple setup
- ✅ No external dependencies
- ✅ Fast for development

**Cons**:
- ❌ Not secure for production
- ❌ Hard to rotate credentials
- ❌ Risk of committing to git

**Setup**:

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` and add your credentials:
```bash
CREDENTIAL_SOURCE=dotenv

AMAZON_CLIENT_ID=your-amazon-client-id
AMAZON_CLIENT_SECRET=your-amazon-client-secret
AMAZON_REFRESH_TOKEN=your-refresh-token
AMAZON_SELLER_ID=your-seller-id
AMAZON_MARKETPLACE_ID=ATVPDKIKX0DER

WALMART_CLIENT_ID=your-walmart-client-id
WALMART_CLIENT_SECRET=your-walmart-client-secret
```

**⚠️ Important**: Never commit `.env` to git!

---

## Switching Between Sources

### Method 1: Dashboard Toggle (Recommended)

1. Open your dashboard
2. Click "Credential Source" button in top right
3. Select desired source
4. Lambda functions will be updated automatically

### Method 2: Environment Variable

Update Lambda function environment:
```bash
aws lambda update-function-configuration \
  --function-name MarketplaceSyncStack-AmazonProductsFetch \
  --environment Variables={CREDENTIAL_SOURCE=neon}
```

### Method 3: CDK Deployment

Update `aws/cdk/lib/marketplace-sync-stack.ts`:
```typescript
const lambdaEnv = {
  CREDENTIAL_SOURCE: 'neon', // or 'ssm' or 'dotenv'
  PRODUCTS_TABLE_NAME: productsTable.tableName,
  AWS_REGION: this.region,
};
```

Then redeploy:
```bash
cd aws/cdk && cdk deploy
```

---

## Credential Caching

All sources use in-memory caching:
- **Cache TTL**: 5 minutes
- **Benefits**: Reduces API calls, faster response times
- **Clear cache**: Automatically cleared when switching sources

---

## Security Recommendations

### Production
✅ Use AWS Parameter Store (SSM)  
✅ Enable CloudTrail for audit logs  
✅ Use IAM roles with least privilege  
✅ Rotate credentials regularly  

### Development
✅ Use environment variables (.env)  
✅ Never commit `.env` to git  
✅ Use different credentials than production  

### Neon Database
✅ Enable SSL connections  
✅ Restrict database access by IP  
✅ Consider encrypting credentials JSONB field  
✅ Regular backups  

---

## Troubleshooting

### "Missing credentials" error

1. Check `CREDENTIAL_SOURCE` environment variable
2. Verify credentials exist in selected source
3. Check IAM permissions (for SSM)
4. Verify database connection (for Neon)

### "Failed to load credentials"

1. Check CloudWatch logs for detailed error
2. Verify credential format matches expected structure
3. Test credential source manually:

```bash
# Test SSM
aws ssm get-parameter --name "/marketplace-sync/amazon/client-id" --with-decryption

# Test Neon
psql $NEON_DATABASE_URL -c "SELECT marketplace FROM api_credentials WHERE is_active = true;"

# Test dotenv
echo $AMAZON_CLIENT_ID
```

### Cache not clearing

Manually clear cache by restarting Lambda:
```bash
aws lambda update-function-configuration \
  --function-name MarketplaceSyncStack-AmazonProductsFetch \
  --environment Variables={FORCE_REFRESH=true}
```

---

## Migration Guide

### From SSM to Neon

```bash
# 1. Export from SSM
aws ssm get-parameter --name "/marketplace-sync/amazon/client-id" --with-decryption --query "Parameter.Value" --output text

# 2. Insert into Neon
psql $NEON_DATABASE_URL -c "INSERT INTO api_credentials..."

# 3. Switch source
# Use dashboard toggle or update Lambda env
```

### From dotenv to SSM

```bash
# Run setup script
./scripts/setup-credentials.sh

# It will prompt for credentials and store in SSM
```