import axios, { AxiosInstance } from 'axios';

interface AmazonCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  region: string;
  marketplaceId: string;
}

interface AccessTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export class AmazonSPAPIClient {
  private credentials: AmazonCredentials;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private client: AxiosInstance;

  constructor(credentials: AmazonCredentials) {
    this.credentials = credentials;
    this.client = axios.create({
      baseURL: this.getBaseURL(),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MarketplaceSync/1.0',
      },
    });
  }

  private getBaseURL(): string {
    const regionMap: { [key: string]: string } = {
      'us-east-1': 'https://sellingpartnerapi-na.amazon.com',
      'eu-west-1': 'https://sellingpartnerapi-eu.amazon.com',
      'us-west-2': 'https://sellingpartnerapi-fe.amazon.com',
    };
    return regionMap[this.credentials.region] || regionMap['us-east-1'];
  }

  private async getAccessToken(): Promise<string> {
    // Check if current token is still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Request new access token
    try {
      const response = await axios.post<AccessTokenResponse>(
        'https://api.amazon.com/auth/o2/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.credentials.refreshToken,
          client_id: this.credentials.clientId,
          client_secret: this.credentials.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000; // Refresh 1 min early
      return this.accessToken;
    } catch (error) {
      throw new Error(`Failed to get Amazon access token: ${error}`);
    }
  }

  async getCatalogItems(params?: { keywords?: string; marketplaceIds?: string[] }) {
    const token = await this.getAccessToken();
    const marketplaceIds = params?.marketplaceIds || [this.credentials.marketplaceId];

    const response = await this.client.get('/catalog/2022-04-01/items', {
      params: {
        marketplaceIds: marketplaceIds.join(','),
        keywords: params?.keywords,
      },
      headers: {
        'x-amz-access-token': token,
      },
    });

    return response.data;
  }

  async getListingsItem(sellerId: string, sku: string) {
    const token = await this.getAccessToken();

    const response = await this.client.get(
      `/listings/2021-08-01/items/${sellerId}/${sku}`,
      {
        params: {
          marketplaceIds: this.credentials.marketplaceId,
        },
        headers: {
          'x-amz-access-token': token,
        },
      }
    );

    return response.data;
  }

  async updateListingItem(sellerId: string, sku: string, payload: any) {
    const token = await this.getAccessToken();

    const response = await this.client.patch(
      `/listings/2021-08-01/items/${sellerId}/${sku}`,
      payload,
      {
        params: {
          marketplaceIds: this.credentials.marketplaceId,
        },
        headers: {
          'x-amz-access-token': token,
        },
      }
    );

    return response.data;
  }

  async getFBAInventory(sellerId: string) {
    const token = await this.getAccessToken();

    const response = await this.client.get('/fba/inventory/v1/summaries', {
      params: {
        marketplaceIds: this.credentials.marketplaceId,
      },
      headers: {
        'x-amz-access-token': token,
      },
    });

    return response.data;
  }

  async getProductPricing(skus: string[]) {
    const token = await this.getAccessToken();

    const response = await this.client.get('/products/pricing/v0/price', {
      params: {
        MarketplaceId: this.credentials.marketplaceId,
        Skus: skus.join(','),
        ItemType: 'Sku',
      },
      headers: {
        'x-amz-access-token': token,
      },
    });

    return response.data;
  }
}

export default AmazonSPAPIClient;