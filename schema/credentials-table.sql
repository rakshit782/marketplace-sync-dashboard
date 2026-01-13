-- Credentials table for Neon database
-- Store marketplace API credentials as an alternative to AWS Parameter Store

CREATE TABLE IF NOT EXISTS api_credentials (
    id SERIAL PRIMARY KEY,
    marketplace VARCHAR(50) UNIQUE NOT NULL, -- 'amazon' or 'walmart'
    credentials JSONB NOT NULL, -- Encrypted credentials JSON
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    notes TEXT
);

-- Index for faster lookups
CREATE INDEX idx_credentials_marketplace ON api_credentials(marketplace) WHERE is_active = true;

-- Example data structure for credentials JSONB:
-- Amazon:
-- {
--   "clientId": "amzn1.application-oa2-client.....",
--   "clientSecret": "amzn1.oa2-cs.v1.....",
--   "refreshToken": "Atzr|Iw.....",
--   "sellerId": "A1XXXXX",
--   "marketplaceId": "ATVPDKIKX0DER"
-- }

-- Walmart:
-- {
--   "clientId": "your-walmart-client-id",
--   "clientSecret": "your-walmart-client-secret"
-- }

-- Insert example (replace with your actual credentials)
-- Amazon
INSERT INTO api_credentials (marketplace, credentials, is_active, created_by, notes)
VALUES (
    'amazon',
    '{
        "clientId": "your-amazon-client-id",
        "clientSecret": "your-amazon-client-secret",
        "refreshToken": "your-refresh-token",
        "sellerId": "your-seller-id",
        "marketplaceId": "ATVPDKIKX0DER"
    }'::jsonb,
    true,
    'admin',
    'Amazon Seller Central API credentials'
) ON CONFLICT (marketplace) DO UPDATE
SET 
    credentials = EXCLUDED.credentials,
    updated_at = CURRENT_TIMESTAMP;

-- Walmart
INSERT INTO api_credentials (marketplace, credentials, is_active, created_by, notes)
VALUES (
    'walmart',
    '{
        "clientId": "your-walmart-client-id",
        "clientSecret": "your-walmart-client-secret"
    }'::jsonb,
    true,
    'admin',
    'Walmart Marketplace API credentials'
) ON CONFLICT (marketplace) DO UPDATE
SET 
    credentials = EXCLUDED.credentials,
    updated_at = CURRENT_TIMESTAMP;

-- Function to update credentials
CREATE OR REPLACE FUNCTION update_credential(
    p_marketplace VARCHAR(50),
    p_credentials JSONB,
    p_created_by VARCHAR(255) DEFAULT 'system'
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
BEGIN
    INSERT INTO api_credentials (marketplace, credentials, is_active, created_by)
    VALUES (p_marketplace, p_credentials, true, p_created_by)
    ON CONFLICT (marketplace) DO UPDATE
    SET 
        credentials = EXCLUDED.credentials,
        updated_at = CURRENT_TIMESTAMP,
        is_active = true;
    
    RETURN QUERY SELECT true, 'Credentials updated successfully';
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, SQLERRM;
END;
$$ LANGUAGE plpgsql;