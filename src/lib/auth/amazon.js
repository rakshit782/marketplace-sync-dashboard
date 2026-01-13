/**
 * Amazon SP-API Authentication
 */

const { getCredentials } = require('../config/credentials');

let cachedToken = null;
let tokenExpiry = 0;

async function getAmazonAccessToken() {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const credentials = await getCredentials('amazon');

    const response = await fetch('https://api.amazon.com/auth/o2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: credentials.refreshToken,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get Amazon access token: ${response.status}`);
    }

    const data = await response.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // Refresh 1 min early

    return cachedToken;
  } catch (error) {
    console.error('Amazon auth error:', error);
    throw error;
  }
}

module.exports = {
  getAmazonAccessToken,
};