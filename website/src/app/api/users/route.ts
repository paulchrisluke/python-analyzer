import { NextRequest, NextResponse } from "next/server"
import { createAuth, Env } from "@/auth"
import { schema } from "../../../../db/schema"
import { eq, desc } from "drizzle-orm"
import { UserRole } from "@/lib/roles"
import { getDb } from "@/lib/database"

// Validation schema and types
interface CreateUserRequest {
  name: string
  email: string
  role: UserRole
  password: string
}

interface ValidationError {
  field: string
  message: string
}

// Allowed roles for user creation (maintained array instead of Object.values)
const ALLOWED_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.BUYER,
  UserRole.VIEWER,
  UserRole.GUEST
]

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Password validation - minimum 8 characters, at least one letter and one number
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/

// Validation functions
function validateEmail(email: unknown): string | null {
  if (typeof email !== 'string') {
    return 'Email must be a string'
  }
  
  const trimmedEmail = email.trim().toLowerCase()
  
  if (!trimmedEmail) {
    return 'Email is required'
  }
  
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return 'Email must be a valid email address'
  }
  
  return null
}

function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string') {
    return 'Password must be a string'
  }
  
  if (!password) {
    return 'Password is required'
  }
  
  if (password.length < 8) {
    return 'Password must be at least 8 characters long'
  }
  
  if (!PASSWORD_REGEX.test(password)) {
    return 'Password must contain at least one letter and one number'
  }
  
  return null
}

function validateRole(role: unknown): string | null {
  if (typeof role !== 'string') {
    return 'Role must be a string'
  }
  
  if (!ALLOWED_ROLES.includes(role as UserRole)) {
    return `Role must be one of: ${ALLOWED_ROLES.join(', ')}`
  }
  
  return null
}

function validateName(name: unknown): string | null {
  if (typeof name !== 'string') {
    return 'Name must be a string'
  }
  
  const trimmedName = name.trim()
  
  if (!trimmedName) {
    return 'Name is required'
  }
  
  if (trimmedName.length < 2) {
    return 'Name must be at least 2 characters long'
  }
  
  return null
}

function validateCreateUserRequest(body: unknown): { isValid: boolean; data?: CreateUserRequest; errors: ValidationError[] } {
  const errors: ValidationError[] = []
  
  if (typeof body !== 'object' || body === null) {
    return {
      isValid: false,
      errors: [{ field: 'body', message: 'Request body must be an object' }]
    }
  }
  
  const { name, email, role, password, ...extraFields } = body as Record<string, unknown>
  
  // Check for extra fields
  if (Object.keys(extraFields).length > 0) {
    errors.push({
      field: 'extra_fields',
      message: `Unexpected fields: ${Object.keys(extraFields).join(', ')}`
    })
  }
  
  // Validate name
  const nameError = validateName(name)
  if (nameError) {
    errors.push({ field: 'name', message: nameError })
  }
  
  // Validate email
  const emailError = validateEmail(email)
  if (emailError) {
    errors.push({ field: 'email', message: emailError })
  }
  
  // Validate role
  const roleError = validateRole(role)
  if (roleError) {
    errors.push({ field: 'role', message: roleError })
  }
  
  // Validate password
  const passwordError = validatePassword(password)
  if (passwordError) {
    errors.push({ field: 'password', message: passwordError })
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors }
  }
  
  // Return normalized data
  return {
    isValid: true,
    data: {
      name: (name as string).trim(),
      email: (email as string).trim().toLowerCase(),
      role: role as UserRole,
      password: password as string
    },
    errors: []
  }
}

// Use edge runtime for Cloudflare Workers compatibility
export const runtime = "edge"
export const dynamic = "force-dynamic"

// Get and validate environment variables
function getValidatedEnv(): Env {
  const isProduction = process.env.NODE_ENV === "production"
  const secret = process.env.BETTER_AUTH_SECRET
  const baseURL = process.env.BETTER_AUTH_URL

  // Fail-fast validation for production
  if (isProduction) {
    if (!secret || secret.trim() === "") {
      console.error("BETTER_AUTH_SECRET is required in production")
      process.exit(1)
    }
    if (!baseURL || baseURL.trim() === "") {
      console.error("BETTER_AUTH_URL is required in production")
      process.exit(1)
    }
  }

  // Development fallbacks with warnings
  const finalSecret = secret || (isProduction ? "" : "dev-secret-key-not-for-production")
  const finalBaseURL = baseURL || (isProduction ? "" : "http://localhost:3000")

  if (!isProduction && (!secret || !baseURL)) {
    console.warn("⚠️  Using development fallbacks for BETTER_AUTH_SECRET and/or BETTER_AUTH_URL")
    console.warn("   Set these environment variables for proper configuration")
  }

  return {
    cranberry_auth_db: process.env.cranberry_auth_db as any, // D1Database binding from Cloudflare Workers
    BETTER_AUTH_SECRET: finalSecret,
    BETTER_AUTH_URL: finalBaseURL,
    NODE_ENV: process.env.NODE_ENV,
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  }
}

// Create environment object for auth
const env: Env = getValidatedEnv()

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

    // Get database connection using the new getDb helper
    const db = await getDb()

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

    // Parse request body with error handling
    let body: unknown
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      return NextResponse.json({ 
        error: "Invalid JSON in request body",
        details: "Request body must be valid JSON"
      }, { status: 400 })
    }

    // Validate request body against schema
    const validation = validateCreateUserRequest(body)
    
    if (!validation.isValid) {
      return NextResponse.json({
        error: "Validation failed",
        details: validation.errors
      }, { status: 400 })
    }

    const { name, email, role, password } = validation.data!

    // Get database connection using the new getDb helper
    const db = await getDb()

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
