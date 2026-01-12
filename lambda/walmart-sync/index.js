const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const crypto = require('crypto');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const ssmClient = new SSMClient({});

const TABLE_NAME = process.env.PRODUCTS_TABLE_NAME;

async function getParameter(name) {
  const command = new GetParameterCommand({
    Name: name,
    WithDecryption: true,
  });
  const response = await ssmClient.send(command);
  return response.Parameter.Value;
}

async function getWalmartAccessToken() {
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

  const data = await response.json();
  return data.access_token;
}

exports.handler = async (event) => {
  console.log('Starting Walmart sync...');

  try {
    const accessToken = await getWalmartAccessToken();

    const response = await fetch(
      'https://marketplace.walmartapis.com/v3/items?limit=50',
      {
        headers: {
          'WM_SEC.ACCESS_TOKEN': accessToken,
          'WM_SVC.NAME': 'Walmart Marketplace',
          'WM_QOS.CORRELATION_ID': crypto.randomUUID(),
        },
      }
    );

    const data = await response.json();
    const items = data.ItemResponse || [];

    console.log(`Found ${items.length} items from Walmart`);

    for (const item of items) {
      const product = {
        pk: `PRODUCT#${item.sku}`,
        sk: 'METADATA',
        marketplace: 'walmart',
        sku: item.sku,
        title: item.productName || '',
        brand: item.brand || '',
        category: item.category || '',
        image_url: item.primaryImageUrl || '',
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
        message: 'Walmart sync completed',
        itemsProcessed: items.length,
      }),
    };
  } catch (error) {
    console.error('Error syncing Walmart products:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to sync Walmart products',
        details: error.message,
      }),
    };
  }
};