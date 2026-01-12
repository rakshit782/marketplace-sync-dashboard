# Deployment Guide

## Prerequisites

1. **AWS Account** with CLI configured
   ```bash
   aws configure
   ```

2. **Node.js 18+** installed
   ```bash
   node --version
   ```

3. **AWS CDK** installed globally
   ```bash
   npm install -g aws-cdk
   ```

4. **API Credentials Ready**
   - Amazon Seller Central: Client ID, Client Secret, Refresh Token, Seller ID
   - Walmart Marketplace: Client ID, Client Secret

## Quick Deployment

### Option 1: Automated Deployment (Recommended)

```bash
# Make scripts executable
chmod +x scripts/deploy.sh
chmod +x scripts/setup-credentials.sh

# Run deployment
./scripts/deploy.sh

# Set up credentials
./scripts/setup-credentials.sh
```

### Option 2: Manual Step-by-Step

#### Step 1: Deploy Infrastructure

```bash
cd aws/cdk
npm install
cdk bootstrap  # First time only
cdk deploy
```

Note the outputs:
- `ApiURL`: Your API Gateway endpoint
- `S3BucketName`: Frontend hosting bucket
- `DistributionId`: CloudFront distribution
- `WebsiteURL`: Your dashboard URL

#### Step 2: Store API Credentials

```bash
# Amazon
aws ssm put-parameter --name "/marketplace-sync/amazon/client-id" --value "YOUR_VALUE" --type "SecureString"
aws ssm put-parameter --name "/marketplace-sync/amazon/client-secret" --value "YOUR_VALUE" --type "SecureString"
aws ssm put-parameter --name "/marketplace-sync/amazon/refresh-token" --value "YOUR_VALUE" --type "SecureString"
aws ssm put-parameter --name "/marketplace-sync/amazon/seller-id" --value "YOUR_SELLER_ID" --type "String"
aws ssm put-parameter --name "/marketplace-sync/amazon/marketplace-id" --value "ATVPDKIKX0DER" --type "String"

# Walmart
aws ssm put-parameter --name "/marketplace-sync/walmart/client-id" --value "YOUR_VALUE" --type "SecureString"
aws ssm put-parameter --name "/marketplace-sync/walmart/client-secret" --value "YOUR_VALUE" --type "SecureString"
```

#### Step 3: Build and Deploy Frontend

```bash
cd frontend
npm install

# Create .env file
echo "VITE_API_URL=YOUR_API_URL" > .env

# Build
npm run build

# Deploy to S3
aws s3 sync build s3://YOUR_BUCKET_NAME --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## Testing the Deployment

### Test API Endpoints

```bash
# Test Amazon products fetch
curl -X POST https://YOUR_API_URL/api/amazon/products \
  -H "Content-Type: application/json" \
  -d '{"pageSize": 10}'

# Test Walmart products fetch
curl "https://YOUR_API_URL/api/walmart/products?limit=10"
```

### Access Dashboard

Open your browser to the CloudFront URL:
```
https://xxxxx.cloudfront.net
```

## Updating the Application

### Update Lambda Functions

```bash
cd aws/cdk
cdk deploy
```

### Update Frontend Only

```bash
cd frontend
npm run build
aws s3 sync build s3://YOUR_BUCKET_NAME --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## Monitoring

### View Lambda Logs

```bash
# Amazon products fetch logs
aws logs tail /aws/lambda/MarketplaceSyncStack-AmazonProductsFetch --follow

# Walmart products fetch logs
aws logs tail /aws/lambda/MarketplaceSyncStack-WalmartProductsFetch --follow
```

### Check DynamoDB

```bash
aws dynamodb scan --table-name MarketplaceSyncStack-ProductsTable --max-items 10
```

### Monitor Free Tier Usage

Visit: https://console.aws.amazon.com/billing/home#/freetier

## Cleanup

To remove all resources:

```bash
cd aws/cdk
cdk destroy
```

This will delete:
- All Lambda functions
- API Gateway
- DynamoDB table
- S3 bucket
- CloudFront distribution

**Note**: Parameter Store values must be deleted manually:

```bash
aws ssm delete-parameter --name "/marketplace-sync/amazon/client-id"
aws ssm delete-parameter --name "/marketplace-sync/amazon/client-secret"
# ... delete all parameters
```

## Troubleshooting

### Lambda Function Errors

1. Check CloudWatch Logs
2. Verify Parameter Store values are correct
3. Ensure Lambda has SSM permissions

### Frontend Not Loading

1. Check S3 bucket permissions (should be public)
2. Verify CloudFront distribution is deployed
3. Check browser console for CORS errors
4. Ensure API URL in `.env` is correct

### API Errors

1. Test credentials manually
2. Check API Gateway logs
3. Verify Lambda environment variables
4. Check DynamoDB table exists

## Cost Monitoring

**Free Tier Limits:**
- Lambda: 1M requests/month
- DynamoDB: 25GB storage
- API Gateway: 1M requests/month (12 months)
- S3: 5GB storage
- CloudFront: 50GB transfer/month (12 months)

**Estimated cost after 12 months:** $5-10/month

## Security Best Practices

1. ✅ API credentials stored in Parameter Store (encrypted)
2. ✅ Lambda functions have minimal IAM permissions
3. ✅ API Gateway has throttling enabled
4. ⚠️ Consider adding API authentication (Cognito)
5. ⚠️ Enable CloudFront WAF for production

## Next Steps

1. Add authentication to dashboard
2. Implement bulk edit functionality
3. Add automated sync schedules
4. Set up CloudWatch alarms
5. Add more marketplaces (eBay, Etsy, etc.)