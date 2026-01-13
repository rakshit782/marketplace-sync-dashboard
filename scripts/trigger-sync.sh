#!/bin/bash

# Manually trigger sync jobs

set -e

if [ -z "$1" ]; then
  echo "Usage: ./trigger-sync.sh [amazon|walmart|both]"
  exit 1
fi

MARKETPLACE=$1

echo "🚀 Triggering sync for: $MARKETPLACE"
echo ""

# Get Lambda function names
AMAZON_FN=$(aws cloudformation describe-stacks \
  --stack-name MarketplaceSyncStack-SyncStack \
  --query "Stacks[0].Outputs[?OutputKey=='AmazonSyncFunctionName'].OutputValue" \
  --output text)

WALMART_FN=$(aws cloudformation describe-stacks \
  --stack-name MarketplaceSyncStack-SyncStack \
  --query "Stacks[0].Outputs[?OutputKey=='WalmartSyncFunctionName'].OutputValue" \
  --output text)

if [ "$MARKETPLACE" = "amazon" ] || [ "$MARKETPLACE" = "both" ]; then
  echo "📦 Invoking Amazon sync..."
  aws lambda invoke \
    --function-name "$AMAZON_FN" \
    --invocation-type Event \
    /tmp/amazon-sync-output.json
  echo "✅ Amazon sync triggered (async)"
  echo ""
fi

if [ "$MARKETPLACE" = "walmart" ] || [ "$MARKETPLACE" = "both" ]; then
  echo "📦 Invoking Walmart sync..."
  aws lambda invoke \
    --function-name "$WALMART_FN" \
    --invocation-type Event \
    /tmp/walmart-sync-output.json
  echo "✅ Walmart sync triggered (async)"
  echo ""
fi

echo "🎉 Sync jobs triggered!"
echo ""
echo "To view logs:"
echo "  aws logs tail /aws/lambda/$AMAZON_FN --follow"
echo "  aws logs tail /aws/lambda/$WALMART_FN --follow"