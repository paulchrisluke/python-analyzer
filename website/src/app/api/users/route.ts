import { NextRequest, NextResponse } from "next/server"
import { createAuth, Env } from "@/auth"
import { drizzle } from "drizzle-orm/d1"
import { schema } from "../../../../db/schema"
import { eq, desc } from "drizzle-orm"
import { UserRole } from "@/lib/roles"

// Force Node.js runtime and disable caching for SQLite/Drizzle compatibility
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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

// GET /api/users - Fetch all users
export async function GET(request: NextRequest) {
  try {
    // Create auth instance to verify admin access
    const auth = await createAuth(env)
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create Drizzle instance
    const db = drizzle(env.cranberry_auth_db, { schema })

    // Fetch all users
    const users = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        isActive: schema.users.isActive,
        lastLoginAt: schema.users.lastLoginAt,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
      })
      .from(schema.users)
      .orderBy(desc(schema.users.createdAt))

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    // Create auth instance to verify admin access
    const auth = await createAuth(env)
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, role, password } = body

    // Validate required fields
    if (!name || !email || !role || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Create Drizzle instance
    const db = drizzle(env.cranberry_auth_db, { schema })

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1)

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Create user using Better Auth
    const newUser = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        role
      }
    })

    if (!newUser) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
