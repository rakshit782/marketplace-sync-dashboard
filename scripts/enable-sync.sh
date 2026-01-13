#!/bin/bash

# Enable scheduled sync jobs

set -e

echo "⏰ Enabling scheduled sync jobs..."
echo ""

# Get EventBridge rule names from CloudFormation outputs
AMAZON_RULE=$(aws cloudformation describe-stacks \
  --stack-name MarketplaceSyncStack-SyncStack \
  --query "Stacks[0].Outputs[?OutputKey=='AmazonSyncRuleName'].OutputValue" \
  --output text)

WALMART_RULE=$(aws cloudformation describe-stacks \
  --stack-name MarketplaceSyncStack-SyncStack \
  --query "Stacks[0].Outputs[?OutputKey=='WalmartSyncRuleName'].OutputValue" \
  --output text)

if [ -z "$AMAZON_RULE" ] || [ -z "$WALMART_RULE" ]; then
  echo "❌ Error: Could not find sync rules. Make sure the stack is deployed."
  exit 1
fi

echo "Amazon Sync Rule: $AMAZON_RULE"
echo "Walmart Sync Rule: $WALMART_RULE"
echo ""

# Enable Amazon sync (every 1 hour)
echo "Enabling Amazon sync (every 1 hour)..."
aws events enable-rule --name "$AMAZON_RULE"
echo "✅ Amazon sync enabled"

# Enable Walmart sync (every 2 hours)
echo "Enabling Walmart sync (every 2 hours)..."
aws events enable-rule --name "$WALMART_RULE"
echo "✅ Walmart sync enabled"

echo ""
echo "🎉 Scheduled sync jobs are now active!"
echo ""
echo "To disable syncs later, run:"
echo "  aws events disable-rule --name $AMAZON_RULE"
echo "  aws events disable-rule --name $WALMART_RULE"