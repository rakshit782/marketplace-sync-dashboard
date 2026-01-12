#!/bin/bash

set -e

echo "🚀 Starting deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
cd aws/cdk
npm install
cd ../..

echo -e "${YELLOW}Step 2: Deploying AWS infrastructure...${NC}"
cd aws/cdk
cdk deploy --require-approval never
cd ../..

# Extract outputs
echo -e "${YELLOW}Step 3: Getting deployment outputs...${NC}"
API_URL=$(aws cloudformation describe-stacks --stack-name MarketplaceSyncStack --query "Stacks[0].Outputs[?OutputKey=='ApiURL'].OutputValue" --output text)
S3_BUCKET=$(aws cloudformation describe-stacks --stack-name MarketplaceSyncStack --query "Stacks[0].Outputs[?OutputKey=='S3BucketName'].OutputValue" --output text)
DIST_ID=$(aws cloudformation describe-stacks --stack-name MarketplaceSyncStack --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" --output text)
WEBSITE_URL=$(aws cloudformation describe-stacks --stack-name MarketplaceSyncStack --query "Stacks[0].Outputs[?OutputKey=='WebsiteURL'].OutputValue" --output text)

echo "API URL: $API_URL"
echo "S3 Bucket: $S3_BUCKET"
echo "Distribution ID: $DIST_ID"

# Build frontend
echo -e "${YELLOW}Step 4: Building frontend...${NC}"
cd frontend
cp .env.example .env
echo "VITE_API_URL=$API_URL" > .env
npm install
npm run build
cd ..

# Deploy to S3
echo -e "${YELLOW}Step 5: Deploying frontend to S3...${NC}"
aws s3 sync frontend/build s3://$S3_BUCKET --delete

# Invalidate CloudFront cache
echo -e "${YELLOW}Step 6: Invalidating CloudFront cache...${NC}"
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "1. Store your API credentials in AWS Parameter Store:"
echo "   aws ssm put-parameter --name '/marketplace-sync/amazon/client-id' --value 'YOUR_VALUE' --type 'SecureString'"
echo "   aws ssm put-parameter --name '/marketplace-sync/amazon/client-secret' --value 'YOUR_VALUE' --type 'SecureString'"
echo "   aws ssm put-parameter --name '/marketplace-sync/amazon/refresh-token' --value 'YOUR_VALUE' --type 'SecureString'"
echo "   aws ssm put-parameter --name '/marketplace-sync/amazon/seller-id' --value 'YOUR_SELLER_ID' --type 'String'"
echo "   aws ssm put-parameter --name '/marketplace-sync/amazon/marketplace-id' --value 'ATVPDKIKX0DER' --type 'String'"
echo ""
echo "   aws ssm put-parameter --name '/marketplace-sync/walmart/client-id' --value 'YOUR_VALUE' --type 'SecureString'"
echo "   aws ssm put-parameter --name '/marketplace-sync/walmart/client-secret' --value 'YOUR_VALUE' --type 'SecureString'"
echo ""
echo "2. Access your dashboard at: $WEBSITE_URL"
echo "3. API endpoint: $API_URL"
echo ""
echo "🎉 Happy syncing!"