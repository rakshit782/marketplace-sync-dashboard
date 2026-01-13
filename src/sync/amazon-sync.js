/**
 * Amazon Product Sync Engine
 * Fetches all products from Amazon and stores in DynamoDB
 */

const { getAmazonAccessToken } = require('../lib/auth/amazon');
const { getParameter } = require('../lib/aws/ssm');
const { putItem } = require('../lib/aws/dynamodb');

exports.handler = async (event) => {
  console.log('Starting Amazon product sync...');
  
  let totalProcessed = 0;
  let totalFailed = 0;
  const startTime = Date.now();

  try {
    const accessToken = await getAmazonAccessToken();
    const marketplaceId = await getParameter('/marketplace-sync/amazon/marketplace-id');
    
    let nextToken = null;
    let hasMore = true;

    while (hasMore) {
      const params = new URLSearchParams({
        marketplaceIds: marketplaceId,
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

      // Store items in DynamoDB
      for (const item of items) {
        try {
          const product = {
            pk: `PRODUCT#${item.asin || item.identifiers?.marketplaceSkus?.[0]}`,
            sk: 'METADATA',
            marketplace: 'amazon',
            asin: item.asin,
            sku: item.identifiers?.marketplaceSkus?.[0] || item.asin,
            title: item.summaries?.[0]?.itemName || '',
            brand: item.summaries?.[0]?.brand || '',
            category: item.summaries?.[0]?.productType || '',
            image_url: item.images?.[0]?.images?.[0]?.link || '',
            updated_at: new Date().toISOString(),
            synced_at: new Date().toISOString(),
          };

          await putItem(product);
          totalProcessed++;
        } catch (error) {
          console.error(`Failed to store item ${item.asin}:`, error);
          totalFailed++;
        }
      }

      // Check for next page
      nextToken = data.pagination?.nextToken;
      hasMore = !!nextToken && items.length > 0;

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
};