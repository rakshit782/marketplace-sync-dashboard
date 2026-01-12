/**
 * Walmart Marketplace API Authentication
 */

const { getParameter } = require('../aws/ssm');

let cachedToken = null;
let tokenExpiry = 0;

async function getWalmartAccessToken() {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const clientId = await getParameter('/marketplace-sync/walmart/client-id');
    const clientSecret = await getParameter('/marketplace-sync/walmart/client-secret');

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch('https://marketplace.walmartapis.com/v3/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'WM_SVC.NAME': 'Walmart Marketplace',
        'WM_QOS.CORRELATION_ID': crypto.randomUUID(),
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`Failed to get Walmart access token: ${response.status}`);
    }

    const data = await response.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

    return cachedToken;
  } catch (error) {
    console.error('Walmart auth error:', error);
    throw error;
  }
}

module.exports = {
  getWalmartAccessToken,
};