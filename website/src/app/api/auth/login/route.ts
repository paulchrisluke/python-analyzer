import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'

export async function POST(request: NextRequest) {
  try {
    // Check if request has body
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 400 })
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Validate and normalize email
    if (typeof email !== 'string') {
      return NextResponse.json({ error: 'Email must be a string' }, { status: 400 })
    }
    
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email cannot be empty' }, { status: 400 })
    }

    // Get admin credentials from environment with proper parsing
    const adminEmails = process.env.ADMIN_EMAILS?.split(/[,\n]/).map(s => s.trim()).filter(Boolean) || []
    const adminPasswords = process.env.ADMIN_PASSWORD_HASHES?.split(/[,\n]/).map(s => s.trim()).filter(Boolean) || []
    const isDevelopment = process.env.NODE_ENV === 'development'

    // Security: Require explicit admin emails configuration
    if (adminEmails.length === 0) {
      console.error('ADMIN_EMAILS not configured or contains no valid entries')
      return NextResponse.json({ error: 'Authentication not configured' }, { status: 500 })
    }

    // Security: Require explicit password hashes unless in development
    if (adminPasswords.length === 0 && !isDevelopment) {
      console.error('ADMIN_PASSWORD_HASHES not configured or contains no valid entries and not in development mode')
      return NextResponse.json({ error: 'Authentication not configured' }, { status: 500 })
    }

    // Security: Ensure email and password arrays align when not in development
    if (!isDevelopment && adminEmails.length !== adminPasswords.length) {
      console.error(`ADMIN_EMAILS (${adminEmails.length} entries) and ADMIN_PASSWORD_HASHES (${adminPasswords.length} entries) length mismatch`)
      return NextResponse.json({ error: 'Authentication configuration mismatch' }, { status: 500 })
    }

    // Security: Require explicit JWT secret configuration
    if (!process.env.AUTH_SECRET) {
      console.error('AUTH_SECRET not configured')
      return NextResponse.json({ error: 'Authentication not configured' }, { status: 500 })
    }

    // Security: Validate AUTH_SECRET strength
    const authSecret = process.env.AUTH_SECRET
    const secretBytes = new TextEncoder().encode(authSecret)
    if (secretBytes.length < 32) {
      console.error(`AUTH_SECRET is too weak: ${secretBytes.length} bytes (minimum 32 required)`)
      return NextResponse.json({ 
        error: 'Authentication configuration error: JWT secret is too weak. Please use a secret with at least 32 characters or consider migrating to asymmetric signing (RS256) for enhanced security.' 
      }, { status: 500 })
    }

    // Find admin email index
    const adminIndex = adminEmails.findIndex(adminEmail => 
      adminEmail.trim().toLowerCase() === normalizedEmail
    )

    if (adminIndex === -1) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Development bypass: allow any password when in development and no hashes configured
    if (isDevelopment && adminPasswords.length === 0) {
      console.warn('Development mode: Allowing authentication without password verification')
    } else {
      // Production mode: require explicit password verification
      const correctPassword = adminPasswords[adminIndex]?.trim()
      if (!correctPassword || correctPassword !== password) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }
    }

    // Create JWT token
    const secret = new TextEncoder().encode(authSecret)
    const token = await new SignJWT({ 
      email: normalizedEmail,
      name: normalizedEmail.split('@')[0]
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .setIssuer('cranberry')
      .setAudience('web')
      .setSubject(normalizedEmail)
      .sign(secret)

    // Set cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set('cranberry-auth-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
