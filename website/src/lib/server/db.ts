// This file is for Node.js development only - not compatible with Cloudflare Workers/Edge
export const runtime = "nodejs"

import { drizzle } from "drizzle-orm/better-sqlite3"
import type { Database as BetterSqliteDatabase } from "better-sqlite3"
import * as schema from "../../../db/schema"
import path from "path"

// Get database path from environment or default to local.db
const dbPath = process.env.DATABASE_PATH || "local.db"
const absoluteDbPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath)

// Create or reuse singleton SQLite connection to survive HMR
function getDatabase(): BetterSqliteDatabase {
  if (!globalThis.__sqlite_db) {
    globalThis.__sqlite_db = new (require("better-sqlite3").default)(absoluteDbPath)
    
    // Configure SQLite with important PRAGMA settings
    globalThis.__sqlite_db.pragma("journal_mode = WAL")
    globalThis.__sqlite_db.pragma("foreign_keys = ON")
    globalThis.__sqlite_db.pragma("busy_timeout = 5000")
  }
  
  return globalThis.__sqlite_db!
}

// Create drizzle instance from singleton connection
const sqlite = getDatabase()
export const db = drizzle(sqlite, { schema })

// Type declaration for globalThis
declare global {
  var __sqlite_db: BetterSqliteDatabase | undefined
}


