/**
 * Walmart Marketplace API: Fetch all items
 * Endpoint: GET /v3/items
 */

const { getWalmartAccessToken } = require('../../../lib/auth/walmart');
const crypto = require('crypto');

exports.handler = async (event) => {
  try {
    const { limit = 50, offset = 0 } = event.queryStringParameters || {};

    const accessToken = await getWalmartAccessToken();

    const response = await fetch(
      `https://marketplace.walmartapis.com/v3/items?limit=${limit}&offset=${offset}`,
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
        data: {
          items: data.ItemResponse || [],
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            totalItems: data.totalItems || 0,
          },
        },
      }),
    };
  } catch (error) {
    console.error('Error fetching Walmart products:', error);
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