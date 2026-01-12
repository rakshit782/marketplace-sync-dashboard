/**
 * Walmart Marketplace API: Update inventory
 * Endpoint: PUT /v3/inventory
 */

const { getWalmartAccessToken } = require('../../../lib/auth/walmart');
const crypto = require('crypto');

exports.handler = async (event) => {
  try {
    const { sku, quantity } = JSON.parse(event.body || '{}');

    if (!sku || quantity === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'SKU and quantity are required' }),
      };
    }

    const accessToken = await getWalmartAccessToken();

    const payload = {
      sku,
      quantity: {
        unit: 'EACH',
        amount: quantity,
      },
    };

    const response = await fetch(
      `https://marketplace.walmartapis.com/v3/inventory?sku=${sku}`,
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
    console.error('Error updating Walmart inventory:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};