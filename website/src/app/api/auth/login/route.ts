import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'

export async function POST(request: NextRequest) {
  try {
    // Check if request has body
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 400 })
    }

    const body = await request.json()
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Get admin credentials from environment
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@example.com', 'test@example.com']
    const adminPasswords = process.env.ADMIN_PASSWORD_HASHES?.split(',') || []

    // For development/testing, use simple password comparison
    // In production, you'd verify against hashed passwords
    const adminIndex = adminEmails.findIndex(adminEmail => 
      adminEmail.trim().toLowerCase() === email.toLowerCase()
    )

    if (adminIndex === -1) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // For testing, allow any password if no hashes are configured
    const correctPassword = adminPasswords[adminIndex]?.trim()
    if (adminPasswords.length > 0 && (!correctPassword || correctPassword !== password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Create JWT token
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'your-super-secret-jwt-key-here-minimum-32-characters')
    const token = await new SignJWT({ 
      email: email.toLowerCase(),
      name: email.split('@')[0]
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .setIssuer('cranberry')
      .setAudience('web')
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
