/**
 * Amazon SP-API Authentication
 */

const { getParameter } = require('../aws/ssm');

let cachedToken = null;
let tokenExpiry = 0;

async function getAmazonAccessToken() {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const clientId = await getParameter('/marketplace-sync/amazon/client-id');
    const clientSecret = await getParameter('/marketplace-sync/amazon/client-secret');
    const refreshToken = await getParameter('/marketplace-sync/amazon/refresh-token');

    const response = await fetch('https://api.amazon.com/auth/o2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
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