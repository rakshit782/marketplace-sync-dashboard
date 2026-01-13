/**
 * Get marketplace credentials for organization
 */

const { withAuth } = require('../../lib/auth/middleware');
const { getCredDb } = require('../../lib/config/credentials');

async function handler(event) {
  try {
    const { organizationId } = event.auth;
    const { marketplace } = event.pathParameters || {};

    if (!marketplace) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Marketplace parameter is required',
        }),
      };
    }

    const sql = getCredDb();

    const result = await sql`
      SELECT 
        id,
        marketplace,
        credentials,
        is_active,
        created_at,
        updated_at,
        notes
      FROM api_credentials
      WHERE organization_id = ${organizationId}
      AND marketplace = ${marketplace}
      AND is_active = true
      LIMIT 1
    `;

    if (!result || result.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: `No credentials found for ${marketplace}`,
        }),
      };
    }

    // Mask sensitive fields
    const creds = result[0];
    const maskedCredentials = {
      ...creds.credentials,
      clientSecret: creds.credentials.clientSecret ? '••••••••' : undefined,
      refreshToken: creds.credentials.refreshToken ? '••••••••' : undefined,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: {
          id: creds.id,
          marketplace: creds.marketplace,
          credentials: maskedCredentials,
          isActive: creds.is_active,
          createdAt: creds.created_at,
          updatedAt: creds.updated_at,
          notes: creds.notes,
        },
      }),
    };
  } catch (error) {
    console.error('Error getting credentials:', error);
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