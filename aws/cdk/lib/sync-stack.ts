import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

interface SyncStackProps extends cdk.NestedStackProps {
  productsTableName: string;
  productsTableArn: string;
}

export class SyncStack extends cdk.NestedStack {
  constructor(scope: Construct, id: string, props: SyncStackProps) {
    super(scope, id, props);

    const lambdaEnv = {
      PRODUCTS_TABLE_NAME: props.productsTableName,
      AWS_REGION: this.region,
    };

    const ssmPolicy = new iam.PolicyStatement({
      actions: ['ssm:GetParameter', 'ssm:GetParameters'],
      resources: [
        `arn:aws:ssm:${this.region}:${this.account}:parameter/marketplace-sync/*`,
      ],
    });

    const dynamoPolicy = new iam.PolicyStatement({
      actions: [
        'dynamodb:PutItem',
        'dynamodb:GetItem',
        'dynamodb:Query',
        'dynamodb:Scan',
      ],
      resources: [props.productsTableArn],
    });

    // Amazon Sync Lambda
    const amazonSyncFn = new lambda.Function(this, 'AmazonSyncFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'amazon-sync.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../src/sync')),
      timeout: cdk.Duration.minutes(15), // Long timeout for full sync
      memorySize: 1024,
      environment: lambdaEnv,
    });

    amazonSyncFn.addToRolePolicy(ssmPolicy);
    amazonSyncFn.addToRolePolicy(dynamoPolicy);

    // Walmart Sync Lambda
    const walmartSyncFn = new lambda.Function(this, 'WalmartSyncFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'walmart-sync.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../src/sync')),
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
      environment: lambdaEnv,
    });

    walmartSyncFn.addToRolePolicy(ssmPolicy);
    walmartSyncFn.addToRolePolicy(dynamoPolicy);

    // EventBridge Rules for Scheduled Sync
    // Amazon: Every 1 hour
    const amazonSyncRule = new events.Rule(this, 'AmazonSyncRule', {
      schedule: events.Schedule.rate(cdk.Duration.hours(1)),
      description: 'Sync Amazon products every hour',
      enabled: false, // Disabled by default - enable after credentials are set
    });
    amazonSyncRule.addTarget(new targets.LambdaFunction(amazonSyncFn));

    // Walmart: Every 2 hours
    const walmartSyncRule = new events.Rule(this, 'WalmartSyncRule', {
      schedule: events.Schedule.rate(cdk.Duration.hours(2)),
      description: 'Sync Walmart products every 2 hours',
      enabled: false, // Disabled by default
    });
    walmartSyncRule.addTarget(new targets.LambdaFunction(walmartSyncFn));

    // Outputs
    new cdk.CfnOutput(this, 'AmazonSyncFunctionName', {
      value: amazonSyncFn.functionName,
      description: 'Amazon sync Lambda function name',
    });

    new cdk.CfnOutput(this, 'WalmartSyncFunctionName', {
      value: walmartSyncFn.functionName,
      description: 'Walmart sync Lambda function name',
    });

    new cdk.CfnOutput(this, 'AmazonSyncRuleName', {
      value: amazonSyncRule.ruleName,
      description: 'Amazon sync EventBridge rule',
    });

    new cdk.CfnOutput(this, 'WalmartSyncRuleName', {
      value: walmartSyncRule.ruleName,
      description: 'Walmart sync EventBridge rule',
    });
  }
}