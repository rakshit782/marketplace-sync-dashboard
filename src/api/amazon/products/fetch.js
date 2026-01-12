/**
 * Amazon SP-API: Fetch all products
 * Endpoint: GET /catalog/2022-04-01/items
 */

const { getAmazonAccessToken } = require('../../../lib/auth/amazon');
const { getParameter } = require('../../../lib/aws/ssm');

exports.handler = async (event) => {
  try {
    const accessToken = await getAmazonAccessToken();
    const marketplaceId = await getParameter('/marketplace-sync/amazon/marketplace-id');
    
    const { keywords, nextToken, pageSize = 20 } = JSON.parse(event.body || '{}');

    const params = new URLSearchParams({
      marketplaceIds: marketplaceId,
      ...(keywords && { keywords }),
      ...(pageSize && { pageSize: pageSize.toString() }),
      ...(nextToken && { pageToken: nextToken }),
    });

    const response = await fetch(
      `https://sellingpartnerapi-na.amazon.com/catalog/2022-04-01/items?${params}`,
      {
        headers: {
          'x-amz-access-token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Amazon API error: ${response.status} ${response.statusText}`);
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
        data: {
          items: data.items || [],
          pagination: {
            nextToken: data.pagination?.nextToken || null,
            totalItems: data.items?.length || 0,
          },
        },
      }),
    };
  } catch (error) {
    console.error('Error fetching Amazon products:', error);
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