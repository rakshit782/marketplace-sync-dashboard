/**
 * List products from DynamoDB for authenticated organization
 */

const { withAuth } = require('../../lib/auth/middleware');
const { queryProductsByOrg } = require('../../lib/aws/dynamodb');

async function handler(event) {
  try {
    const { organizationId } = event.auth;
    const { marketplace, limit, lastKey } = event.queryStringParameters || {};

    const options = {
      marketplace,
      limit: limit ? parseInt(limit) : 50,
      exclusiveStartKey: lastKey ? JSON.parse(decodeURIComponent(lastKey)) : undefined,
    };

    const result = await queryProductsByOrg(organizationId, options);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: result.items,
        count: result.count,
        nextKey: result.lastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.lastEvaluatedKey)) : null,
      }),
    };
  } catch (error) {
    console.error('Error listing products:', error);
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
}

exports.handler = withAuth(handler);