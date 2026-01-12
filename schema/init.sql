-- Database schema for marketplace sync dashboard

-- Products table (unified product data)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(1000) NOT NULL,
    description TEXT,
    brand VARCHAR(255),
    category VARCHAR(255),
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace listings (platform-specific data)
CREATE TABLE IF NOT EXISTS marketplace_listings (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    marketplace VARCHAR(50) NOT NULL, -- 'amazon' or 'walmart'
    marketplace_sku VARCHAR(255) NOT NULL,
    asin VARCHAR(50), -- Amazon specific
    listing_id VARCHAR(255), -- Walmart specific
    title VARCHAR(1000),
    description TEXT,
    bullet_points TEXT[], -- Array of bullet points
    status VARCHAR(50), -- 'active', 'inactive', 'incomplete'
    listing_url TEXT,
    last_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(marketplace, marketplace_sku)
);

-- Inventory levels
CREATE TABLE IF NOT EXISTS inventory_levels (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    fulfillment_type VARCHAR(50), -- 'FBA', 'FBM', 'WFS', etc.
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Price history
CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    sale_price DECIMAL(10, 2),
    effective_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Current prices view
CREATE TABLE IF NOT EXISTS current_prices (
    listing_id INTEGER PRIMARY KEY REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    sale_price DECIMAL(10, 2),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sync logs
CREATE TABLE IF NOT EXISTS sync_logs (
    id SERIAL PRIMARY KEY,
    marketplace VARCHAR(50) NOT NULL,
    sync_type VARCHAR(50) NOT NULL, -- 'products', 'inventory', 'prices'
    status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'partial'
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- API credentials (encrypted)
CREATE TABLE IF NOT EXISTS api_credentials (
    id SERIAL PRIMARY KEY,
    marketplace VARCHAR(50) UNIQUE NOT NULL,
    credentials JSONB NOT NULL, -- Encrypted credentials
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_listings_marketplace ON marketplace_listings(marketplace);
CREATE INDEX idx_listings_status ON marketplace_listings(status);
CREATE INDEX idx_listings_product_id ON marketplace_listings(product_id);
CREATE INDEX idx_inventory_listing_id ON inventory_levels(listing_id);
CREATE INDEX idx_price_history_listing_id ON price_history(listing_id);
CREATE INDEX idx_sync_logs_marketplace ON sync_logs(marketplace);
CREATE INDEX idx_sync_logs_created ON sync_logs(started_at DESC);