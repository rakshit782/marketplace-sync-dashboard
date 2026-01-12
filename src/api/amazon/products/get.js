/**
 * Amazon SP-API: Get single product by SKU
 * Endpoint: GET /listings/2021-08-01/items/{sellerId}/{sku}
 */

const { getAmazonAccessToken } = require('../../../lib/auth/amazon');
const { getParameter } = require('../../../lib/aws/ssm');

exports.handler = async (event) => {
  try {
    const { sku } = event.pathParameters || {};
    
    if (!sku) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'SKU is required' }),
      };
    }

    const accessToken = await getAmazonAccessToken();
    const sellerId = await getParameter('/marketplace-sync/amazon/seller-id');
    const marketplaceId = await getParameter('/marketplace-sync/amazon/marketplace-id');

    const response = await fetch(
      `https://sellingpartnerapi-na.amazon.com/listings/2021-08-01/items/${sellerId}/${sku}?marketplaceIds=${marketplaceId}`,
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
    console.error('Error getting Amazon product:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};