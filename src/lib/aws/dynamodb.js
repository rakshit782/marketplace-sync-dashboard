/**
 * DynamoDB utilities
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.PRODUCTS_TABLE_NAME;

async function putItem(item) {
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
  });
  return await docClient.send(command);
}

async function getItem(pk, sk) {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { pk, sk },
  });
  const result = await docClient.send(command);
  return result.Item;
}

async function queryItems(params) {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    ...params,
  });
  return await docClient.send(command);
}

async function scanItems(params) {
  const command = new ScanCommand({
    TableName: TABLE_NAME,
    ...params,
  });
  return await docClient.send(command);
}

async function updateItem(pk, sk, updates) {
  const updateExpression = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  Object.keys(updates).forEach((key, index) => {
    updateExpression.push(`#${key} = :val${index}`);
    expressionAttributeNames[`#${key}`] = key;
    expressionAttributeValues[`:val${index}`] = updates[key];
  });

  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { pk, sk },
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  });

  const result = await docClient.send(command);
  return result.Attributes;
}

module.exports = {
  putItem,
  getItem,
  queryItems,
  scanItems,
  updateItem,
};