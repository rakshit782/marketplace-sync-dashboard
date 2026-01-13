/**
 * List all marketplace credentials for organization
 */

const { withAuth } = require('../../lib/auth/middleware');
const { getCredDb } = require('../../lib/config/credentials');

async function handler(event) {
  try {
    const { organizationId } = event.auth;
    const sql = getCredDb();

    const result = await sql`
      SELECT 
        id,
        marketplace,
        is_active,
        created_at,
        updated_at,
        notes
      FROM api_credentials
      WHERE organization_id = ${organizationId}
      ORDER BY marketplace ASC
    `;

    const credentials = result.map(cred => ({
      id: cred.id,
      marketplace: cred.marketplace,
      isActive: cred.is_active,
      createdAt: cred.created_at,
      updatedAt: cred.updated_at,
      notes: cred.notes,
      hasCredentials: true, // Don't expose actual credentials
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: credentials,
      }),
    };
  } catch (error) {
    console.error('Error listing credentials:', error);
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

exports.handler = withAuth(handler, 'viewer');