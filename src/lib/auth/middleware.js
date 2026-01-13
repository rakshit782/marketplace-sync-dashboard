/**
 * Authentication middleware for Lambda functions
 * Uses Neon database (CRED_DATABASE_URL) for auth
 */

const { verifyToken } = require('./jwt');
const { neon } = require('@neondatabase/serverless');

/**
 * Get Neon connection for credentials database
 */
function getCredDb() {
  const credDatabaseUrl = process.env.CRED_DATABASE_URL;
  
  if (!credDatabaseUrl) {
    throw new Error('CRED_DATABASE_URL is not set');
  }

  return neon(credDatabaseUrl);
}

/**
 * Extract token from Authorization header
 */
function extractToken(event) {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Authenticate request and return user/org context
 */
async function authenticate(event) {
  const token = extractToken(event);

  if (!token) {
    throw new Error('No authentication token provided');
  }

  const payload = verifyToken(token);

  if (!payload) {
    throw new Error('Invalid or expired token');
  }

  const sql = getCredDb();

  // Verify session in database
  const session = await sql`
    SELECT 
      s.id,
      s.user_id,
      s.organization_id,
      u.email,
      u.full_name,
      o.name as org_name,
      o.slug as org_slug,
      om.role
    FROM sessions s
    INNER JOIN users u ON s.user_id = u.id
    INNER JOIN organizations o ON s.organization_id = o.id
    INNER JOIN organization_members om ON om.user_id = u.id AND om.organization_id = o.id
    WHERE s.token = ${token}
    AND s.expires_at > NOW()
    AND u.is_active = true
    AND o.is_active = true
    AND om.is_active = true
    LIMIT 1
  `;

  if (!session || session.length === 0) {
    throw new Error('Invalid session');
  }

  const context = session[0];

  // Update last activity
  await sql`
    UPDATE sessions 
    SET last_activity = NOW() 
    WHERE token = ${token}
  `;

  return {
    userId: context.user_id,
    email: context.email,
    fullName: context.full_name,
    organizationId: context.organization_id,
    organizationName: context.org_name,
    organizationSlug: context.org_slug,
    role: context.role,
  };
}

/**
 * Check if user has required role
 */
function hasRole(userRole, requiredRole) {
  const roleHierarchy = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Middleware wrapper for Lambda handlers
 */
function withAuth(handler, requiredRole = 'member') {
  return async (event) => {
    try {
      const context = await authenticate(event);

      if (!hasRole(context.role, requiredRole)) {
        return {
          statusCode: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            success: false,
            error: `Insufficient permissions. Required: ${requiredRole}`,
          }),
        };
      }

      // Add context to event
      event.auth = context;

      return await handler(event);
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: error.message || 'Authentication failed',
        }),
      };
    }
  };
}

module.exports = {
  authenticate,
  hasRole,
  withAuth,
  extractToken,
  getCredDb,
};