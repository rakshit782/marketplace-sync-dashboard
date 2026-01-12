import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class MarketplaceSyncStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC for RDS (Free Tier: use default VPC or create minimal)
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVPC', {
      isDefault: true,
    });

    // Option 1: RDS PostgreSQL (Free Tier: db.t3.micro, 20GB)
    const dbInstance = new rds.DatabaseInstance(this, 'MarketplaceDB', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      allocatedStorage: 20, // Free Tier: up to 20GB
      maxAllocatedStorage: 20,
      databaseName: 'marketplacesync',
      publiclyAccessible: false,
      deletionProtection: false, // Set to true in production
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev only
    });

    // Option 2: DynamoDB (Always Free: 25GB, 25 WCU, 25 RCU)
    const productsTable = new dynamodb.Table(this, 'ProductsTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Free Tier compatible
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: false, // Keep costs down
    });

    // Add GSI for querying by marketplace
    productsTable.addGlobalSecondaryIndex({
      indexName: 'marketplace-index',
      partitionKey: { name: 'marketplace', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'updated_at', type: dynamodb.AttributeType.STRING },
    });

    // Lambda Layer for shared dependencies
    const dependenciesLayer = new lambda.LayerVersion(this, 'DependenciesLayer', {
      code: lambda.Code.fromAsset('../../lambda-layers/dependencies'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: 'Shared dependencies for marketplace sync',
    });

    // Environment variables for Lambda functions
    const lambdaEnv = {
      PRODUCTS_TABLE_NAME: productsTable.tableName,
      DB_HOST: dbInstance.dbInstanceEndpointAddress,
      DB_NAME: 'marketplacesync',
      REGION: this.region,
    };

    // Lambda: Amazon SP-API Integration
    const amazonSyncFn = new lambda.Function(this, 'AmazonSyncFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../../lambda/amazon-sync'),
      timeout: cdk.Duration.seconds(300), // 5 min max
      memorySize: 512, // Free Tier: 400,000 GB-seconds/month
      environment: lambdaEnv,
      layers: [dependenciesLayer],
    });

    // Lambda: Walmart API Integration
    const walmartSyncFn = new lambda.Function(this, 'WalmartSyncFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../../lambda/walmart-sync'),
      timeout: cdk.Duration.seconds(300),
      memorySize: 512,
      environment: lambdaEnv,
      layers: [dependenciesLayer],
    });

    // Lambda: Products API
    const productsApiFn = new lambda.Function(this, 'ProductsAPIFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../../lambda/products-api'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: lambdaEnv,
      layers: [dependenciesLayer],
    });

    // Grant permissions
    productsTable.grantReadWriteData(amazonSyncFn);
    productsTable.grantReadWriteData(walmartSyncFn);
    productsTable.grantReadWriteData(productsApiFn);
    dbInstance.grantConnect(amazonSyncFn);
    dbInstance.grantConnect(walmartSyncFn);
    dbInstance.grantConnect(productsApiFn);

    // API Gateway REST API (Free Tier: 1M requests/month)
    const api = new apigateway.RestApi(this, 'MarketplaceSyncAPI', {
      restApiName: 'Marketplace Sync API',
      description: 'API for marketplace sync dashboard',
      deployOptions: {
        stageName: 'prod',
        throttlingBurstLimit: 100,
        throttlingRateLimit: 50,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // API Routes
    const amazonResource = api.root.addResource('amazon');
    amazonResource.addResource('sync').addMethod(
      'POST',
      new apigateway.LambdaIntegration(amazonSyncFn)
    );

    const walmartResource = api.root.addResource('walmart');
    walmartResource.addResource('sync').addMethod(
      'POST',
      new apigateway.LambdaIntegration(walmartSyncFn)
    );

    const productsResource = api.root.addResource('products');
    productsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(productsApiFn)
    );
    productsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(productsApiFn)
    );
    productsResource.addResource('{id}').addMethod(
      'PUT',
      new apigateway.LambdaIntegration(productsApiFn)
    );

    // S3 Bucket for static frontend (Free Tier: 5GB)
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront Distribution (Free Tier: 50GB/month)
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // EventBridge: Scheduled sync jobs (Free Tier: Always free)
    // Sync every 30 minutes
    const syncRule = new events.Rule(this, 'SyncScheduleRule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(30)),
      description: 'Trigger marketplace sync every 30 minutes',
    });

    syncRule.addTarget(new targets.LambdaFunction(amazonSyncFn));
    syncRule.addTarget(new targets.LambdaFunction(walmartSyncFn));

    // Outputs
    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: distribution.distributionDomainName,
      description: 'CloudFront URL for dashboard',
    });

    new cdk.CfnOutput(this, 'ApiURL', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: websiteBucket.bucketName,
      description: 'S3 bucket for frontend',
    });

    new cdk.CfnOutput(this, 'DBEndpoint', {
      value: dbInstance.dbInstanceEndpointAddress,
      description: 'RDS endpoint',
    });

    new cdk.CfnOutput(this, 'DynamoDBTable', {
      value: productsTable.tableName,
      description: 'DynamoDB table name',
    });
  }
}