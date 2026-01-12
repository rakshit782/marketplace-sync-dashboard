/**
 * AWS Systems Manager Parameter Store utilities
 */

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

const ssmClient = new SSMClient({ region: process.env.AWS_REGION || 'us-east-1' });
const parameterCache = new Map();

async function getParameter(name, useCache = true) {
  // Check cache first
  if (useCache && parameterCache.has(name)) {
    return parameterCache.get(name);
  }

  try {
    const command = new GetParameterCommand({
      Name: name,
      WithDecryption: true,
    });

    const response = await ssmClient.send(command);
    const value = response.Parameter.Value;

    // Cache the parameter
    if (useCache) {
      parameterCache.set(name, value);
    }

    return value;
  } catch (error) {
    console.error(`Error fetching parameter ${name}:`, error);
    throw error;
  }
}

function clearCache() {
  parameterCache.clear();
}

module.exports = {
  getParameter,
  clearCache,
};