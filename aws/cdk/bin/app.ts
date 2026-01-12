#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MarketplaceSyncStack } from '../lib/marketplace-sync-stack';

const app = new cdk.App();

new MarketplaceSyncStack(app, 'MarketplaceSyncStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Marketplace Sync Dashboard - AWS Free Tier Deployment',
});

app.synth();