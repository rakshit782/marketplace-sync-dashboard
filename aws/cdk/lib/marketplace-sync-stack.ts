import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export class MarketplaceSyncStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table (Free Tier: 25GB, 25 WCU, 25 RCU)
    const productsTable = new dynamodb.Table(this, 'ProductsTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: false,
    });

    // GSI for marketplace queries
    productsTable.addGlobalSecondaryIndex({
      indexName: 'marketplace-index',
      partitionKey: { name: 'marketplace', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'updated_at', type: dynamodb.AttributeType.STRING },
    });

    // Lambda environment variables
    const lambdaEnv = {
      PRODUCTS_TABLE_NAME: productsTable.tableName,
      AWS_REGION: this.region,
    };

    // IAM policy for SSM Parameter Store access
    const ssmPolicy = new iam.PolicyStatement({
      actions: ['ssm:GetParameter', 'ssm:GetParameters'],
      resources: [
        `arn:aws:ssm:${this.region}:${this.account}:parameter/marketplace-sync/*`,
      ],
    });

    // Helper function to create Lambda functions
    const createLambda = (name: string, codePath: string) => {
      const fn = new lambda.Function(this, name, {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, codePath)),
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        environment: lambdaEnv,
      });

      productsTable.grantReadWriteData(fn);
      fn.addToRolePolicy(ssmPolicy);
      return fn;
    };

    // Amazon Lambda Functions
    const amazonProductsFetch = createLambda('AmazonProductsFetch', '../../../src/api/amazon/products/fetch.js');
    const amazonProductsGet = createLambda('AmazonProductsGet', '../../../src/api/amazon/products/get.js');
    const amazonProductsUpdate = createLambda('AmazonProductsUpdate', '../../../src/api/amazon/products/update.js');
    const amazonInventoryGet = createLambda('AmazonInventoryGet', '../../../src/api/amazon/inventory/get.js');
    const amazonPricingGet = createLambda('AmazonPricingGet', '../../../src/api/amazon/pricing/get.js');

    // Walmart Lambda Functions
    const walmartProductsFetch = createLambda('WalmartProductsFetch', '../../../src/api/walmart/products/fetch.js');
    const walmartProductsGet = createLambda('WalmartProductsGet', '../../../src/api/walmart/products/get.js');
    const walmartProductsUpdate = createLambda('WalmartProductsUpdate', '../../../src/api/walmart/products/update.js');
    const walmartInventoryGet = createLambda('WalmartInventoryGet', '../../../src/api/walmart/inventory/get.js');
    const walmartInventoryUpdate = createLambda('WalmartInventoryUpdate', '../../../src/api/walmart/inventory/update.js');
    const walmartPricingUpdate = createLambda('WalmartPricingUpdate', '../../../src/api/walmart/pricing/update.js');

    // API Gateway
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
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // API Routes - Amazon
    const amazonApi = api.root.addResource('api').addResource('amazon');
    
    const amazonProducts = amazonApi.addResource('products');
    amazonProducts.addMethod('GET', new apigateway.LambdaIntegration(amazonProductsFetch));
    amazonProducts.addMethod('POST', new apigateway.LambdaIntegration(amazonProductsFetch)); // For body params
    
    const amazonProductSku = amazonProducts.addResource('{sku}');
    amazonProductSku.addMethod('GET', new apigateway.LambdaIntegration(amazonProductsGet));
    amazonProductSku.addMethod('PATCH', new apigateway.LambdaIntegration(amazonProductsUpdate));

    const amazonInventory = amazonApi.addResource('inventory');
    amazonInventory.addMethod('GET', new apigateway.LambdaIntegration(amazonInventoryGet));

    const amazonPricing = amazonApi.addResource('pricing');
    amazonPricing.addMethod('GET', new apigateway.LambdaIntegration(amazonPricingGet));

    // API Routes - Walmart
    const walmartApi = api.root.addResource('walmart');
    
    const walmartProducts = walmartApi.addResource('products');
    walmartProducts.addMethod('GET', new apigateway.LambdaIntegration(walmartProductsFetch));
    
    const walmartProductSku = walmartProducts.addResource('{sku}');
    walmartProductSku.addMethod('GET', new apigateway.LambdaIntegration(walmartProductsGet));
    walmartProductSku.addMethod('PUT', new apigateway.LambdaIntegration(walmartProductsUpdate));

    const walmartInventory = walmartApi.addResource('inventory');
    walmartInventory.addMethod('GET', new apigateway.LambdaIntegration(walmartInventoryGet));
    walmartInventory.addMethod('PUT', new apigateway.LambdaIntegration(walmartInventoryUpdate));

    const walmartPricing = walmartApi.addResource('pricing');
    walmartPricing.addMethod('PUT', new apigateway.LambdaIntegration(walmartPricingUpdate));

    // S3 Bucket for Frontend
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

    // CloudFront Distribution
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

    // Outputs
    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: `https://${distribution.distributionDomainName}`,
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

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront distribution ID',
    });

    new cdk.CfnOutput(this, 'DynamoDBTable', {
      value: productsTable.tableName,
      description: 'DynamoDB table name',
    });
  }
}