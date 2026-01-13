# Amazon SP-API Setup Guide

Complete guide to set up Amazon Selling Partner API (SP-API) credentials for marketplace synchronization.

---

## 📋 Required Credentials

You need **5 credentials** from Amazon Seller Central:

1. **LWA Client ID** (Login with Amazon)
2. **LWA Client Secret**
3. **Refresh Token**
4. **Seller ID** (Merchant Token)
5. **Marketplace ID** (based on your selling region)

---

## 🔑 How to Get Credentials

### Step 1: Register as a Developer

1. Go to [Amazon Developer Console](https://developer.amazonservices.com/)
2. Sign in with your Seller Central credentials
3. Click **"Add new app client"** under **LWA (Login with Amazon)**

### Step 2: Create App Client

**App Details:**
- **App Name**: Your Company Marketplace Sync
- **Privacy Policy URL**: https://yourcompany.com/privacy (or use a temporary URL)
- **Allowed Return URLs**: 
  ```
  https://localhost:3001/auth/callback
  http://localhost:3001/auth/callback
  https://your-production-domain.com/auth/callback
  ```

**After creation, you'll get:**
- ✅ **LWA Client ID**: `amzn1.application-oa2-client.abc123def456...`
- ✅ **LWA Client Secret**: `amzn1.oa2-cs.v1.abc123def456...`

### Step 3: Register Your Application

1. Go to [Seller Central](https://sellercentral.amazon.com/)
2. Navigate to: **Settings → User Permissions → Developer Central**
3. Click **"Add new app"**
4. Select **"I am a developer"**
5. Enter:
   - **Developer ID**: (from Step 1)
   - **App Name**: (your app name)
6. Click **"Next"**

### Step 4: Authorize the Application

1. In Developer Central, find your app
2. Click **"Authorize"**
3. Select the roles you need:
   - ✅ **View and manage inventory**
   - ✅ **View and manage orders**
   - ✅ **View and manage product listings**
   - ✅ **View and manage pricing**
4. Click **"Authorize"**

### Step 5: Get Refresh Token

**Option A: Using Authorization URL**

1. Create authorization URL:
   ```
   https://sellercentral.amazon.com/apps/authorize/consent
     ?application_id=YOUR_APP_ID
     &version=beta
   ```

2. Open in browser and authorize

3. You'll be redirected with a code:
   ```
   http://localhost:3001/auth/callback?code=ABC123&state=xyz
   ```

4. Exchange code for refresh token using this curl:
   ```bash
   curl -X POST https://api.amazon.com/auth/o2/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=authorization_code" \
     -d "code=YOUR_CODE_FROM_REDIRECT" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET"
   ```

**Response contains:**
- ✅ **Refresh Token**: `Atzr|IwEBxxxx...` (save this!)
- Access Token (temporary, ignore)

**Option B: Use Self-Authorization (Easier)**

1. Go to [Self Authorization](https://sellercentral.amazon.com/apps/authorize/consent?application_id=YOUR_APP_ID&version=beta)
2. Click "Authorize Now"
3. Copy the **Refresh Token** displayed

### Step 6: Get Seller ID

1. Go to [Seller Central](https://sellercentral.amazon.com/)
2. Navigate to: **Settings → Account Info**
3. Find **"Merchant Token"** or **"Seller ID"**
4. ✅ **Seller ID**: Usually starts with `A` (e.g., `A2EUQ1WTGCTBG2`)

---

## 🌍 Marketplace IDs by Region

### North America

| Country | Marketplace | Marketplace ID | Endpoint |
|---------|-------------|----------------|----------|
| 🇺🇸 **United States** | amazon.com | `ATVPDKIKX0DER` | https://sellingpartnerapi-na.amazon.com |
| 🇨🇦 **Canada** | amazon.ca | `A2EUQ1WTGCTBG2` | https://sellingpartnerapi-na.amazon.com |
| 🇲🇽 **Mexico** | amazon.com.mx | `A1AM78C64UM0Y8` | https://sellingpartnerapi-na.amazon.com |
| 🇧🇷 **Brazil** | amazon.com.br | `A2Q3Y263D00KWC` | https://sellingpartnerapi-na.amazon.com |

### Europe

| Country | Marketplace | Marketplace ID | Endpoint |
|---------|-------------|----------------|----------|
| 🇬🇧 **United Kingdom** | amazon.co.uk | `A1F83G8C2ARO7P` | https://sellingpartnerapi-eu.amazon.com |
| 🇩🇪 **Germany** | amazon.de | `A1PA6795UKMFR9` | https://sellingpartnerapi-eu.amazon.com |
| 🇫🇷 **France** | amazon.fr | `A13V1IB3VIYZZH` | https://sellingpartnerapi-eu.amazon.com |
| 🇮🇹 **Italy** | amazon.it | `APJ6JRA9NG5V4` | https://sellingpartnerapi-eu.amazon.com |
| 🇪🇸 **Spain** | amazon.es | `A1RKKUPIHCS9HS` | https://sellingpartnerapi-eu.amazon.com |
| 🇳🇱 **Netherlands** | amazon.nl | `A1805IZSGTT6HS` | https://sellingpartnerapi-eu.amazon.com |
| 🇸🇪 **Sweden** | amazon.se | `A2NODRKZP88ZB9` | https://sellingpartnerapi-eu.amazon.com |
| 🇵🇱 **Poland** | amazon.pl | `A1C3SOZRARQ6R3` | https://sellingpartnerapi-eu.amazon.com |
| 🇹🇷 **Turkey** | amazon.com.tr | `A33AVAJ2PDY3EV` | https://sellingpartnerapi-eu.amazon.com |
| 🇦🇪 **UAE** | amazon.ae | `A2VIGQ35RCS4UG` | https://sellingpartnerapi-eu.amazon.com |
| 🇮🇳 **India** | amazon.in | `A21TJRUUN4KGV` | https://sellingpartnerapi-eu.amazon.com |

### Far East

| Country | Marketplace | Marketplace ID | Endpoint |
|---------|-------------|----------------|----------|
| 🇯🇵 **Japan** | amazon.co.jp | `A1VC38T7YXB528` | https://sellingpartnerapi-fe.amazon.com |
| 🇦🇺 **Australia** | amazon.com.au | `A39IBJ37TRP1C6` | https://sellingpartnerapi-fe.amazon.com |
| 🇸🇬 **Singapore** | amazon.sg | `A19VAU5U5O7RUS` | https://sellingpartnerapi-fe.amazon.com |

---

## 📝 Complete Credential Example

### For US Marketplace:

```json
{
  "client_id": "amzn1.application-oa2-client.1234567890abcdef",
  "client_secret": "amzn1.oa2-cs.v1.1234567890abcdef1234567890abcdef",
  "refresh_token": "Atzr|IwEBIH1234567890abcdefghijklmnopqrstuvwxyz",
  "seller_id": "A2EUQ1WTGCTBG2",
  "marketplace_id": "ATVPDKIKX0DER",
  "region": "na"
}
```

### For UK Marketplace:

```json
{
  "client_id": "amzn1.application-oa2-client.1234567890abcdef",
  "client_secret": "amzn1.oa2-cs.v1.1234567890abcdef1234567890abcdef",
  "refresh_token": "Atzr|IwEBIH1234567890abcdefghijklmnopqrstuvwxyz",
  "seller_id": "A2EUQ1WTGCTBG2",
  "marketplace_id": "A1F83G8C2ARO7P",
  "region": "eu"
}
```

---

## 🔄 Endpoint Mapping by Region

### Region → Endpoint Mapping:

```javascript
const AMAZON_ENDPOINTS = {
  'na': 'https://sellingpartnerapi-na.amazon.com',  // North America
  'eu': 'https://sellingpartnerapi-eu.amazon.com',  // Europe
  'fe': 'https://sellingpartnerapi-fe.amazon.com',  // Far East
};

const MARKETPLACE_REGIONS = {
  // North America
  'ATVPDKIKX0DER': 'na',  // US
  'A2EUQ1WTGCTBG2': 'na', // Canada
  'A1AM78C64UM0Y8': 'na', // Mexico
  'A2Q3Y263D00KWC': 'na', // Brazil
  
  // Europe
  'A1F83G8C2ARO7P': 'eu', // UK
  'A1PA6795UKMFR9': 'eu', // Germany
  'A13V1IB3VIYZZH': 'eu', // France
  'APJ6JRA9NG5V4': 'eu',  // Italy
  'A1RKKUPIHCS9HS': 'eu', // Spain
  'A1805IZSGTT6HS': 'eu', // Netherlands
  'A2NODRKZP88ZB9': 'eu', // Sweden
  'A1C3SOZRARQ6R3': 'eu', // Poland
  'A33AVAJ2PDY3EV': 'eu', // Turkey
  'A2VIGQ35RCS4UG': 'eu', // UAE
  'A21TJRUUN4KGV': 'eu',  // India
  
  // Far East
  'A1VC38T7YXB528': 'fe', // Japan
  'A39IBJ37TRP1C6': 'fe', // Australia
  'A19VAU5U5O7RUS': 'fe', // Singapore
};
```

---

## ✅ Verification Checklist

### Before Using Your Credentials:

- [ ] **Client ID** starts with `amzn1.application-oa2-client.`
- [ ] **Client Secret** starts with `amzn1.oa2-cs.v1.`
- [ ] **Refresh Token** starts with `Atzr|` or `Atzr%7C`
- [ ] **Seller ID** is 13-14 characters, starts with `A`
- [ ] **Marketplace ID** matches your selling region from tables above
- [ ] **Endpoint** matches your marketplace region (na/eu/fe)

---

## 🧪 Test Your Credentials

### Step 1: Get Access Token

```bash
curl -X POST https://api.amazon.com/auth/o2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=YOUR_REFRESH_TOKEN" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

**Expected Response:**
```json
{
  "access_token": "Atza|IQEBLxxx...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "Atzr|IwEBxxx..."
}
```

### Step 2: Test API Call (Get Orders)

```bash
curl -X GET "https://sellingpartnerapi-na.amazon.com/orders/v0/orders?MarketplaceIds=ATVPDKIKX0DER&CreatedAfter=2024-01-01T00:00:00Z" \
  -H "x-amz-access-token: YOUR_ACCESS_TOKEN" \
  -H "x-amz-date: 20240113T120000Z"
```

---

## 🚨 Common Issues

### Issue 1: "Invalid refresh token"
**Solution**: Refresh token expires if not used within 6 months. Re-authorize your app.

### Issue 2: "Access denied"
**Solution**: Make sure you've authorized the app with correct roles in Seller Central.

### Issue 3: "Invalid marketplace"
**Solution**: Verify marketplace ID matches your selling region.

### Issue 4: "403 Forbidden"
**Solution**: Check if your selling account is active and has permissions for that marketplace.

---

## 📚 Resources

- [Amazon SP-API Documentation](https://developer-docs.amazon.com/sp-api/)
- [SP-API Authorization](https://developer-docs.amazon.com/sp-api/docs/sp-api-authorization)
- [Marketplace IDs Reference](https://developer-docs.amazon.com/sp-api/docs/marketplace-ids)
- [Seller Central](https://sellercentral.amazon.com/)
- [Developer Console](https://developer.amazonservices.com/)

---

## 🔐 Security Best Practices

1. **Never commit credentials** to Git repositories
2. **Store in environment variables** or secure secret managers
3. **Rotate refresh tokens** regularly (every 6 months)
4. **Use HTTPS only** for all API calls
5. **Limit access token lifetime** (default 1 hour)
6. **Monitor API usage** for suspicious activity

---

## 💡 Next Steps

Once you have all credentials:

1. Add them to your dashboard via **Credentials** tab
2. Test connection with **"Test Connection"** button
3. Start syncing products from Amazon
4. Monitor sync logs for any errors

**Happy Selling!** 🚀