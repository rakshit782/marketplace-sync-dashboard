import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export class MarketplaceSyncStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table for Products
    const productsTable = new dynamodb.Table(this, 'ProductsTable', {
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI for querying by organizationId
    productsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'organizationId', type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: 'created_at', type: dynamodb.AttributeType.STRING },
    });

    // Lambda Environment Variables
    const lambdaEnv = {
      CRED_DATABASE_URL: process.env.CRED_DATABASE_URL || '',
      PRODUCTS_TABLE_NAME: productsTable.tableName,
      AWS_REGION: this.region,
      JWT_SECRET: process.env.JWT_SECRET || 'change-this-in-production',
    };

    // Common Lambda properties
    const lambdaProps = {
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: lambdaEnv,
    };

    // Auth Functions
    const registerFn = new lambda.Function(this, 'RegisterFunction', {
      ...lambdaProps,
      handler: 'register.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../src/api/auth')),
    });

    const loginFn = new lambda.Function(this, 'LoginFunction', {
      ...lambdaProps,
      handler: 'login.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../src/api/auth')),
    });

    const meFn = new lambda.Function(this, 'MeFunction', {
      ...lambdaProps,
      handler: 'me.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../src/api/auth')),
    });

    // Product Functions
    const productsListFn = new lambda.Function(this, 'ProductsListFunction', {
      ...lambdaProps,
      handler: 'list.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../src/api/products')),
    });

    const productsGetFn = new lambda.Function(this, 'ProductsGetFunction', {
      ...lambdaProps,
      handler: 'get.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../src/api/products')),
    });

    // Grant DynamoDB permissions
    productsTable.grantReadWriteData(productsListFn);
    productsTable.grantReadData(productsGetFn);

    // Credentials Functions
    const credentialsListFn = new lambda.Function(this, 'CredentialsListFunction', {
      ...lambdaProps,
      handler: 'list.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../src/api/credentials')),
    });

    const credentialsGetFn = new lambda.Function(this, 'CredentialsGetFunction', {
      ...lambdaProps,
      handler: 'get.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../src/api/credentials')),
    });

    const credentialsUpdateFn = new lambda.Function(this, 'CredentialsUpdateFunction', {
      ...lambdaProps,
      handler: 'update.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../src/api/credentials')),
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'MarketplaceSyncApi', {
      restApiName: 'Marketplace Sync API',
      description: 'Multi-tenant marketplace sync API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // API Routes
    const apiResource = api.root.addResource('api');

    // Auth routes
    const authResource = apiResource.addResource('auth');
    authResource.addResource('register').addMethod('POST', new apigateway.LambdaIntegration(registerFn));
    authResource.addResource('login').addMethod('POST', new apigateway.LambdaIntegration(loginFn));
    authResource.addResource('me').addMethod('GET', new apigateway.LambdaIntegration(meFn));

    // Products routes
    const productsResource = apiResource.addResource('products');
    productsResource.addMethod('GET', new apigateway.LambdaIntegration(productsListFn));
    const productResource = productsResource.addResource('{sku}');
    productResource.addMethod('GET', new apigateway.LambdaIntegration(productsGetFn));

    // Credentials routes
    const credentialsResource = apiResource.addResource('credentials');
    credentialsResource.addMethod('GET', new apigateway.LambdaIntegration(credentialsListFn));
    const credentialResource = credentialsResource.addResource('{marketplace}');
    credentialResource.addMethod('GET', new apigateway.LambdaIntegration(credentialsGetFn));
    credentialResource.addMethod('PUT', new apigateway.LambdaIntegration(credentialsUpdateFn));

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'ProductsTableName', {
      value: productsTable.tableName,
      description: 'DynamoDB Products Table Name',
    });
  }
}