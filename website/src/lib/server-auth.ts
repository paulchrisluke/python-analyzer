import { NextRequest } from "next/server"
import { headers } from "next/headers"
import { createAuth, Env } from "@/auth"
import { UserRole, hasRole } from "@/lib/roles"

// Helper function to get and validate string environment variable
function getStringEnv(key: string, defaultValue?: string): string {
  const value = process.env[key]
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required`)
  }
  return value || defaultValue!
}

// Helper function to get optional string environment variable
function getOptionalStringEnv(key: string): string | undefined {
  return process.env[key]
}

// Helper function to get and validate secret
function getSecretOrThrow(): string {
  const isProduction = process.env.NODE_ENV === 'production'
  const secret = process.env.BETTER_AUTH_SECRET
  
  if (!secret) {
    if (isProduction) {
      throw new Error('BETTER_AUTH_SECRET environment variable is required in production')
    } else {
      console.warn('⚠️  BETTER_AUTH_SECRET not set - using development default')
      return "dev-secret-key-not-for-production"
    }
  }
  
  return secret
}

// Helper function to get and validate base URL
function getBaseURLOrThrow(): string {
  const isProduction = process.env.NODE_ENV === 'production'
  const baseURL = process.env.BETTER_AUTH_URL
  
  if (!baseURL) {
    if (isProduction) {
      throw new Error('BETTER_AUTH_URL environment variable is required in production')
    } else {
      console.warn('⚠️  BETTER_AUTH_URL not set - using development default')
      return "http://localhost:3000"
    }
  }
  
  return baseURL
}

// Validate and get environment variables
const secret = getSecretOrThrow()
const baseURL = getBaseURLOrThrow()
const nodeEnv = getOptionalStringEnv('NODE_ENV')
const cookieDomain = getOptionalStringEnv('COOKIE_DOMAIN')
const allowedOrigins = getOptionalStringEnv('ALLOWED_ORIGINS')

// Create environment object for auth with properly validated values
const env: Env = {
  cranberry_auth_db: process.env.cranberry_auth_db as any, // D1Database binding from Cloudflare Workers
  BETTER_AUTH_SECRET: secret,
  BETTER_AUTH_URL: baseURL,
  NODE_ENV: nodeEnv,
  COOKIE_DOMAIN: cookieDomain,
  ALLOWED_ORIGINS: allowedOrigins,
}

export interface ServerSession {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
  }
}

/**
 * Get the current session on the server side
 */
export async function getServerSession(): Promise<ServerSession | null> {
  try {
    const auth = await createAuth(env)
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList
    })

    if (!session?.user) {
      return null
    }

    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user as any).role as UserRole || UserRole.GUEST
      }
    }
  } catch (error) {
    console.error("Error getting server session:", error)
    return null
  }
}

/**
 * Check if the current user has the required role
 */
export async function requireRole(requiredRole: UserRole): Promise<ServerSession | null> {
  const session = await getServerSession()
  
  if (!session) {
    return null
  }

  if (!hasRole(session.user.role, requiredRole)) {
    return null
  }

  return session
}

/**
 * Check if the current user is an admin
 */
export async function requireAdmin(): Promise<ServerSession | null> {
  return requireRole(UserRole.ADMIN)
}
