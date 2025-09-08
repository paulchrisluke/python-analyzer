/// <reference types="@cloudflare/workers-types" />
import { createAuth, Env } from "./auth";

// Default allowed origins for fallback
const DEFAULT_ALLOWED_ORIGINS = [
  'https://cranberry-hearing-balance-workers.paulchrisluke.workers.dev',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
];

/**
 * Resolves the allowed origin for CORS based on the request origin and environment configuration
 * @param request - The incoming request
 * @param env - Environment variables
 * @returns The allowed origin if valid, or null if not allowed
 */
function resolveAllowedOrigin(request: Request, env: Env): string | null {
  const requestOrigin = request.headers.get('Origin');
  
  if (!requestOrigin) {
    return null;
  }
  
  // Build allowlist from environment variable or use defaults
  const envOrigins = env.ALLOWED_ORIGINS;
  const allowedOrigins = envOrigins 
    ? envOrigins.split(',').map(origin => origin.trim())
    : DEFAULT_ALLOWED_ORIGINS;
  
  // Check if the request origin is in the allowlist
  return allowedOrigins.includes(requestOrigin) ? requestOrigin : null;
}

const handler = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      const allowedOrigin = resolveAllowedOrigin(request, env);
      
      // Build response headers
      const headers: Record<string, string> = {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
        'Vary': 'Origin, Access-Control-Request-Headers',
        'Access-Control-Max-Age': '600',
      };
      
      // Set allowed origin if valid
      if (allowedOrigin) {
        headers['Access-Control-Allow-Origin'] = allowedOrigin;
      }
      
      // Echo the client's requested headers if present
      const requestedHeaders = request.headers.get('Access-Control-Request-Headers');
      if (requestedHeaders) {
        headers['Access-Control-Allow-Headers'] = requestedHeaders;
      } else {
        // Fallback to default headers if none requested
        headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
      }
      
      return new Response(null, {
        status: 204,
        headers,
      });
    }
    
    // Handle Better Auth API routes
    if (url.pathname.startsWith('/api/auth/')) {
      try {
        const auth = await createAuth(env);
        const response = await auth.handler(request);
        
        // Resolve allowed origin for this request
        const allowedOrigin = resolveAllowedOrigin(request, env);
        
        // Add CORS headers to the response
        const corsHeaders: Record<string, string> = {
          'Access-Control-Allow-Credentials': 'true',
        };
        
        // Only set Access-Control-Allow-Origin if we have a valid origin
        if (allowedOrigin) {
          corsHeaders['Access-Control-Allow-Origin'] = allowedOrigin;
        }
        
        // Clone the response and add CORS headers while preserving duplicate headers
        const headers = new Headers(response.headers);
        
        // Add CORS headers using set/append to preserve duplicates
        Object.entries(corsHeaders).forEach(([key, value]) => {
          // Use append for headers that may have multiple values, set for single-value headers
          if (key.toLowerCase() === 'set-cookie') {
            headers.append(key, value);
          } else {
            headers.set(key, value);
          }
        });
        
        const newResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: headers,
        });
        
        return newResponse;
      } catch (error) {
        const errorId = Math.random().toString(36).substring(2, 15);
        console.error(`Auth handler error [${errorId}]:`, error);
        
        const allowedOrigin = resolveAllowedOrigin(request, env);
        const errorHeaders: Record<string, string> = { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Credentials': 'true',
        };
        
        if (allowedOrigin) {
          errorHeaders['Access-Control-Allow-Origin'] = allowedOrigin;
        }
        
        return new Response(JSON.stringify({ 
          error: 'Internal server error',
          errorId: errorId
        }), {
          status: 500,
          headers: errorHeaders
        });
      }
    }
    
    // For all other routes, return 404 since the Next.js app handles the frontend
    const allowedOrigin = resolveAllowedOrigin(request, env);
    const notFoundHeaders: Record<string, string> = { 
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Credentials': 'true',
    };
    
    if (allowedOrigin) {
      notFoundHeaders['Access-Control-Allow-Origin'] = allowedOrigin;
    }
    
    return new Response('Not Found - This Worker only handles API routes. Use the Next.js app for the frontend.', { 
      status: 404,
      headers: notFoundHeaders
    });
  },
};

export default handler;