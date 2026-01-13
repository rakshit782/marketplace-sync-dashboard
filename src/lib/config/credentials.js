/**
 * Credential Management System
 * Supports two sources: dotenv file and Neon database
 */

const { neon } = require('@neondatabase/serverless');
const { getParameter } = require('../aws/ssm');

// Cache for credentials
let credentialCache = {
  source: null,
  data: null,
  timestamp: null,
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get credential source preference
 * Reads from environment variable: CREDENTIAL_SOURCE (dotenv | neon | ssm)
 */
function getCredentialSource() {
  return process.env.CREDENTIAL_SOURCE || 'ssm'; // Default to SSM Parameter Store
}

/**
 * Fetch credentials from dotenv (environment variables)
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

  // Validate required fields
  if (!credentials.clientId || !credentials.clientSecret) {
    throw new Error(`Missing ${marketplace} credentials in environment variables`);
  }

  return credentials;
}

/**
 * Fetch credentials from Neon database
 */
async function getCredentialsFromNeon(marketplace) {
  const databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('NEON_DATABASE_URL is not set');
  }

  const sql = neon(databaseUrl);

  try {
    const result = await sql`
      SELECT credentials 
      FROM api_credentials 
      WHERE marketplace = ${marketplace} 
      AND is_active = true
      LIMIT 1
    `;

    if (!result || result.length === 0) {
      throw new Error(`No active credentials found for ${marketplace} in database`);
    }

    const credentials = result[0].credentials;
    
    // Validate structure
    if (!credentials.clientId || !credentials.clientSecret) {
      throw new Error(`Invalid credentials structure for ${marketplace} in database`);
    }

    return credentials;
  } catch (error) {
    console.error(`Error fetching credentials from Neon for ${marketplace}:`, error);
    throw error;
  }
}

/**
 * Fetch credentials from AWS Systems Manager Parameter Store
 */
async function getCredentialsFromSSM(marketplace) {
  const credentials = {
    clientId: await getParameter(`/marketplace-sync/${marketplace}/client-id`),
    clientSecret: await getParameter(`/marketplace-sync/${marketplace}/client-secret`),
  };

  if (marketplace === 'amazon') {
    credentials.refreshToken = await getParameter('/marketplace-sync/amazon/refresh-token');
    credentials.sellerId = await getParameter('/marketplace-sync/amazon/seller-id');
    credentials.marketplaceId = await getParameter('/marketplace-sync/amazon/marketplace-id');
  }

  return credentials;
}

/**
 * Main function to get credentials based on configured source
 */
async function getCredentials(marketplace, forceRefresh = false) {
  const source = getCredentialSource();
  const cacheKey = `${marketplace}-${source}`;

  // Check cache
  if (
    !forceRefresh &&
    credentialCache.source === cacheKey &&
    credentialCache.data &&
    credentialCache.timestamp &&
    Date.now() - credentialCache.timestamp < CACHE_TTL
  ) {
    console.log(`Using cached credentials for ${marketplace} from ${source}`);
    return credentialCache.data;
  }

  console.log(`Fetching credentials for ${marketplace} from ${source}`);

  let credentials;

  try {
    switch (source) {
      case 'dotenv':
      case 'env':
        credentials = await getCredentialsFromEnv(marketplace);
        break;
      
      case 'neon':
      case 'database':
        credentials = await getCredentialsFromNeon(marketplace);
        break;
      
      case 'ssm':
      case 'aws':
      default:
        credentials = await getCredentialsFromSSM(marketplace);
        break;
    }

    // Update cache
    credentialCache = {
      source: cacheKey,
      data: credentials,
      timestamp: Date.now(),
    };

    return credentials;
  } catch (error) {
    console.error(`Failed to fetch credentials for ${marketplace} from ${source}:`, error);
    throw new Error(`Failed to load ${marketplace} credentials from ${source}: ${error.message}`);
  }
}

/**
 * Clear credential cache
 */
function clearCredentialCache() {
  credentialCache = {
    source: null,
    data: null,
    timestamp: null,
  };
}

/**
 * Get current credential source
 */
function getCurrentSource() {
  return getCredentialSource();
}

module.exports = {
  getCredentials,
  clearCredentialCache,
  getCurrentSource,
  getCredentialSource,
};