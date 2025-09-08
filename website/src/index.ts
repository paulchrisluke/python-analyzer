/// <reference types="@cloudflare/workers-types" />
import { createAuth, Env } from "./auth";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle Better Auth API routes
    if (url.pathname.startsWith('/api/auth/')) {
      try {
        const auth = createAuth(env);
        return auth.handler(request);
      } catch (error) {
        console.error('Auth handler error:', error);
        return new Response(JSON.stringify({ 
          error: 'Internal server error', 
          details: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // For all other routes, return 404 since the Next.js app handles the frontend
    return new Response('Not Found - This Worker only handles API routes. Use the Next.js app for the frontend.', { 
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  },
};