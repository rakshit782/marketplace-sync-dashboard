/**
 * Update marketplace credentials for organization
 */

const { withAuth } = require('../../lib/auth/middleware');
const { updateCredentials } = require('../../lib/config/credentials');

async function handler(event) {
  try {
    const { organizationId, userId } = event.auth;
    const { marketplace } = event.pathParameters || {};
    const { credentials, notes } = JSON.parse(event.body || '{}');

    if (!marketplace || !credentials) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Marketplace and credentials are required',
        }),
      };
    }

    // Validate credentials structure
    if (!credentials.clientId || !credentials.clientSecret) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'clientId and clientSecret are required',
        }),
      };
    }

    await updateCredentials(marketplace, organizationId, credentials, userId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        message: `${marketplace} credentials updated successfully`,
      }),
    };
  } catch (error) {
    console.error('Error updating credentials:', error);
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

exports.handler = withAuth(handler, 'admin');