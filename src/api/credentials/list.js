/**
 * List all marketplace credentials for organization
 */

const { Client } = require('pg');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'local-dev-secret-key';

async function handler(event) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Get auth token
    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, error: 'No authorization token' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, error: 'Invalid token' })
      };
    }

    const { organizationId } = decoded;

    const client = new Client({
      connectionString: process.env.CRED_DATABASE_URL
    });
    
    await client.connect();

    const result = await client.query(
      `SELECT 
        id,
        marketplace,
        is_active,
        created_at,
        updated_at
      FROM api_credentials
      WHERE organization_id = $1
      ORDER BY marketplace ASC`,
      [organizationId]
    );

    await client.end();

    const credentials = result.rows.map(cred => ({
      id: cred.id,
      marketplace: cred.marketplace,
      isActive: cred.is_active,
      createdAt: cred.created_at,
      updatedAt: cred.updated_at,
      hasCredentials: true, // Don't expose actual credentials
    }));

    console.log(`📋 Listed ${credentials.length} credentials for org ${organizationId}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: credentials,
      }),
    };
  } catch (error) {
    console.error('Error listing credentials:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
}

exports.handler = handler;