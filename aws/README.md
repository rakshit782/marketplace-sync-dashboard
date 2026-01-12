# AWS Deployment Guide - Free Tier

This project is optimized to run entirely within AWS Free Tier limits.

## AWS Free Tier Services Used

### Compute
- **AWS Lambda**: 1M free requests/month, 400,000 GB-seconds compute time
- **API Gateway**: 1M API calls/month (first 12 months)

### Database
- **RDS PostgreSQL (db.t3.micro)**: 750 hours/month, 20GB storage (first 12 months)
- **Alternative: DynamoDB**: 25GB storage, 25 WCU, 25 RCU (always free)

### Storage & Hosting
- **S3**: 5GB storage, 20,000 GET, 2,000 PUT requests/month
- **CloudFront**: 50GB data transfer out/month (first 12 months)

### Other Services
- **CloudWatch**: 5GB logs, 10 custom metrics
- **EventBridge**: 1M events/month (always free)
- **Systems Manager Parameter Store**: 10,000 free parameters

## Architecture

```
CloudFront (CDN)
    |
    v
S3 Bucket (Static Frontend - React SPA)
    |
    v
API Gateway (REST API)
    |
    v
Lambda Functions
    ├── /api/amazon/* (Amazon SP-API integration)
    ├── /api/walmart/* (Walmart API integration)
    ├── /api/products/* (Product CRUD)
    ├── /api/sync/* (Sync operations)
    └── /api/auth/* (Authentication)
    |
    v
RDS PostgreSQL (db.t3.micro) OR DynamoDB
    |
    v
EventBridge (Scheduled sync jobs)
```

## Cost Optimization

### Free Tier Limits
- Lambda: Keep functions under 1M invocations/month
- RDS: Use db.t3.micro (750 hours = 31 days free)
- API Gateway: Under 1M requests/month
- S3: Minimal storage for static files

### Beyond Free Tier (Optional)
- **Estimated monthly cost**: $5-15 if limits exceeded
- RDS after 12 months: ~$15/month
- Alternative: Use DynamoDB (always free for 25GB)

## Deployment Steps

### 1. Prerequisites
```bash
npm install -g aws-cdk
apt install -g aws-cli
aws configure  # Add your AWS credentials
```

### 2. Deploy Infrastructure
```bash
cd aws/cdk
npm install
cdk bootstrap  # First time only
cdk deploy
```

### 3. Build and Deploy Frontend
```bash
npm run build:frontend
aws s3 sync frontend/build s3://YOUR_BUCKET_NAME
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### 4. Deploy Lambda Functions
```bash
npm run deploy:lambda
```

### 5. Set Up Database
```bash
# Run migrations
cd aws/migrations
node run-migrations.js
```

### 6. Configure Environment
```bash
# Store secrets in AWS Systems Manager Parameter Store
aws ssm put-parameter --name "/marketplace-sync/amazon/client-id" --value "YOUR_VALUE" --type "SecureString"
aws ssm put-parameter --name "/marketplace-sync/amazon/client-secret" --value "YOUR_VALUE" --type "SecureString"
aws ssm put-parameter --name "/marketplace-sync/walmart/client-id" --value "YOUR_VALUE" --type "SecureString"
aws ssm put-parameter --name "/marketplace-sync/walmart/client-secret" --value "YOUR_VALUE" --type "SecureString"
```

## Monitoring Free Tier Usage

```bash
# Check current usage
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --start-time 2026-01-01T00:00:00Z \
  --end-time 2026-01-31T23:59:59Z \
  --period 86400 \
  --statistics Sum
```

Or use AWS Billing Dashboard:
- https://console.aws.amazon.com/billing/home#/freetier

## Auto-Scaling Configuration

- Lambda: Auto-scales, pay only for execution time
- RDS: Set max connections to prevent overload
- DynamoDB: Use on-demand pricing (scales automatically)

## Cleanup (Delete All Resources)

```bash
cd aws/cdk
cdk destroy
```