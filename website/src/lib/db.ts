import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import * as schema from "../../db/schema"

// Create SQLite database connection for development
const sqlite = new Database("local.db")
export const db = drizzle(sqlite, { schema })


