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
}

export async function createAuth(env: Env) {
  // Dynamic ESM imports to avoid Edge Runtime issues
  const [
    { betterAuth },
    { drizzleAdapter },
    { drizzle },
    { schema }
  ] = await Promise.all([
    import("better-auth"),
    import("better-auth/adapters/drizzle"),
    import("drizzle-orm/d1"),
    import("../db/schema")
  ]);
  
  // Create Drizzle instance with D1 database and schema
  const db = drizzle(env.cranberry_auth_db, { schema });
  
  return betterAuth({
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
        role: {
          type: "string",
          defaultValue: "user",
          required: true,
        }
      }
    },
    plugins: [
      {
        id: "admin",
        config: {
          adminEmails: ["admin@cranberryhearing.com"], // Add admin emails here
        }
      }
    ]
  });
}
