export interface Env {
  cranberry_auth_db: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  NODE_ENV?: string;
}

export function createAuth(env: Env) {
  // Lazy import to avoid Edge Runtime dynamic code evaluation issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { betterAuth } = require("better-auth");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzleAdapter } = require("better-auth/adapters/drizzle");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require("drizzle-orm/d1");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { schema } = require("../db/schema");
  
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
    },
    user: {
      additionalFields: {
        // Add any additional user fields if needed
      }
    }
  });
}
