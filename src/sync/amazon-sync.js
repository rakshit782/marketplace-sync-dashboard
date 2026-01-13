/**
 * Amazon Product Sync Engine
 * Fetches products from Amazon and stores in DynamoDB (organization-scoped)
 */

const { getCredentials } = require('../lib/config/credentials');
const { getAmazonAccessToken } = require('../lib/auth/amazon');
const { batchPutProducts } = require('../lib/aws/dynamodb');
const { withAuth } = require('../lib/auth/middleware');

async function syncHandler(event) {
  const { organizationId } = event.auth;
  
  console.log(`Starting Amazon product sync for organization ${organizationId}...`);
  
  let totalProcessed = 0;
  let totalFailed = 0;
  const startTime = Date.now();

  try {
    // Get organization-specific credentials
    const credentials = await getCredentials('amazon', organizationId);
    const accessToken = await getAmazonAccessToken(credentials);
    
    let nextToken = null;
    let hasMore = true;

    while (hasMore) {
      const params = new URLSearchParams({
        marketplaceIds: credentials.marketplaceId || 'ATVPDKIKX0DER',
        pageSize: '20',
      });

      if (nextToken) {
        params.append('pageToken', nextToken);
      }

      const response = await fetch(
        `https://sellingpartnerapi-na.amazon.com/catalog/2022-04-01/items?${params}`,
        {
          headers: {
            'x-amz-access-token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Amazon API error: ${response.status}`);
      }

      const data = await response.json();
      const items = data.items || [];

      console.log(`Fetched ${items.length} items from Amazon`);

      // Transform and batch write to DynamoDB
      const products = items.map(item => ({
        sku: item.identifiers?.marketplaceSkus?.[0] || item.asin,
        marketplace: 'amazon',
        asin: item.asin,
        title: item.summaries?.[0]?.itemName || '',
        brand: item.summaries?.[0]?.brand || '',
        category: item.summaries?.[0]?.productType || '',
        image_url: item.images?.[0]?.images?.[0]?.link || '',
        synced_at: new Date().toISOString(),
      }));

      try {
        await batchPutProducts(products, organizationId);
        totalProcessed += products.length;
      } catch (error) {
        console.error('Failed to store batch:', error);
        totalFailed += products.length;
      }

      // Check for next page
      nextToken = data.pagination?.nextToken;
      hasMore = !!nextToken && items.length > 0;

      // Rate limiting
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const duration = Date.now() - startTime;
    console.log(`Sync completed: ${totalProcessed} processed, ${totalFailed} failed, ${duration}ms`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Amazon sync completed',
        stats: {
          processed: totalProcessed,
          failed: totalFailed,
          duration: duration,
        },
      }),
    };
  } catch (error) {
    console.error('Amazon sync error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stats: {
          processed: totalProcessed,
          failed: totalFailed,
        },
      }),
    };
  }
}

// Wrap with auth middleware
exports.handler = withAuth(syncHandler, 'member');