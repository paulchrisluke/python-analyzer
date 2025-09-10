import { NextRequest } from "next/server"
import { headers } from "next/headers"
import { createAuth, Env } from "@/auth"
import { UserRole, hasRole } from "@/lib/roles"

// Get validated environment variables with safe defaults for non-production
const secret = process.env.BETTER_AUTH_SECRET || "your-secret-key-change-in-production"
const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000"

// Create environment object for auth
const env: Env = {
  cranberry_auth_db: process.env.cranberry_auth_db as any,
  BETTER_AUTH_SECRET: secret,
  BETTER_AUTH_URL: baseURL,
  NODE_ENV: process.env.NODE_ENV,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
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
