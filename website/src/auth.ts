// Cloudflare Workers types - minimal definition for build compatibility
declare global {
  interface D1Database {
    prepare(query: string): any;
    exec(query: string): Promise<any>;
    batch(statements: any[]): Promise<any[]>;
  }
}

export interface Env {
  cranberry_auth_db: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  COOKIE_DOMAIN?: string;
  NODE_ENV?: string;
  ALLOWED_ORIGINS?: string;
  ADMIN_EMAILS?: string;
  TEST_USER_EMAIL?: string;
  TEST_USER_PASSWORD?: string;
  TEST_ADMIN_EMAIL?: string;
  TEST_ADMIN_PASSWORD?: string;
  NEXT_PUBLIC_APP_URL?: string;
  NEXT_PUBLIC_BETTER_AUTH_URL?: string;
}

export async function createAuth(env: Env) {
  console.log(`[${new Date().toISOString()}] Starting createAuth function`);
  
  // Explicit validation of required environment variables and bindings
  if (!env.BETTER_AUTH_SECRET) {
    const error = new Error("Missing required environment variable: BETTER_AUTH_SECRET");
    console.error(`[${new Date().toISOString()}] ${error.message}`);
    throw error;
  }
  
  if (!env.BETTER_AUTH_URL) {
    const error = new Error("Missing required environment variable: BETTER_AUTH_URL");
    console.error(`[${new Date().toISOString()}] ${error.message}`);
    throw error;
  }
  
  if (!env.cranberry_auth_db) {
    const error = new Error("Missing required database binding: cranberry_auth_db");
    console.error(`[${new Date().toISOString()}] ${error.message}`);
    throw error;
  }
  
  // Only log environment info in development mode and avoid PII
  if (env.NODE_ENV === "development") {
    console.log(`[${new Date().toISOString()}] Environment variables check:`, {
      hasSecret: !!env.BETTER_AUTH_SECRET,
      hasUrl: !!env.BETTER_AUTH_URL,
      hasDatabase: !!env.cranberry_auth_db,
      hasAdminEmails: !!env.ADMIN_EMAILS
    });
  }

  try {
    // Dynamic ESM imports to avoid Edge Runtime issues
    const [
      { betterAuth },
      { drizzleAdapter },
      { drizzle },
      { schema },
      { admin }
    ] = await Promise.all([
      import("better-auth"),
      import("better-auth/adapters/drizzle"),
      import("drizzle-orm/d1"),
      import("../db/schema"),
      import("better-auth/plugins/admin")
    ]);
    
    console.log(`[${new Date().toISOString()}] All imports loaded successfully`);
    
    // Create Drizzle instance with D1 database and schema
    console.log(`[${new Date().toISOString()}] Creating Drizzle database connection`);
    const db = drizzle(env.cranberry_auth_db, { schema });
    console.log(`[${new Date().toISOString()}] Drizzle database connection created`);
    
    console.log(`[${new Date().toISOString()}] Initializing Better Auth with configuration`);
    const authInstance = betterAuth({
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Set to true in production if needed
    },
    database: drizzleAdapter(db, {
      provider: "sqlite",
      usePlural: true,
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    logger: {
      level: (env?.NODE_ENV ?? "production") === "development" ? "debug" : "info"
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes
      },
    },
    cookies: {
      sessionToken: {
        name: "better-auth.session_token",
        httpOnly: true,
        secure: env.NODE_ENV === "production", // Only secure in production
        sameSite: env.NODE_ENV === "production" ? "none" : "lax", // Allow cross-domain in production, lax in development
        domain: env.NODE_ENV === "production" ? (env.COOKIE_DOMAIN || ".paulchrisluke.workers.dev") : undefined, // Set domain in production only
        path: "/",
      },
    },
    user: {
      additionalFields: {
        // Role is managed server-side only, not exposed to client
      }
    },
    plugins: [
      admin({
        // Configure admin plugin for role-based access with proper authorization
        authorize: async ({ session, user }) => {
          // Only allow access if user has admin role
          return user?.role === "admin";
        },
        bootstrapAllowlist: (env.ADMIN_EMAILS ?? "")
          .split(",")
          .map(s => s.trim())
          .filter(Boolean)
      })
    ]
  });
  
  console.log(`[${new Date().toISOString()}] Better Auth instance created successfully`);
  return authInstance;
  
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in createAuth:`, error);
    throw error;
  }
}
