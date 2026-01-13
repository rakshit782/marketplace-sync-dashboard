/**
 * Walmart Product Sync Engine
 * Fetches all products from Walmart and stores in DynamoDB
 */

const { getWalmartAccessToken } = require('../lib/auth/walmart');
const { putItem } = require('../lib/aws/dynamodb');
const crypto = require('crypto');

exports.handler = async (event) => {
  console.log('Starting Walmart product sync...');
  
  let totalProcessed = 0;
  let totalFailed = 0;
  const startTime = Date.now();

  try {
    const accessToken = await getWalmartAccessToken();
    
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `https://marketplace.walmartapis.com/v3/items?limit=${limit}&offset=${offset}`,
        {
          headers: {
            'WM_SEC.ACCESS_TOKEN': accessToken,
            'WM_SVC.NAME': 'Walmart Marketplace',
            'WM_QOS.CORRELATION_ID': crypto.randomUUID(),
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Walmart API error: ${response.status}`);
      }

      const data = await response.json();
      const items = data.ItemResponse || [];

      console.log(`Fetched ${items.length} items from Walmart (offset: ${offset})`);

      if (items.length === 0) {
        hasMore = false;
        break;
      }

      // Store items in DynamoDB
      for (const item of items) {
        try {
          const product = {
            pk: `PRODUCT#${item.sku}`,
            sk: 'METADATA',
            marketplace: 'walmart',
            sku: item.sku,
            title: item.productName || '',
            brand: item.brand || '',
            category: item.category || '',
            image_url: item.primaryImageUrl || '',
            price: item.price?.amount || null,
            currency: item.price?.currency || 'USD',
            updated_at: new Date().toISOString(),
            synced_at: new Date().toISOString(),
          };

          await putItem(product);
          totalProcessed++;
        } catch (error) {
          console.error(`Failed to store item ${item.sku}:`, error);
          totalFailed++;
        }
      }

      // Check for next page
      offset += limit;
      hasMore = items.length === limit;

      // Rate limiting - sleep 1 second between pages
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
        message: 'Walmart sync completed',
        stats: {
          processed: totalProcessed,
          failed: totalFailed,
          duration: duration,
        },
      }),
    };
  } catch (error) {
    console.error('Walmart sync error:', error);
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
};