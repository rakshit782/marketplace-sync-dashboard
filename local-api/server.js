require('dotenv').config({ path: '../.env.local' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.LOCAL_API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Set AWS SDK to use local DynamoDB
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'local';
process.env.AWS_SECRET_ACCESS_KEY = 'local';
process.env.DYNAMODB_ENDPOINT = 'http://localhost:8000';

// Import Lambda handlers
const authRegister = require('../src/api/auth/register');
const authLogin = require('../src/api/auth/login');
const authMe = require('../src/api/auth/me');
const productsList = require('../src/api/products/list');
const productsGet = require('../src/api/products/get');
const credentialsList = require('../src/api/credentials/list');
const credentialsGet = require('../src/api/credentials/get');
const credentialsUpdate = require('../src/api/credentials/update');

// Helper to convert Lambda event to Express
function lambdaHandler(handler) {
  return async (req, res) => {
    const event = {
      body: JSON.stringify(req.body),
      headers: req.headers,
      pathParameters: req.params,
      queryStringParameters: req.query,
    };

    try {
      const result = await handler.handler(event);
      const body = JSON.parse(result.body);
      res.status(result.statusCode).json(body);
    } catch (error) {
      console.error('Handler error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };
}

// Routes - Auth
app.post('/api/auth/register', lambdaHandler(authRegister));
app.post('/api/auth/login', lambdaHandler(authLogin));
app.get('/api/auth/me', lambdaHandler(authMe));

// Routes - Products
app.get('/api/products', lambdaHandler(productsList));
app.get('/api/products/:sku', lambdaHandler(productsGet));

// Routes - Credentials
app.get('/api/credentials', lambdaHandler(credentialsList));
app.get('/api/credentials/:marketplace', lambdaHandler(credentialsGet));
app.put('/api/credentials/:marketplace', lambdaHandler(credentialsUpdate));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: 'local',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Local API Server running!`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🗄️  PostgreSQL: localhost:5432`);
  console.log(`💾 DynamoDB: http://localhost:8000`);
  console.log(`🎨 DynamoDB Admin: http://localhost:8001`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});