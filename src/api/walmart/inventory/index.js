// Lambda function wrapper for Walmart Inventory API
const getHandler = require('./get');
const updateHandler = require('./update');

exports.handler = async (event) => {
  const { httpMethod } = event;

  try {
    if (httpMethod === 'GET') {
      return await getHandler.handler(event);
    } else if (httpMethod === 'PUT') {
      return await updateHandler.handler(event);
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