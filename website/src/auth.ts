// Cloudflare Workers types - minimal definition for build compatibility
declare global {
  interface D1Database {
    prepare(query: string): any;
    exec(query: string): Promise<any>;
    batch(statements: any[]): Promise<any[]>;
  }
}

export interface Env {
  DB?: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  COOKIE_DOMAIN?: string;
  NODE_ENV?: string;
  ALLOWED_ORIGINS?: string;
}

export async function createAuth(env: Env) {
  // Dynamic ESM imports to avoid Edge Runtime issues
  const [
    { betterAuth },
    { drizzleAdapter },
    { createDatabaseConnection }
  ] = await Promise.all([
    import("better-auth"),
    import("better-auth/adapters/drizzle"),
    import("./lib/database")
  ]);
  
  // Create database connection with proper typing and validation
  const db = await createDatabaseConnection({
    DB: env.DB
  });
  
  return betterAuth({
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Set to true in production if needed
      password: {
        hash: async (password: string) => {
          // Use Web Crypto API for edge runtime compatibility
          const encoder = new TextEncoder();
          const data = encoder.encode(password);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        },
        verify: async ({ hash, password }: { hash: string; password: string }) => {
          // Use Web Crypto API for edge runtime compatibility
          const encoder = new TextEncoder();
          const data = encoder.encode(password);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          return computedHash === hash;
        },
      },
    },
    database: drizzleAdapter(db, {
      provider: "sqlite",
      usePlural: true,
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [
      "http://localhost:3000",
      "http://localhost:3001", 
      "https://cranberry-hearing-balance-workers.paulchrisluke.workers.dev"
    ],
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
        role: {
          type: "string",
          required: false,
          defaultValue: "guest"
        }
      }
    }
  });
}
