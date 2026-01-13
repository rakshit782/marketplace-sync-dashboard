/**
 * User login endpoint
 * Uses Neon database (CRED_DATABASE_URL)
 */

const { neon } = require('@neondatabase/serverless');
const { verifyPassword, createToken, generateRefreshToken, TOKEN_EXPIRY } = require('../../lib/auth/jwt');

function getCredDb() {
  const credDatabaseUrl = process.env.CRED_DATABASE_URL;
  if (!credDatabaseUrl) {
    throw new Error('CRED_DATABASE_URL is not set');
  }
  return neon(credDatabaseUrl);
}

exports.handler = async (event) => {
  try {
    const { email, password, organizationSlug } = JSON.parse(event.body || '{}');

    if (!email || !password) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          success: false,
          error: 'Email and password are required',
        }),
      };
    }

    const sql = getCredDb();

    // Get user
    const [user] = await sql`
      SELECT id, email, password_hash, full_name, is_active
      FROM users
      WHERE email = ${email}
    `;

    if (!user || !user.is_active) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          success: false,
          error: 'Invalid credentials',
        }),
      };
    }

    // Verify password
    if (!verifyPassword(password, user.password_hash)) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          success: false,
          error: 'Invalid credentials',
        }),
      };
    }

    // Get user's organizations
    const organizations = await sql`
      SELECT 
        o.id,
        o.name,
        o.slug,
        om.role
      FROM organizations o
      INNER JOIN organization_members om ON o.id = om.organization_id
      WHERE om.user_id = ${user.id}
      AND o.is_active = true
      AND om.is_active = true
      ORDER BY om.joined_at DESC
    `;

    if (organizations.length === 0) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          success: false,
          error: 'No active organizations found',
        }),
      };
    }

    // Select organization
    let selectedOrg = organizations[0];
    if (organizationSlug) {
      const org = organizations.find(o => o.slug === organizationSlug);
      if (org) selectedOrg = org;
    }

    // Create session
    const token = createToken({
      userId: user.id,
      organizationId: selectedOrg.id,
    });

    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY);

    await sql`
      INSERT INTO sessions (user_id, organization_id, token, refresh_token, expires_at)
      VALUES (${user.id}, ${selectedOrg.id}, ${token}, ${refreshToken}, ${expiresAt})
    `;

    // Update last login
    await sql`
      UPDATE users SET last_login = NOW() WHERE id = ${user.id}
    `;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
        },
        organization: selectedOrg,
        organizations,
      }),
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};