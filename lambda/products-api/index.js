const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.PRODUCTS_TABLE_NAME;

exports.handler = async (event) => {
  const { httpMethod, pathParameters, body } = event;

  try {
    switch (httpMethod) {
      case 'GET':
        return await getProducts();
      
      case 'POST':
        return await createProduct(JSON.parse(body));
      
      case 'PUT':
        return await updateProduct(pathParameters.id, JSON.parse(body));
      
      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

async function getProducts() {
  const command = new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: 'sk = :metadata',
    ExpressionAttributeValues: {
      ':metadata': 'METADATA',
    },
  });

  const result = await docClient.send(command);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      products: result.Items || [],
      count: result.Count,
    }),
  };
}

async function createProduct(data) {
  const product = {
    pk: `PRODUCT#${data.sku}`,
    sk: 'METADATA',
    ...data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: product,
    })
  );

  return {
    statusCode: 201,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(product),
  };
}

async function updateProduct(id, updates) {
  const updateExpression = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  Object.keys(updates).forEach((key, index) => {
    updateExpression.push(`#${key} = :val${index}`);
    expressionAttributeNames[`#${key}`] = key;
    expressionAttributeValues[`:val${index}`] = updates[key];
  });

  updateExpression.push('#updated_at = :updated');
  expressionAttributeNames['#updated_at'] = 'updated_at';
  expressionAttributeValues[':updated'] = new Date().toISOString();

  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: {
      pk: `PRODUCT#${id}`,
      sk: 'METADATA',
    },
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  });

  const result = await docClient.send(command);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(result.Attributes),
  };
}