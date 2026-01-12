#!/bin/bash

# Deploy Lambda functions

echo "Deploying Lambda functions..."

# Package Lambda functions
cd lambda/amazon-sync
zip -r amazon-sync.zip .
aws lambda update-function-code \
  --function-name MarketplaceSyncStack-AmazonSyncFunction \
  --zip-file fileb://amazon-sync.zip

cd ../walmart-sync
zip -r walmart-sync.zip .
aws lambda update-function-code \
  --function-name MarketplaceSyncStack-WalmartSyncFunction \
  --zip-file fileb://walmart-sync.zip

cd ../products-api
zip -r products-api.zip .
aws lambda update-function-code \
  --function-name MarketplaceSyncStack-ProductsAPIFunction \
  --zip-file fileb://products-api.zip

echo "Lambda functions deployed successfully!"