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
        const errorId = Math.random().toString(36).substring(2, 15);
        console.error(`Auth handler error [${errorId}]:`, error);
        return new Response(JSON.stringify({ 
          error: 'Internal server error',
          errorId: errorId
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