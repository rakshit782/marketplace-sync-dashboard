/**
 * Multi-tenant Credential Management System
 * Fetches from Neon Database (CRED_DATABASE_URL)
 */

const { neon } = require('@neondatabase/serverless');

let credentialCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get Neon connection for credentials database
 */
function getCredDb() {
  const credDatabaseUrl = process.env.CRED_DATABASE_URL;
  
  if (!credDatabaseUrl) {
    throw new Error('CRED_DATABASE_URL is not set');
  }

  return neon(credDatabaseUrl);
}

/**
 * Fetch credentials from Neon database (organization-scoped)
 */
async function getCredentials(marketplace, organizationId, forceRefresh = false) {
  const cacheKey = `${organizationId}-${marketplace}`;

  // Check cache
  const cached = credentialCache.get(cacheKey);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Using cached credentials for org ${organizationId}, marketplace ${marketplace}`);
    return cached.data;
  }

  const sql = getCredDb();

  try {
    const result = await sql`
      SELECT credentials 
      FROM api_credentials 
      WHERE organization_id = ${organizationId}
      AND marketplace = ${marketplace}
      AND is_active = true
      LIMIT 1
    `;

    if (!result || result.length === 0) {
      throw new Error(`No active credentials found for ${marketplace} in organization ${organizationId}`);
    }

    const credentials = result[0].credentials;

    // Validate credentials structure
    if (!credentials.clientId || !credentials.clientSecret) {
      throw new Error(`Invalid credentials structure for ${marketplace}`);
    }

    // Update cache
    credentialCache.set(cacheKey, {
      data: credentials,
      timestamp: Date.now(),
    });

    console.log(`Loaded credentials for org ${organizationId}, marketplace ${marketplace}`);
    return credentials;
  } catch (error) {
    console.error(`Error fetching credentials from Neon:`, error);
    throw error;
  }
}

/**
 * Update credentials in Neon database
 */
async function updateCredentials(marketplace, organizationId, credentials, userId) {
  const sql = getCredDb();

  try {
    await sql`
      INSERT INTO api_credentials (
        organization_id,
        marketplace,
        credentials,
        is_active,
        created_by
      )
      VALUES (
        ${organizationId},
        ${marketplace},
        ${JSON.stringify(credentials)}::jsonb,
        true,
        ${userId}
      )
      ON CONFLICT (organization_id, marketplace)
      DO UPDATE SET
        credentials = ${JSON.stringify(credentials)}::jsonb,
        updated_at = CURRENT_TIMESTAMP,
        is_active = true
    `;

    // Clear cache
    const cacheKey = `${organizationId}-${marketplace}`;
    credentialCache.delete(cacheKey);

    console.log(`Updated credentials for org ${organizationId}, marketplace ${marketplace}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating credentials:', error);
    throw error;
  }
}

/**
 * Delete credentials from Neon database
 */
async function deleteCredentials(marketplace, organizationId) {
  const sql = getCredDb();

  try {
    await sql`
      UPDATE api_credentials
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE organization_id = ${organizationId}
      AND marketplace = ${marketplace}
    `;

    // Clear cache
    const cacheKey = `${organizationId}-${marketplace}`;
    credentialCache.delete(cacheKey);

    return { success: true };
  } catch (error) {
    console.error('Error deleting credentials:', error);
    throw error;
  }
}

/**
 * Clear credential cache
 */
function clearCredentialCache() {
  credentialCache.clear();
}

module.exports = {
  getCredentials,
  updateCredentials,
  deleteCredentials,
  clearCredentialCache,
  getCredDb,
};