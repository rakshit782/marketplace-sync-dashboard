/**
 * Walmart Marketplace API: Update item
 * Endpoint: PUT /v3/items/{sku}
 */

const { getWalmartAccessToken } = require('../../../lib/auth/walmart');
const crypto = require('crypto');

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

    const accessToken = await getWalmartAccessToken();

    // Construct Walmart item payload
    const payload = {
      sku: sku,
      productName: updates.title,
      ...(updates.description && { shortDescription: updates.description }),
      ...(updates.brand && { brand: updates.brand }),
    };

    const response = await fetch(
      `https://marketplace.walmartapis.com/v3/items/${sku}`,
      {
        method: 'PUT',
        headers: {
          'WM_SEC.ACCESS_TOKEN': accessToken,
          'WM_SVC.NAME': 'Walmart Marketplace',
          'WM_QOS.CORRELATION_ID': crypto.randomUUID(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`Walmart API error: ${response.status}`);
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
    console.error('Error updating Walmart product:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};