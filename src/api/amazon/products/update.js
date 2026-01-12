/**
 * Amazon SP-API: Update product listing
 * Endpoint: PATCH /listings/2021-08-01/items/{sellerId}/{sku}
 */

const { getAmazonAccessToken } = require('../../../lib/auth/amazon');
const { getParameter } = require('../../../lib/aws/ssm');

exports.handler = async (event) => {
  try {
    const { sku } = event.pathParameters || {};
    const updates = JSON.parse(event.body || '{}');

    if (!sku) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'SKU is required' }),
      };
    }

    const accessToken = await getAmazonAccessToken();
    const sellerId = await getParameter('/marketplace-sync/amazon/seller-id');
    const marketplaceId = await getParameter('/marketplace-sync/amazon/marketplace-id');

    const payload = {
      productType: updates.productType || 'PRODUCT',
      patches: [
        {
          op: 'replace',
          path: '/attributes/item_name',
          value: [{ value: updates.title, marketplace_id: marketplaceId }],
        },
      ],
    };

    // Add description if provided
    if (updates.description) {
      payload.patches.push({
        op: 'replace',
        path: '/attributes/product_description',
        value: [{ value: updates.description, marketplace_id: marketplaceId }],
      });
    }

    const response = await fetch(
      `https://sellingpartnerapi-na.amazon.com/listings/2021-08-01/items/${sellerId}/${sku}?marketplaceIds=${marketplaceId}`,
      {
        method: 'PATCH',
        headers: {
          'x-amz-access-token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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
    console.error('Error updating Amazon product:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};