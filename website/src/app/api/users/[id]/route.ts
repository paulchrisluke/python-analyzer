import { NextRequest, NextResponse } from "next/server"
import { createAuth, Env } from "@/auth"
import { drizzle } from "drizzle-orm/d1"
import { schema } from "../../../../../db/schema"
import { eq } from "drizzle-orm"
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

// GET /api/users/[id] - Get a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get the resolved params
    const { id } = await params

    // Fetch user by ID
    const user = await db
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
      .where(eq(schema.users.id, id))
      .limit(1)

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user[0])
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PUT /api/users/[id] - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { name, email, role, isActive } = body

    // Get the resolved params
    const { id } = await params

    // Validate role if provided
    if (role && !Object.values(UserRole).includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Create Drizzle instance
    const db = drizzle(env.cranberry_auth_db, { schema })

    // Check if user exists
    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1)

    if (existingUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingUser[0].email) {
      const emailExists = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email))
        .limit(1)

      if (emailExists.length > 0) {
        return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
      }
    }

    // Update user
    const updateData: any = {
      updatedAt: new Date()
    }

    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedUser = await db
      .update(schema.users)
      .set(updateData)
      .where(eq(schema.users.id, id))
      .returning({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        isActive: schema.users.isActive,
        lastLoginAt: schema.users.lastLoginAt,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
      })

    return NextResponse.json(updatedUser[0])
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Create auth instance to verify admin access
    const auth = await createAuth(env)
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the resolved params
    const { id } = await params

    // Prevent admin from deleting themselves
    if (session.user.id === id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Create Drizzle instance
    const db = drizzle(env.cranberry_auth_db, { schema })

    // Check if user exists
    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1)

    if (existingUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete user (cascade will handle related records)
    await db
      .delete(schema.users)
      .where(eq(schema.users.id, id))

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
