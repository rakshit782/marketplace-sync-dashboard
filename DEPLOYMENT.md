# Production Deployment Guide

Complete guide to deploy Marketplace Sync Dashboard to AWS.

## Prerequisites

- AWS Account with admin access
- AWS CLI installed and configured
- Node.js 18+ installed
- AWS CDK installed: `npm install -g aws-cdk`
- Neon Database account

## Step 1: Setup Neon Database

1. Create account at https://neon.tech
2. Create new project: "marketplace-sync-prod"
3. Copy connection string
4. Apply schema:

```bash
export CRED_DATABASE_URL="postgresql://user:pass@host/db"
psql $CRED_DATABASE_URL < schema/multi-tenant.sql
```

## Step 2: Configure AWS

```bash
# Configure credentials
aws configure

# Test connection
aws sts get-caller-identity
```

## Step 3: Deploy Backend

```bash
# Install CDK dependencies
cd aws/cdk
npm install

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy
export CRED_DATABASE_URL="postgresql://..."
export JWT_SECRET=$(openssl rand -base64 32)
cdk deploy

# Save API URL from output
export API_URL="https://xxxxx.execute-api.us-east-1.amazonaws.com/prod"
```

## Step 4: Deploy Frontend

```bash
cd ../../frontend

# Create production env
echo "VITE_API_URL=$API_URL" > .env.production

# Build
npm install
npm run build

# Create S3 bucket
aws s3 mb s3://marketplace-sync-app-prod

# Upload
aws s3 sync dist/ s3://marketplace-sync-app-prod --delete

# Make public
aws s3 website s3://marketplace-sync-app-prod \
  --index-document index.html \
  --error-document index.html
```

## Step 5: Create First User

```bash
curl -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "SecurePassword123!",
    "fullName": "Admin User",
    "organizationName": "Your Company"
  }'
```

## Step 6: Add Marketplace Credentials

```bash
psql $CRED_DATABASE_URL

INSERT INTO api_credentials (organization_id, marketplace, credentials, created_by)
VALUES (
  1,
  'amazon',
  '{
    "clientId": "your-amazon-client-id",
    "clientSecret": "your-amazon-secret",
    "refreshToken": "your-token",
    "sellerId": "your-seller-id",
    "marketplaceId": "ATVPDKIKX0DER"
  }'::jsonb,
  1
);
```

## Cost Estimation

| Service | Monthly Cost |
|---------|-------------|
| Neon Database | $0 (free tier) |
| DynamoDB | $0-10 |
| Lambda | $0-5 |
| API Gateway | $3.50 |
| S3 + CloudFront | $9 |
| **Total** | **$12-27/month** |

## Security Checklist

- [ ] HTTPS enabled
- [ ] Custom domain configured
- [ ] WAF enabled
- [ ] Rate limiting configured
- [ ] Monitoring enabled
- [ ] Backups configured

## Success!

Your application is now live! 🎉

Frontend: http://marketplace-sync-app-prod.s3-website-us-east-1.amazonaws.com
API: $API_URL
