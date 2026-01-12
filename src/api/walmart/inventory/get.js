/**
 * Walmart Marketplace API: Get inventory
 * Endpoint: GET /v3/inventory
 */

const { getWalmartAccessToken } = require('../../../lib/auth/walmart');
const crypto = require('crypto');

exports.handler = async (event) => {
  try {
    const { sku } = event.queryStringParameters || {};

    if (!sku) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'SKU parameter is required' }),
      };
    }

    const accessToken = await getWalmartAccessToken();

    const response = await fetch(
      `https://marketplace.walmartapis.com/v3/inventory?sku=${sku}`,
      {
        headers: {
          'WM_SEC.ACCESS_TOKEN': accessToken,
          'WM_SVC.NAME': 'Walmart Marketplace',
          'WM_QOS.CORRELATION_ID': crypto.randomUUID(),
          'Content-Type': 'application/json',
        },
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
    console.error('Error getting Walmart inventory:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};