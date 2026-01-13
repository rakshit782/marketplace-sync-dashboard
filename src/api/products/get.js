/**
 * Get single product from DynamoDB
 */

const { withAuth } = require('../../lib/auth/middleware');
const { getProduct } = require('../../lib/aws/dynamodb');

async function handler(event) {
  try {
    const { organizationId } = event.auth;
    const { sku } = event.pathParameters || {};

    if (!sku) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'SKU is required',
        }),
      };
    }

    const product = await getProduct(sku, organizationId);

    if (!product) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Product not found',
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: product,
      }),
    };
  } catch (error) {
    console.error('Error getting product:', error);
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
}

exports.handler = withAuth(handler);