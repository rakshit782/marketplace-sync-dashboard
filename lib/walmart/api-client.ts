import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

interface WalmartCredentials {
  clientId: string;
  clientSecret: string;
  channelType?: string;
}

interface AccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export class WalmartAPIClient {
  private credentials: WalmartCredentials;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private client: AxiosInstance;

  constructor(credentials: WalmartCredentials) {
    this.credentials = credentials;
    this.client = axios.create({
      baseURL: 'https://marketplace.walmartapis.com/v3',
      headers: {
        'WM_SVC.NAME': 'Walmart Marketplace',
        'WM_QOS.CORRELATION_ID': crypto.randomUUID(),
        'Content-Type': 'application/json',
      },
    });
  }

  private async getAccessToken(): Promise<string> {
    // Check if current token is still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Request new access token
    try {
      const auth = Buffer.from(
        `${this.credentials.clientId}:${this.credentials.clientSecret}`
      ).toString('base64');

      const response = await axios.post<AccessTokenResponse>(
        'https://marketplace.walmartapis.com/v3/token',
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'WM_SVC.NAME': 'Walmart Marketplace',
            'WM_QOS.CORRELATION_ID': crypto.randomUUID(),
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
      return this.accessToken;
    } catch (error) {
      throw new Error(`Failed to get Walmart access token: ${error}`);
    }
  }

  async getItems(params?: { limit?: number; offset?: number }) {
    const token = await this.getAccessToken();

    const response = await this.client.get('/items', {
      params: {
        limit: params?.limit || 50,
        offset: params?.offset || 0,
      },
      headers: {
        'WM_SEC.ACCESS_TOKEN': token,
        'WM_QOS.CORRELATION_ID': crypto.randomUUID(),
      },
    });

    return response.data;
  }

  async getItem(sku: string) {
    const token = await this.getAccessToken();

    const response = await this.client.get(`/items/${sku}`, {
      headers: {
        'WM_SEC.ACCESS_TOKEN': token,
        'WM_QOS.CORRELATION_ID': crypto.randomUUID(),
      },
    });

    return response.data;
  }

  async updateItem(sku: string, payload: any) {
    const token = await this.getAccessToken();

    const response = await this.client.put(`/items/${sku}`, payload, {
      headers: {
        'WM_SEC.ACCESS_TOKEN': token,
        'WM_QOS.CORRELATION_ID': crypto.randomUUID(),
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  }

  async getInventory(sku: string) {
    const token = await this.getAccessToken();

    const response = await this.client.get(`/inventory`, {
      params: { sku },
      headers: {
        'WM_SEC.ACCESS_TOKEN': token,
        'WM_QOS.CORRELATION_ID': crypto.randomUUID(),
      },
    });

    return response.data;
  }

  async updateInventory(sku: string, quantity: number) {
    const token = await this.getAccessToken();

    const response = await this.client.put(
      `/inventory`,
      {
        sku,
        quantity: {
          unit: 'EACH',
          amount: quantity,
        },
      },
      {
        params: { sku },
        headers: {
          'WM_SEC.ACCESS_TOKEN': token,
          'WM_QOS.CORRELATION_ID': crypto.randomUUID(),
        },
      }
    );

    return response.data;
  }

  async updatePrice(sku: string, price: number, currency: string = 'USD') {
    const token = await this.getAccessToken();

    const response = await this.client.put(
      `/prices`,
      {
        sku,
        pricing: [
          {
            currentPrice: {
              currency,
              amount: price,
            },
          },
        ],
      },
      {
        headers: {
          'WM_SEC.ACCESS_TOKEN': token,
          'WM_QOS.CORRELATION_ID': crypto.randomUUID(),
        },
      }
    );

    return response.data;
  }
}

export default WalmartAPIClient;