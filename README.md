# Marketplace Sync Dashboard

Centralized dashboard to manage Amazon Seller Central and Walmart Seller Center listings, pricing, and inventory.

## Features

- ✅ Fetch products from Amazon SP-API and Walmart Marketplace API
- ✅ Unified dashboard to view all listings
- ✅ Bulk update content, pricing, and inventory
- ✅ Real-time synchronization
- ✅ Automated sync jobs
- ✅ Price and inventory history tracking

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Next.js API Routes (Serverless)
- **Database**: Neon PostgreSQL
- **Authentication**: NextAuth
- **APIs**: Amazon SP-API, Walmart Marketplace API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- Amazon Seller Central account with SP-API access
- Walmart Seller account with API credentials
- Neon PostgreSQL database

### Installation

```bash
# Clone the repository
git clone https://github.com/rakshit782/marketplace-sync-dashboard.git
cd marketplace-sync-dashboard

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── amazon/        # Amazon SP-API endpoints
│   │   ├── walmart/       # Walmart API endpoints
│   │   └── sync/          # Sync jobs
│   ├── dashboard/         # Dashboard pages
│   └── layout.tsx
├── lib/                   # Utility functions
│   ├── amazon/           # Amazon SP-API client
│   ├── walmart/          # Walmart API client
│   ├── db/              # Database utilities
│   └── sync/            # Sync engine
├── components/           # React components
├── schema/              # Database schema
└── types/               # TypeScript types
```

## API Integration

### Amazon SP-API Setup

1. Register as SP-API developer in Seller Central
2. Create app and obtain credentials
3. Generate refresh token via OAuth flow
4. Add credentials to `.env`

### Walmart API Setup

1. Register as Walmart Marketplace seller
2. Access Developer Portal from Seller Center
3. Create application and get API keys
4. Add credentials to `.env`

## Database Schema

See `schema/init.sql` for complete schema including:
- `products` - Unified product data
- `marketplace_listings` - Platform-specific listings
- `inventory_levels` - Real-time stock tracking
- `price_history` - Pricing change history
- `sync_logs` - Sync audit trail

## Deployment

Deploy to Vercel:

```bash
vercel
```

Set environment variables in Vercel dashboard.

## License

MIT