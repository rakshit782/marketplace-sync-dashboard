# Multi-Tenant Architecture Guide

## Overview

This system supports **multiple organizations (tenants)** with complete data isolation:

- Each organization has its own API credentials
- Products, listings, and inventory are organization-scoped
- Users can belong to multiple organizations
- Role-based access control (Owner, Admin, Member, Viewer)

## Architecture

```
┌─────────────────────────────────────────┐
│          User Account                   │
│  email@example.com                      │
└───────────┬─────────────────────────────┘
            │
            ├─────────────┬─────────────┐
            │             │             │
    ┌───────▼──────┐ ┌───▼────────┐ ┌──▼─────────┐
    │   Org A      │ │   Org B    │ │   Org C    │
    │   (Owner)    │ │  (Admin)   │ │ (Member)   │
    └───────┬──────┘ └────┬───────┘ └──┬─────────┘
            │             │             │
    ├───────┴────────┬────┴────────┬────┴────────┤
    │ Credentials    │ Products    │ Listings   │
    │ - Amazon       │ - SKU 001   │ - Amazon   │
    │ - Walmart      │ - SKU 002   │ - Walmart  │
    └────────────────┴─────────────┴────────────┘
```

## User Roles

| Role | Permissions |
|------|-------------|
| **Owner** | Full control, manage billing, delete org |
| **Admin** | Manage members, credentials, settings |
| **Member** | View/edit products, sync data |
| **Viewer** | Read-only access |

## Authentication Flow

### 1. Registration

```bash
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "secure-password",
  "fullName": "John Doe",
  "organizationName": "My Company"
}
```

**Response:**
```json
{
  "success": true,
  "user": { "id": 1, "email": "user@example.com" },
  "organization": { "id": 1, "name": "My Company", "slug": "my-company" }
}
```

### 2. Login

```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "secure-password",
  "organizationSlug": "my-company" # Optional
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": { "id": 1, "email": "user@example.com" },
  "organization": { "id": 1, "name": "My Company" },
  "organizations": [...] // All orgs user belongs to
}
```

### 3. Authenticated Requests

Include token in Authorization header:

```bash
GET /api/amazon/products
Authorization: Bearer eyJhbGc...
```

## Database Schema

### Core Tables

1. **organizations** - Tenant data
2. **users** - User accounts
3. **organization_members** - User-Organization mapping
4. **api_credentials** - Per-org marketplace credentials
5. **products** - Per-org products
6. **marketplace_listings** - Per-org listings
7. **sessions** - Authentication sessions

### Setup

```bash
psql $DATABASE_URL < schema/multi-tenant.sql
```

## Credential Management (Multi-Tenant)

### Neon Database (Recommended)

Store credentials per organization:

```sql
-- Organization 1 credentials
INSERT INTO api_credentials (organization_id, marketplace, credentials)
VALUES (
  1,
  'amazon',
  '{
    "clientId": "org1-amazon-client-id",
    "clientSecret": "org1-amazon-secret",
    "refreshToken": "org1-refresh-token",
    "sellerId": "org1-seller-id",
    "marketplaceId": "ATVPDKIKX0DER"
  }'::jsonb
);

-- Organization 2 credentials
INSERT INTO api_credentials (organization_id, marketplace, credentials)
VALUES (
  2,
  'amazon',
  '{
    "clientId": "org2-amazon-client-id",
    "clientSecret": "org2-amazon-secret",
    ...
  }'::jsonb
);
```

### AWS Parameter Store (Alternative)

Use organization-prefixed paths:

```bash
# Organization 1
aws ssm put-parameter --name "/marketplace-sync/org-1/amazon/client-id" --value "xxx" --type "SecureString"

# Organization 2  
aws ssm put-parameter --name "/marketplace-sync/org-2/amazon/client-id" --value "yyy" --type "SecureString"
```

## Frontend Integration

### Login Flow

```typescript
// 1. User logs in
const response = await axios.post('/api/auth/login', {
  email,
  password,
});

const { token, user, organization, organizations } = response.data;

// 2. Store token
localStorage.setItem('token', token);
localStorage.setItem('organizationId', organization.id);

// 3. Use token in requests
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

### Organization Switcher

```typescript
// User can switch between organizations
const switchOrganization = async (orgSlug) => {
  const response = await axios.post('/api/auth/login', {
    email: currentUser.email,
    password: stored_password, // Or use refresh token
    organizationSlug: orgSlug,
  });
  
  // Update token
  localStorage.setItem('token', response.data.token);
};
```

## Data Isolation

All queries are automatically scoped to the authenticated organization:

```javascript
// In Lambda function
const { auth } = event; // Added by withAuth middleware

// Query products for this organization only
const products = await sql`
  SELECT * FROM products
  WHERE organization_id = ${auth.organizationId}
`;

// Get credentials for this organization
const credentials = await getCredentials('amazon', auth.organizationId);
```

## Security Features

✅ **JWT Authentication** - Secure token-based auth  
✅ **Role-Based Access Control** - Granular permissions  
✅ **Data Isolation** - Complete tenant separation  
✅ **Session Management** - Track active sessions  
✅ **Password Hashing** - SHA-256 (use bcrypt in production)  
✅ **Token Expiration** - 24 hour tokens, 30 day refresh  

## Testing Multi-Tenancy

```bash
# 1. Register first organization
curl -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@org1.com",
    "password": "password123",
    "organizationName": "Organization 1"
  }'

# 2. Register second organization
curl -X POST $API_URL/api/auth/register \
  -d '{
    "email": "user2@org2.com",
    "password": "password456",
    "organizationName": "Organization 2"
  }'

# 3. Login to org 1
curl -X POST $API_URL/api/auth/login \
  -d '{"email": "user1@org1.com", "password": "password123"}'

# 4. Use token to access org 1 data
curl $API_URL/api/amazon/products \
  -H "Authorization: Bearer <org1-token>"
```

## Migration from Single-Tenant

1. Run multi-tenant schema
2. Create default organization
3. Migrate existing credentials to organization
4. Update Lambda functions to use `withAuth` middleware
5. Update frontend to include login/auth

## Best Practices

1. ✅ Always use `withAuth` middleware for protected routes
2. ✅ Filter all queries by `organization_id`
3. ✅ Store credentials per organization in Neon DB
4. ✅ Use role checks for sensitive operations
5. ✅ Implement refresh token rotation
6. ✅ Add rate limiting per organization
7. ✅ Enable audit logging for compliance

## Production Checklist

- [ ] Replace JWT secret with strong random key
- [ ] Use bcrypt instead of SHA-256 for passwords
- [ ] Enable HTTPS only
- [ ] Add CORS configuration
- [ ] Implement rate limiting
- [ ] Add email verification
- [ ] Set up password reset flow
- [ ] Enable 2FA (optional)
- [ ] Add audit logs
- [ ] Monitor failed login attempts
- [ ] Implement organization billing
- [ ] Add data export/import
- [ ] Set up backup strategy