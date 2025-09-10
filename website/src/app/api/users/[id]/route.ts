import { NextRequest, NextResponse } from "next/server"
import { createAuth, Env } from "@/auth"
import { schema } from "../../../../../db/schema"
import { eq, and, ne, count } from "drizzle-orm"
import { UserRole } from "@/lib/roles"
import { getDb } from "@/lib/database"
import { z } from "zod"

// Validation schema for user updates
const UpdateUserInputSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .regex(/^[a-zA-Z0-9\s\-'\.]+$/, "Name contains invalid characters")
    .optional(),
  email: z.string()
    .email("Must be a valid email address")
    .max(255, "Email must be 255 characters or less")
    .optional(),
  role: z.nativeEnum(UserRole, {
    message: "Role must be one of: admin, buyer, viewer, guest"
  }).optional(),
  isActive: z.boolean().optional()
}).strict() // Reject unknown fields

// Type for the validated update data
type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>

// Type for the database update data (excludes optional fields that are undefined)
type UserUpdateData = {
  updatedAt: Date
} & Partial<{
  name: string
  email: string
  role: UserRole
  isActive: boolean
}>

// Force Node.js runtime and disable caching for SQLite/Drizzle compatibility
export const runtime = "edge"
export const dynamic = "force-dynamic"

// Validate required environment variables - fail fast if missing
// SECURITY: BETTER_AUTH_SECRET must be set from a secure source (env management/secret store)
// Never use hardcoded defaults in production as this creates a security vulnerability
const secret = process.env.BETTER_AUTH_SECRET
if (!secret) {
  throw new Error(
    "BETTER_AUTH_SECRET environment variable is required. " +
    "This must be set from a secure source (env management/secret store) before deployment. " +
    "Never use hardcoded defaults in production."
  )
}

// Validate BETTER_AUTH_URL - require it to be explicitly set
// SECURITY: Avoid permissive defaults that could lead to insecure configurations
const baseURL = process.env.BETTER_AUTH_URL
if (!baseURL) {
  throw new Error(
    "BETTER_AUTH_URL environment variable is required. " +
    "This must be set to the correct application URL before deployment."
  )
}

// Additional validation for URL format
try {
  new URL(baseURL)
} catch {
  throw new Error(
    `BETTER_AUTH_URL must be a valid URL. Received: ${baseURL}`
  )
}

// Create environment object for auth
const env: Env = {
  DB: globalThis.cranberry_auth_db, // D1Database binding from Cloudflare Workers
  BETTER_AUTH_SECRET: secret,
  BETTER_AUTH_URL: baseURL,
  NODE_ENV: process.env.NODE_ENV,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
}

// GET /api/users/[id] - Get a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Get database connection using the new getDb helper
    const db = await getDb()

    // Get the params
    const { id } = params

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
  { params }: { params: { id: string } }
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
    
    // Validate and parse input using zod schema
    const validationResult = UpdateUserInputSchema.safeParse(body)
    
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map((err: any) => 
        `${err.path.join('.')}: ${err.message}`
      )
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: errorMessages 
      }, { status: 400 })
    }
    
    const validatedData: UpdateUserInput = validationResult.data

    // Get the params
    const { id } = params

    // Get database connection using the new getDb helper
    const db = await getDb()

    // Check if user exists
    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1)

    if (existingUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Guard against removing the last admin
    const isChangingFromAdmin = validatedData.role !== undefined && 
      existingUser[0].role === 'admin' && 
      validatedData.role !== 'admin'
    const isDeactivatingAdmin = validatedData.isActive === false && 
      existingUser[0].role === 'admin'
    
    if (isChangingFromAdmin || isDeactivatingAdmin) {
      // Count other active admins excluding this user
      const adminCountResult = await db
        .select({ count: count() })
        .from(schema.users)
        .where(
          and(
            eq(schema.users.role, 'admin'),
            eq(schema.users.isActive, true),
            ne(schema.users.id, id)
          )
        )
      
      const otherAdminCount = adminCountResult[0]?.count || 0
      
      if (otherAdminCount === 0) {
        return NextResponse.json({ 
          error: "Cannot demote or deactivate the last admin user" 
        }, { status: 409 })
      }
    }

    // Check if email is being changed and if it already exists
    if (validatedData.email && validatedData.email !== existingUser[0].email) {
      const emailExists = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, validatedData.email))
        .limit(1)

      if (emailExists.length > 0) {
        return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
      }
    }

    // Build update data with proper typing and whitelisting
    const updateData: UserUpdateData = {
      updatedAt: new Date()
    }

    // Only include fields that are provided and validated
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name
    }
    if (validatedData.email !== undefined) {
      updateData.email = validatedData.email
    }
    if (validatedData.role !== undefined) {
      updateData.role = validatedData.role
    }
    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive
    }

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
  { params }: { params: { id: string } }
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

    // Get the params
    const { id } = params

    // Prevent admin from deleting themselves
    if (session.user.id === id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 403 })
    }

    // Get database connection using the new getDb helper
    const db = await getDb()

    // Check if user exists
    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1)

    if (existingUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Guard against deleting the last admin
    if (existingUser[0].role === 'admin') {
      // Count other active admins excluding this user
      const adminCountResult = await db
        .select({ count: count() })
        .from(schema.users)
        .where(
          and(
            eq(schema.users.role, 'admin'),
            eq(schema.users.isActive, true),
            ne(schema.users.id, id)
          )
        )
      
      const otherAdminCount = adminCountResult[0]?.count || 0
      
      if (otherAdminCount === 0) {
        return NextResponse.json({ 
          error: "Cannot delete the last admin user" 
        }, { status: 403 })
      }
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
