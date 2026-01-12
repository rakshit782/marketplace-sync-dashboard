/**
 * Amazon SP-API: Get product pricing
 * Endpoint: GET /products/pricing/v0/price
 */

const { getAmazonAccessToken } = require('../../../lib/auth/amazon');
const { getParameter } = require('../../../lib/aws/ssm');

exports.handler = async (event) => {
  try {
    const { skus } = event.queryStringParameters || {};

    if (!skus) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'SKUs parameter is required' }),
      };
    }

    const accessToken = await getAmazonAccessToken();
    const marketplaceId = await getParameter('/marketplace-sync/amazon/marketplace-id');

    const response = await fetch(
      `https://sellingpartnerapi-na.amazon.com/products/pricing/v0/price?MarketplaceId=${marketplaceId}&Skus=${skus}&ItemType=Sku`,
      {
        headers: {
          'x-amz-access-token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Amazon API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: data,
      }),
    };
  } catch (error) {
    console.error('Error getting Amazon pricing:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};