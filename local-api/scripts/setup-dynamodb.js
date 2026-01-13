/**
 * Setup DynamoDB Local with tables
 */

require('dotenv').config({ path: '../../.env.local' });
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  CreateTableCommand,
  DescribeTableCommand,
  DeleteTableCommand,
} = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'local',
    secretAccessKey: 'local',
  },
});

const TABLE_NAME = 'MarketplaceSyncStack-ProductsTable';

async function setupDynamoDB() {
  console.log('🔧 Setting up DynamoDB Local...\n');

  try {
    // Check if table exists
    try {
      await client.send(
        new DescribeTableCommand({ TableName: TABLE_NAME })
      );
      console.log('⚠️  Table already exists. Deleting...');
      await client.send(
        new DeleteTableCommand({ TableName: TABLE_NAME })
      );
      // Wait for deletion
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      // Table doesn't exist, continue
    }

    // Create table
    console.log('📦 Creating ProductsTable...');
    const command = new CreateTableCommand({
      TableName: TABLE_NAME,
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
        { AttributeName: 'organizationId', AttributeType: 'N' },
        { AttributeName: 'created_at', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'GSI1',
          KeySchema: [
            { AttributeName: 'organizationId', KeyType: 'HASH' },
            { AttributeName: 'created_at', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    });

    await client.send(command);
    console.log('✅ ProductsTable created successfully!');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 DynamoDB Local setup complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupDynamoDB();