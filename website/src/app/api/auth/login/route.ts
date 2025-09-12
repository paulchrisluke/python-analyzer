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

    // Get admin credentials from environment
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
    const adminPasswords = process.env.ADMIN_PASSWORD_HASHES?.split(',') || []
    const isDevelopment = process.env.NODE_ENV === 'development'

    // Security: Require explicit admin emails configuration
    if (adminEmails.length === 0) {
      console.error('ADMIN_EMAILS not configured')
      return NextResponse.json({ error: 'Authentication not configured' }, { status: 500 })
    }

    // Security: Require explicit password hashes unless in development
    if (adminPasswords.length === 0 && !isDevelopment) {
      console.error('ADMIN_PASSWORD_HASHES not configured and not in development mode')
      return NextResponse.json({ error: 'Authentication not configured' }, { status: 500 })
    }

    // Security: Require explicit JWT secret configuration
    if (!process.env.AUTH_SECRET) {
      console.error('AUTH_SECRET not configured')
      return NextResponse.json({ error: 'Authentication not configured' }, { status: 500 })
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
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
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
