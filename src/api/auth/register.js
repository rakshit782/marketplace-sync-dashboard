/**
 * User registration endpoint
 */

const { neon } = require('@neondatabase/serverless');
const { hashPassword } = require('../../lib/auth/jwt');

const sql = neon(process.env.DATABASE_URL);

exports.handler = async (event) => {
  try {
    const { email, password, fullName, organizationName } = JSON.parse(event.body || '{}');

    // Validation
    if (!email || !password || !organizationName) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          success: false,
          error: 'Email, password, and organization name are required',
        }),
      };
    }

    // Check if user exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          success: false,
          error: 'Email already registered',
        }),
      };
    }

    // Create organization slug
    const slug = organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Begin transaction
    const passwordHash = hashPassword(password);

    // Create user
    const [user] = await sql`
      INSERT INTO users (email, password_hash, full_name)
      VALUES (${email}, ${passwordHash}, ${fullName || email})
      RETURNING id, email, full_name
    `;

    // Create organization
    const [organization] = await sql`
      INSERT INTO organizations (name, slug)
      VALUES (${organizationName}, ${slug})
      RETURNING id, name, slug
    `;

    // Add user as owner
    await sql`
      INSERT INTO organization_members (organization_id, user_id, role)
      VALUES (${organization.id}, ${user.id}, 'owner')
    `;

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
        },
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
      }),
    };
  } catch (error) {
    console.error('Registration error:', error);
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