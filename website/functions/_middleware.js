export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  
  // Only protect the docs.html page, the bare /docs path, and any files in the docs/ directory
  if (url.pathname === '/docs.html' || url.pathname === '/docs' || url.pathname.startsWith('/docs/')) {
    const auth = request.headers.get('Authorization');

    if (!auth) {
      return new Response('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Due Diligence Documents"'
        }
      });
    }

    const authParts = auth.split(' ');
    if (authParts.length !== 2) {
      return new Response('Invalid authentication', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Due Diligence Documents"'
        }
      });
    }

    const [scheme, encoded] = authParts;

    if (!encoded || scheme.toLowerCase() !== 'basic') {
      return new Response('Invalid authentication', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Due Diligence Documents"'
        }
      });
    }

    let decoded;
    try {
      decoded = atob(encoded);
    } catch (e) {
      return new Response('Invalid authentication', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Due Diligence Documents"'
        }
      });
    }

    const colonIndex = decoded.indexOf(':');
    if (colonIndex === -1) {
      return new Response('Invalid authentication', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Due Diligence Documents"'
        }
      });
    }

    const username = decoded.substring(0, colonIndex);
    const password = decoded.substring(colonIndex + 1);

    // Get credentials from environment variables
    const VALID_USERNAME = context.env.AUTH_USERNAME;
    const VALID_PASSWORD = context.env.AUTH_PASSWORD;

    if (username !== VALID_USERNAME || password !== VALID_PASSWORD) {
      return new Response('Invalid credentials', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Due Diligence Documents"'
        }
      });
    }
  }

  // Allow access to all other pages (including index.html)
  return next();
}


