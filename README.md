# Marketplace Sync Dashboard

Centralized dashboard to manage Amazon Seller Central and Walmart Seller Center listings, pricing, and inventory.

![Architecture](https://img.shields.io/badge/AWS-Free%20Tier-orange) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![React](https://img.shields.io/badge/React-18-blue)

## ✨ Features

- 🔄 **Automated Sync**: Scheduled jobs sync products from Amazon & Walmart
- 📊 **Unified Dashboard**: View all products in one place
- 🛠️ **Bulk Operations**: Update pricing, inventory, and content across marketplaces
- 🏗️ **Modular Architecture**: Each API endpoint = separate Lambda function
- 💰 **Cost-Effective**: Runs on AWS Free Tier ($0-5/month)
- 🚀 **Production-Ready**: Complete CI/CD with GitHub Actions

## 🏗️ Architecture

```
src/api/{marketplace}/{function}/
  ├── amazon/
  │   ├── products/  → fetch, get, update
  │   ├── inventory/ → get
  │   └── pricing/   → get
  └── walmart/
      ├── products/  → fetch, get, update
      ├── inventory/ → get, update
      └── pricing/   → update
```

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for complete details.

## 🚀 Quick Start

### Prerequisites

- AWS Account with CLI configured
- Node.js 18+
- Amazon Seller Central API credentials
- Walmart Marketplace API credentials

### Deploy in 3 Commands

```bash
# 1. Clone and deploy
git clone https://github.com/rakshit782/marketplace-sync-dashboard.git
cd marketplace-sync-dashboard
chmod +x scripts/*.sh
./scripts/deploy.sh

# 2. Set up credentials
./scripts/setup-credentials.sh

# 3. Access your dashboard!
# URL will be shown in deployment output
```

## 📚 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Architecture details
- **[API Documentation](#api-endpoints)** - Below

## 🔌 API Endpoints

Base URL: `https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod`

### Amazon SP-API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/amazon/products` | POST | Fetch all products |
| `/api/amazon/products/{sku}` | GET | Get single product |
| `/api/amazon/products/{sku}` | PATCH | Update product |
| `/api/amazon/inventory` | GET | Get FBA inventory |
| `/api/amazon/pricing` | GET | Get pricing |

### Walmart Marketplace API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/walmart/products` | GET | Fetch all items |
| `/api/walmart/products/{sku}` | GET | Get single item |
| `/api/walmart/products/{sku}` | PUT | Update item |
| `/api/walmart/inventory` | GET | Get inventory |
| `/api/walmart/inventory` | PUT | Update inventory |
| `/api/walmart/pricing` | PUT | Update pricing |

## 🔧 Utility Scripts

```bash
# Deploy infrastructure and frontend
./scripts/deploy.sh

# Set up API credentials interactively
./scripts/setup-credentials.sh

# Test API endpoints
./scripts/test-api.sh <API_URL>

# Manually trigger sync
./scripts/trigger-sync.sh [amazon|walmart|both]

# Enable scheduled sync jobs
./scripts/enable-sync.sh
```

## 🔄 Automated Sync

Sync engines automatically fetch products and store in DynamoDB:

- **Amazon**: Every 1 hour (disabled by default)
- **Walmart**: Every 2 hours (disabled by default)

Enable with:
```bash
./scripts/enable-sync.sh
```

## 💰 Cost Breakdown (AWS Free Tier)

| Service | Free Tier | After Free Tier |
|---------|-----------|----------------|
| Lambda | 1M requests/month | $0.20/million |
| DynamoDB | 25GB storage | Always free |
| API Gateway | 1M calls/month (12 mo) | $3.50/million |
| S3 | 5GB storage | $0.023/GB |
| CloudFront | 50GB transfer (12 mo) | $0.085/GB |

**Estimated monthly cost**: $0-5

## 🔐 Security

- ✅ API credentials encrypted in AWS Parameter Store
- ✅ Lambda functions with minimal IAM permissions
- ✅ API Gateway throttling enabled
- ✅ HTTPS only (CloudFront + API Gateway)

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- Amazon Selling Partner API
- Walmart Marketplace API
- AWS CDK
- React + Vite + TailwindCSS

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for troubleshooting

---

**Built with ❤️ for multi-marketplace sellers**