/**
 * API endpoint to set credential source
 * Updates Lambda environment variable
 */

const { LambdaClient, UpdateFunctionConfigurationCommand } = require('@aws-sdk/client-lambda');
const { clearCredentialCache } = require('../../lib/config/credentials');

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  try {
    const { source } = JSON.parse(event.body || '{}');

    if (!source || !['dotenv', 'neon', 'ssm'].includes(source)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Invalid source. Must be one of: dotenv, neon, ssm',
        }),
      };
    }

    // Get list of Lambda functions to update
    const functionNames = [
      'MarketplaceSyncStack-AmazonProductsFetch',
      'MarketplaceSyncStack-AmazonProductsGet',
      'MarketplaceSyncStack-AmazonProductsUpdate',
      'MarketplaceSyncStack-WalmartProductsFetch',
      'MarketplaceSyncStack-WalmartProductsGet',
      'MarketplaceSyncStack-WalmartProductsUpdate',
    ];

    // Update each Lambda function's environment variable
    const updates = functionNames.map(async (functionName) => {
      try {
        const command = new UpdateFunctionConfigurationCommand({
          FunctionName: functionName,
          Environment: {
            Variables: {
              CREDENTIAL_SOURCE: source,
            },
          },
        });
        await lambdaClient.send(command);
        return { functionName, success: true };
      } catch (error) {
        console.error(`Failed to update ${functionName}:`, error);
        return { functionName, success: false, error: error.message };
      }
    });

    const results = await Promise.all(updates);

    // Clear credential cache
    clearCredentialCache();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        message: `Credential source updated to: ${source}`,
        source: source,
        updates: results,
      }),
    };
  } catch (error) {
    console.error('Error setting credential source:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};