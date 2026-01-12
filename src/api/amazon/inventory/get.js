/**
 * Amazon SP-API: Get FBA inventory
 * Endpoint: GET /fba/inventory/v1/summaries
 */

const { getAmazonAccessToken } = require('../../../lib/auth/amazon');
const { getParameter } = require('../../../lib/aws/ssm');

exports.handler = async (event) => {
  try {
    const { skus } = event.queryStringParameters || {};
    
    const accessToken = await getAmazonAccessToken();
    const marketplaceId = await getParameter('/marketplace-sync/amazon/marketplace-id');

    const params = new URLSearchParams({
      marketplaceIds: marketplaceId,
      ...(skus && { sellerSkus: skus }),
    });

    const response = await fetch(
      `https://sellingpartnerapi-na.amazon.com/fba/inventory/v1/summaries?${params}`,
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
        data: data.payload?.inventorySummaries || [],
      }),
    };
  } catch (error) {
    console.error('Error getting Amazon inventory:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};