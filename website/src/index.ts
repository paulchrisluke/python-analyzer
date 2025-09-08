/// <reference types="@cloudflare/workers-types" />
import { createAuth, Env } from "./auth";

// Centralized allowed origin configuration
const ALLOWED_ORIGIN = 'https://cranberry-hearing-balance-workers.paulchrisluke.workers.dev';

const handler = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    }
    
    // Handle Better Auth API routes
    if (url.pathname.startsWith('/api/auth/')) {
      try {
        const auth = createAuth(env);
        const response = await auth.handler(request);
        
        // Add CORS headers to the response
        const corsHeaders = {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Credentials': 'true',
        };
        
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
        return new Response(JSON.stringify({ 
          error: 'Internal server error',
          errorId: errorId
        }), {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
            'Access-Control-Allow-Credentials': 'true',
          }
        });
      }
    }
    
    // For all other routes, return 404 since the Next.js app handles the frontend
    return new Response('Not Found - This Worker only handles API routes. Use the Next.js app for the frontend.', { 
      status: 404,
      headers: { 
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Credentials': 'true',
      }
    });
  },
};

export default handler;