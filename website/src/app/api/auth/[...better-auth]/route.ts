import { NextRequest } from "next/server"
import { createAuth, Env } from "@/auth"

// Force Node.js runtime and disable caching for SQLite/Drizzle compatibility
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Validate environment variables for production
const isProduction = process.env.NODE_ENV === "production"

if (isProduction) {
  if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error("BETTER_AUTH_SECRET environment variable is required in production")
  }
  if (!process.env.BETTER_AUTH_URL) {
    throw new Error("BETTER_AUTH_URL environment variable is required in production")
  }
}

// Get validated environment variables with safe defaults for non-production
const secret = process.env.BETTER_AUTH_SECRET || "your-secret-key-change-in-production"
const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000"

// Create environment object for auth
const env: Env = {
  cranberry_auth_db: process.env.cranberry_auth_db as any, // This will be bound in Cloudflare Workers
  BETTER_AUTH_SECRET: secret,
  BETTER_AUTH_URL: baseURL,
  NODE_ENV: process.env.NODE_ENV,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
}

// For local development, cranberry_auth_db will be undefined
// The createAuth function will handle this by using better-sqlite3 directly

export async function GET(request: NextRequest) {
  try {
    // Create Better Auth instance using the D1-compatible configuration
    const auth = await createAuth(env)
    return await auth.handler(request)
  } catch (error) {
    console.error("Auth GET error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Create Better Auth instance using the D1-compatible configuration
    const auth = await createAuth(env)
    return await auth.handler(request)
  } catch (error) {
    console.error("Auth POST error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
