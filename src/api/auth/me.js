/**
 * Get current user info
 */

const { withAuth } = require('../../lib/auth/middleware');

async function handler(event) {
  const { auth } = event;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      success: true,
      user: {
        userId: auth.userId,
        email: auth.email,
        fullName: auth.fullName,
        role: auth.role,
      },
      organization: {
        id: auth.organizationId,
        name: auth.organizationName,
        slug: auth.organizationSlug,
      },
    }),
  };
}

exports.handler = withAuth(handler);