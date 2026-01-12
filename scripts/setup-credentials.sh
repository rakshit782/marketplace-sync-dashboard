#!/bin/bash

set -e

echo "🔐 Setting up marketplace credentials in AWS Parameter Store"
echo ""

# Amazon credentials
echo "📦 Amazon Seller Central credentials:"
read -p "Enter Amazon Client ID: " AMAZON_CLIENT_ID
read -s -p "Enter Amazon Client Secret: " AMAZON_CLIENT_SECRET
echo ""
read -s -p "Enter Amazon Refresh Token: " AMAZON_REFRESH_TOKEN
echo ""
read -p "Enter Amazon Seller ID: " AMAZON_SELLER_ID
read -p "Enter Amazon Marketplace ID (default: ATVPDKIKX0DER): " AMAZON_MARKETPLACE_ID
AMAZON_MARKETPLACE_ID=${AMAZON_MARKETPLACE_ID:-ATVPDKIKX0DER}

echo ""
echo "Storing Amazon credentials..."
aws ssm put-parameter --name "/marketplace-sync/amazon/client-id" --value "$AMAZON_CLIENT_ID" --type "SecureString" --overwrite
aws ssm put-parameter --name "/marketplace-sync/amazon/client-secret" --value "$AMAZON_CLIENT_SECRET" --type "SecureString" --overwrite
aws ssm put-parameter --name "/marketplace-sync/amazon/refresh-token" --value "$AMAZON_REFRESH_TOKEN" --type "SecureString" --overwrite
aws ssm put-parameter --name "/marketplace-sync/amazon/seller-id" --value "$AMAZON_SELLER_ID" --type "String" --overwrite
aws ssm put-parameter --name "/marketplace-sync/amazon/marketplace-id" --value "$AMAZON_MARKETPLACE_ID" --type "String" --overwrite

echo "✅ Amazon credentials stored"
echo ""

# Walmart credentials
echo "🏪 Walmart Marketplace credentials:"
read -p "Enter Walmart Client ID: " WALMART_CLIENT_ID
read -s -p "Enter Walmart Client Secret: " WALMART_CLIENT_SECRET
echo ""

echo "Storing Walmart credentials..."
aws ssm put-parameter --name "/marketplace-sync/walmart/client-id" --value "$WALMART_CLIENT_ID" --type "SecureString" --overwrite
aws ssm put-parameter --name "/marketplace-sync/walmart/client-secret" --value "$WALMART_CLIENT_SECRET" --type "SecureString" --overwrite

echo "✅ Walmart credentials stored"
echo ""
echo "🎉 All credentials stored successfully in AWS Parameter Store!"