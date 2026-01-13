// Lambda function wrapper for Amazon Products API
const fetchHandler = require('./fetch');
const getHandler = require('./get');
const updateHandler = require('./update');

exports.handler = async (event) => {
  const { httpMethod, pathParameters } = event;

  try {
    // Route based on HTTP method and path
    if (httpMethod === 'GET' && pathParameters?.sku) {
      return await getHandler.handler(event);
    } else if (httpMethod === 'PATCH' && pathParameters?.sku) {
      return await updateHandler.handler(event);
    } else if (httpMethod === 'GET' || httpMethod === 'POST') {
      return await fetchHandler.handler(event);
    } else {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};