/**
 * DynamoDB utilities for product storage
 * Products are stored in DynamoDB with organization isolation
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || 'MarketplaceSyncStack-ProductsTable';

/**
 * DynamoDB Schema:
 * 
 * PK: ORG#{organizationId}#PRODUCT#{sku}
 * SK: METADATA
 * 
 * Attributes:
 * - organizationId: number
 * - sku: string
 * - marketplace: string (amazon|walmart)
 * - asin: string (Amazon only)
 * - title: string
 * - description: string
 * - brand: string
 * - category: string
 * - image_url: string
 * - price: number
 * - currency: string
 * - inventory_quantity: number
 * - status: string
 * - created_at: ISO timestamp
 * - updated_at: ISO timestamp
 * - synced_at: ISO timestamp
 */

/**
 * Put product item in DynamoDB
 */
async function putProduct(product, organizationId) {
  const item = {
    PK: `ORG#${organizationId}#PRODUCT#${product.sku}`,
    SK: 'METADATA',
    organizationId,
    ...product,
    updated_at: new Date().toISOString(),
  };

  if (!item.created_at) {
    item.created_at = item.updated_at;
  }

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
  });

  await docClient.send(command);
  return item;
}

/**
 * Get product by SKU for organization
 */
async function getProduct(sku, organizationId) {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `ORG#${organizationId}#PRODUCT#${sku}`,
      SK: 'METADATA',
    },
  });

  const response = await docClient.send(command);
  return response.Item;
}

/**
 * Query all products for an organization
 */
async function queryProductsByOrg(organizationId, options = {}) {
  const {
    marketplace,
    limit = 50,
    exclusiveStartKey,
  } = options;

  let filterExpression;
  let expressionAttributeValues = {
    ':orgId': organizationId,
  };

  if (marketplace) {
    filterExpression = 'marketplace = :marketplace';
    expressionAttributeValues[':marketplace'] = marketplace;
  }

  const command = new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'GSI1', // GSI1: organizationId-created_at-index
    KeyConditionExpression: 'organizationId = :orgId',
    ExpressionAttributeValues: expressionAttributeValues,
    FilterExpression: filterExpression,
    Limit: limit,
    ExclusiveStartKey: exclusiveStartKey,
    ScanIndexForward: false, // Sort by created_at descending
  });

  const response = await docClient.send(command);
  return {
    items: response.Items || [],
    lastEvaluatedKey: response.LastEvaluatedKey,
    count: response.Count,
  };
}

/**
 * Update product in DynamoDB
 */
async function updateProduct(sku, organizationId, updates) {
  const updateExpressions = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  Object.keys(updates).forEach((key, index) => {
    const placeholder = `#attr${index}`;
    const valuePlaceholder = `:val${index}`;
    updateExpressions.push(`${placeholder} = ${valuePlaceholder}`);
    expressionAttributeNames[placeholder] = key;
    expressionAttributeValues[valuePlaceholder] = updates[key];
  });

  // Always update updated_at
  updateExpressions.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updated_at';
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();

  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `ORG#${organizationId}#PRODUCT#${sku}`,
      SK: 'METADATA',
    },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  });

  const response = await docClient.send(command);
  return response.Attributes;
}

/**
 * Delete product from DynamoDB
 */
async function deleteProduct(sku, organizationId) {
  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `ORG#${organizationId}#PRODUCT#${sku}`,
      SK: 'METADATA',
    },
  });

  await docClient.send(command);
  return { success: true };
}

/**
 * Batch write products (for sync operations)
 */
async function batchPutProducts(products, organizationId) {
  const { BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
  
  const items = products.map(product => ({
    PutRequest: {
      Item: {
        PK: `ORG#${organizationId}#PRODUCT#${product.sku}`,
        SK: 'METADATA',
        organizationId,
        ...product,
        updated_at: new Date().toISOString(),
        created_at: product.created_at || new Date().toISOString(),
      },
    },
  }));

  // DynamoDB batch write limit is 25 items
  const batches = [];
  for (let i = 0; i < items.length; i += 25) {
    batches.push(items.slice(i, i + 25));
  }

  for (const batch of batches) {
    const command = new BatchWriteCommand({
      RequestItems: {
        [TABLE_NAME]: batch,
      },
    });

    await docClient.send(command);
  }

  return { success: true, count: products.length };
}

module.exports = {
  putProduct,
  getProduct,
  queryProductsByOrg,
  updateProduct,
  deleteProduct,
  batchPutProducts,
};