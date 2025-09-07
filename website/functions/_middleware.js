export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  
  // Only protect the docs.html page and any files in the docs/ directory
  if (url.pathname === '/docs.html' || url.pathname.startsWith('/docs/')) {
    const auth = request.headers.get('Authorization');

    if (!auth) {
      return new Response('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Due Diligence Documents"'
        }
      });
    }

    const [scheme, encoded] = auth.split(' ');

    if (!encoded || scheme !== 'Basic') {
      return new Response('Invalid authentication', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Due Diligence Documents"'
        }
      });
    }

    const decoded = atob(encoded);
    const [username, password] = decoded.split(':');

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


