/**
 * Save or update marketplace credentials
 */

const { Client } = require('pg');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'local-dev-secret-key';

async function handler(event) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
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
    const { marketplace, credentials } = JSON.parse(event.body);

    if (!marketplace || !credentials) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Marketplace and credentials are required' })
      };
    }

    // Validate based on marketplace
    if (marketplace === 'amazon') {
      const { clientId, clientSecret, refreshToken, sellerId, marketplaceId } = credentials;
      if (!clientId || !clientSecret || !refreshToken || !sellerId || !marketplaceId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            success: false, 
            error: 'All Amazon credentials are required: clientId, clientSecret, refreshToken, sellerId, marketplaceId' 
          })
        };
      }
    } else if (marketplace === 'walmart') {
      const { clientId, clientSecret } = credentials;
      if (!clientId || !clientSecret) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            success: false, 
            error: 'Client ID and Client Secret are required for Walmart' 
          })
        };
      }
    }

    const client = new Client({
      connectionString: process.env.CRED_DATABASE_URL
    });
    
    await client.connect();

    // Check if credentials exist
    const existingResult = await client.query(
      'SELECT id FROM api_credentials WHERE organization_id = $1 AND marketplace = $2',
      [organizationId, marketplace]
    );

    if (existingResult.rows.length > 0) {
      // Update existing
      await client.query(
        `UPDATE api_credentials 
         SET credentials = $1, updated_at = CURRENT_TIMESTAMP, is_active = true
         WHERE organization_id = $2 AND marketplace = $3`,
        [JSON.stringify(credentials), organizationId, marketplace]
      );
    } else {
      // Insert new
      await client.query(
        `INSERT INTO api_credentials (organization_id, marketplace, credentials, is_active, created_by)
         VALUES ($1, $2, $3, true, $4)`,
        [organizationId, marketplace, JSON.stringify(credentials), decoded.userId]
      );
    }

    await client.end();

    console.log(`✅ Credentials saved for ${marketplace} (Org: ${organizationId})`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Credentials saved successfully'
      })
    };
  } catch (error) {
    console.error('Error saving credentials:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to save credentials'
      })
    };
  }
}

exports.handler = handler;