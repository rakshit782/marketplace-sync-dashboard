const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const ssmClient = new SSMClient({});

const TABLE_NAME = process.env.PRODUCTS_TABLE_NAME;

// Get credentials from Parameter Store
async function getParameter(name) {
  const command = new GetParameterCommand({
    Name: name,
    WithDecryption: true,
  });
  const response = await ssmClient.send(command);
  return response.Parameter.Value;
}

// Amazon SP-API token management
async function getAmazonAccessToken() {
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

  const data = await response.json();
  return data.access_token;
}

// Sync products from Amazon
exports.handler = async (event) => {
  console.log('Starting Amazon sync...');

  try {
    const accessToken = await getAmazonAccessToken();
    const marketplaceId = await getParameter('/marketplace-sync/amazon/marketplace-id');

    // Fetch catalog items
    const response = await fetch(
      `https://sellingpartnerapi-na.amazon.com/catalog/2022-04-01/items?marketplaceIds=${marketplaceId}`,
      {
        headers: {
          'x-amz-access-token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    const items = data.items || [];

    console.log(`Found ${items.length} items from Amazon`);

    // Store in DynamoDB
    for (const item of items) {
      const product = {
        pk: `PRODUCT#${item.asin}`,
        sk: 'METADATA',
        marketplace: 'amazon',
        asin: item.asin,
        sku: item.identifiers?.marketplaceSkus?.[0] || item.asin,
        title: item.summaries?.[0]?.itemName || '',
        brand: item.summaries?.[0]?.brand || '',
        category: item.summaries?.[0]?.productType || '',
        image_url: item.images?.[0]?.images?.[0]?.link || '',
        updated_at: new Date().toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: product,
        })
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Amazon sync completed',
        itemsProcessed: items.length,
      }),
    };
  } catch (error) {
    console.error('Error syncing Amazon products:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to sync Amazon products',
        details: error.message,
      }),
    };
  }
};