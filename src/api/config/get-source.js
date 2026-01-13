/**
 * API endpoint to get current credential source
 */

const { getCurrentSource } = require('../../lib/config/credentials');

exports.handler = async (event) => {
  try {
    const source = getCurrentSource();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        source: source,
      }),
    };
  } catch (error) {
    console.error('Error getting credential source:', error);
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