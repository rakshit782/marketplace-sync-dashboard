/**
 * Multi-tenant Credential Management System
 * Supports organization-scoped credentials
 */

const { neon } = require('@neondatabase/serverless');
const { getParameter } = require('../aws/ssm');

let credentialCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCredentialSource() {
  return process.env.CREDENTIAL_SOURCE || 'neon'; // Default to Neon for multi-tenant
}

/**
 * Fetch credentials from Neon database (organization-scoped)
 */
async function getCredentialsFromNeon(marketplace, organizationId) {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = neon(databaseUrl);

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

    return result[0].credentials;
  } catch (error) {
    console.error(`Error fetching credentials from Neon:`, error);
    throw error;
  }
}

/**
 * Fetch credentials from environment (single-tenant fallback)
 */
async function getCredentialsFromEnv(marketplace) {
  const prefix = marketplace.toUpperCase();
  
  const credentials = {
    clientId: process.env[`${prefix}_CLIENT_ID`],
    clientSecret: process.env[`${prefix}_CLIENT_SECRET`],
  };

  if (marketplace === 'amazon') {
    credentials.refreshToken = process.env.AMAZON_REFRESH_TOKEN;
    credentials.sellerId = process.env.AMAZON_SELLER_ID;
    credentials.marketplaceId = process.env.AMAZON_MARKETPLACE_ID || 'ATVPDKIKX0DER';
  }

  if (!credentials.clientId || !credentials.clientSecret) {
    throw new Error(`Missing ${marketplace} credentials in environment variables`);
  }

  return credentials;
}

/**
 * Main function to get credentials (multi-tenant aware)
 */
async function getCredentials(marketplace, organizationId, forceRefresh = false) {
  const source = getCredentialSource();
  const cacheKey = `${organizationId}-${marketplace}-${source}`;

  // Check cache
  const cached = credentialCache.get(cacheKey);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  let credentials;

  try {
    switch (source) {
      case 'neon':
      case 'database':
        credentials = await getCredentialsFromNeon(marketplace, organizationId);
        break;
      
      case 'dotenv':
      case 'env':
        credentials = await getCredentialsFromEnv(marketplace);
        break;
      
      case 'ssm':
      case 'aws':
      default:
        // SSM with organization prefix
        credentials = await getCredentialsFromSSM(marketplace, organizationId);
        break;
    }

    // Update cache
    credentialCache.set(cacheKey, {
      data: credentials,
      timestamp: Date.now(),
    });

    return credentials;
  } catch (error) {
    console.error(`Failed to fetch credentials:`, error);
    throw error;
  }
}

async function getCredentialsFromSSM(marketplace, organizationId) {
  const prefix = `/marketplace-sync/org-${organizationId}/${marketplace}`;
  
  const credentials = {
    clientId: await getParameter(`${prefix}/client-id`),
    clientSecret: await getParameter(`${prefix}/client-secret`),
  };

  if (marketplace === 'amazon') {
    credentials.refreshToken = await getParameter(`${prefix}/refresh-token`);
    credentials.sellerId = await getParameter(`${prefix}/seller-id`);
    credentials.marketplaceId = await getParameter(`${prefix}/marketplace-id`);
  }

  return credentials;
}

function clearCredentialCache() {
  credentialCache.clear();
}

module.exports = {
  getCredentials,
  clearCredentialCache,
  getCredentialSource,
};