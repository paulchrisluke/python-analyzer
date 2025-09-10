import { drizzle } from "drizzle-orm/d1"
import { schema } from "../../db/schema"
import type { DrizzleD1Database } from "drizzle-orm/d1"

// Cloudflare Workers types - minimal definition for build compatibility
interface D1Database {
  prepare(query: string): any;
  exec(query: string): Promise<any>;
  batch(statements: any[]): Promise<any[]>;
}

// Cloudflare Workers environment interface
interface CloudflareEnv {
  DB: D1Database;
}

// Cached database instance for Node.js development
let cachedDb: DrizzleD1Database<typeof schema> | null = null;

/**
 * Get database connection appropriate for the runtime environment
 * For Cloudflare Workers edge runtime: requires env.DB
 * For Node.js development: uses better-sqlite3 with local.db
 */
export async function getDb(env?: CloudflareEnv): Promise<DrizzleD1Database<typeof schema>> {
  // Check if we're in Cloudflare Workers environment
  if (typeof globalThis !== 'undefined' && 'DB' in globalThis) {
    // Cloudflare Workers edge runtime
    const d1Db = (globalThis as any).DB as D1Database;
    if (!d1Db) {
      throw new Error("D1 database binding 'DB' not found in Cloudflare Workers environment");
    }
    return drizzle(d1Db, { schema });
  }

  // Check if env parameter provides D1 database (for edge runtime)
  if (env?.DB) {
    return drizzle(env.DB, { schema });
  }

  // Check if we're in edge runtime (no Node.js APIs available)
  if (typeof process === 'undefined' || !process.versions?.node) {
    throw new Error(
      "Database connection not available in edge runtime. " +
      "This function requires either a D1 database binding or Node.js runtime. " +
      "For edge runtime, ensure the D1 database binding is properly configured."
    );
  }

  // Node.js development environment - use better-sqlite3
  if (cachedDb) {
    return cachedDb;
  }

  try {
    // Dynamic import to avoid bundling better-sqlite3 in edge runtime
    const { drizzle: drizzleSqlite } = await import('drizzle-orm/better-sqlite3');
    const Database = (await import('better-sqlite3')).default;
    const sqlite = new Database('./local.db');
    cachedDb = drizzleSqlite(sqlite, { schema }) as unknown as DrizzleD1Database<typeof schema>;
    return cachedDb;
  } catch (error) {
    throw new Error(
      "Failed to create SQLite database connection for local development. " +
      "Ensure better-sqlite3 is installed and local.db exists. " +
      "Error: " + (error as Error).message
    );
  }
}

/**
 * @deprecated Use getDb() instead. This function is kept for backward compatibility.
 * Creates a properly typed database connection
 * @param config Database configuration object
 * @returns Drizzle database instance
 */
export async function createDatabaseConnection(config: DatabaseConfig): Promise<DrizzleD1Database<typeof schema>> {
  const { DB } = config

  // Feature detection: Check if D1 binding is available and valid
  const hasD1 = !!DB && typeof DB.prepare === "function";
  
  if (hasD1) {
    // Use D1 database when a binding is available
    const { drizzle } = await import("drizzle-orm/d1");
    return drizzle(DB, { schema });
  } else {
    // Fallback to better-sqlite3 for local development
    try {
      // Dynamic import to avoid bundling better-sqlite3 in edge runtime
      const { drizzle: drizzleSqlite } = await import('drizzle-orm/better-sqlite3');
      const Database = (await import('better-sqlite3')).default;
      const sqlite = new Database('./local.db')
      return drizzleSqlite(sqlite, { schema }) as unknown as DrizzleD1Database<typeof schema>
    } catch (error) {
      throw new Error(
        "Failed to create SQLite database connection for local development. " +
        "Ensure better-sqlite3 is installed and local.db exists. " +
        "Error: " + (error as Error).message
      )
    }
  }
}

/**
 * @deprecated Use getDb() instead. This function is kept for backward compatibility.
 * Validates and creates a database connection from environment variables
 * @param env Environment variables object
 * @returns Drizzle database instance
 */
export async function createDatabaseFromEnv(env: {
  DB?: D1Database
  NODE_ENV?: string
}) {
  return await createDatabaseConnection({
    DB: env.DB,
    NODE_ENV: env.NODE_ENV
  })
}

/**
 * @deprecated Use getDb() instead. This function is kept for backward compatibility.
 * Type-safe environment variable validation for database connection
 * @param env Environment variables
 * @returns Validated environment object with proper typing
 */
export function validateDatabaseEnv(env: {
  DB?: unknown
  NODE_ENV?: string
}): {
  DB?: D1Database
  NODE_ENV?: string
} {
  const { DB, NODE_ENV } = env

  // Feature detection: Validate D1 binding if present
  if (DB) {
    // Type guard to ensure it's a valid D1Database
    if (typeof DB !== "object" || 
        !DB || 
        typeof (DB as any).prepare !== "function") {
      throw new Error(
        "DB must be a valid D1Database instance. " +
        "Received invalid database binding."
      )
    }
  }

  return {
    DB: DB as D1Database | undefined,
    NODE_ENV
  }
}

// Legacy interface for backward compatibility
export interface DatabaseConfig {
  DB?: D1Database
  NODE_ENV?: string // Deprecated: no longer used for gating, kept for backward compatibility
}
