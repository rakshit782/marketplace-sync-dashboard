const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: process.env.CRED_DATABASE_URL?.includes('localhost') ? 'localhost' : 'cloud'
  });
});

// Auth routes
const registerHandler = require('../src/api/auth/register');
const loginHandler = require('../src/api/auth/login');
const resetPasswordHandler = require('../src/api/auth/reset-password');
const updatePasswordHandler = require('../src/api/auth/update-password');

app.post('/api/auth/register', async (req, res) => {
  try {
    const result = await registerHandler.handler({
      httpMethod: 'POST',
      body: JSON.stringify(req.body)
    });
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const result = await loginHandler.handler({
      httpMethod: 'POST',
      body: JSON.stringify(req.body)
    });
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const result = await resetPasswordHandler.handler({
      httpMethod: 'POST',
      body: JSON.stringify(req.body)
    });
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/update-password', async (req, res) => {
  try {
    const result = await updatePasswordHandler.handler({
      httpMethod: 'POST',
      body: JSON.stringify(req.body)
    });
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Credentials routes
const credentialsListHandler = require('../src/api/credentials/list');
const credentialsSaveHandler = require('../src/api/credentials/save');

app.get('/api/credentials', async (req, res) => {
  try {
    const result = await credentialsListHandler.handler({
      httpMethod: 'GET',
      headers: req.headers,
      auth: req.auth // Added by auth middleware if exists
    });
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    console.error('Credentials list error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/credentials/:marketplace', async (req, res) => {
  try {
    const result = await credentialsSaveHandler.handler({
      httpMethod: 'PUT',
      headers: req.headers,
      pathParameters: { marketplace: req.params.marketplace },
      body: JSON.stringify({ marketplace: req.params.marketplace, credentials: req.body.credentials })
    });
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    console.error('Credentials save error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Products routes
const productsListHandler = require('../src/api/products/list');

app.get('/api/products', async (req, res) => {
  try {
    const result = await productsListHandler.handler({
      httpMethod: 'GET',
      headers: req.headers,
      queryStringParameters: req.query
    });
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 Local API Server running!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🗄️  PostgreSQL: ${process.env.CRED_DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Not configured'}`);
  console.log(`💾 DynamoDB: http://localhost:8000`);
  console.log(`🎨 DynamoDB Admin: http://localhost:8001`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});