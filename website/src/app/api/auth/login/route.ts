import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import bcrypt from 'bcrypt'

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

    // Get credentials from environment with proper parsing
    const adminEmails = process.env.ADMIN_EMAILS?.split(/[,\n]/).map(s => s.trim()).filter(Boolean) || []
    const adminPasswordHashes = process.env.ADMIN_PASSWORD_HASHES?.split(/[,\n]/).map(s => s.trim()).filter(Boolean) || []
    const buyerEmails = process.env.BUYER_EMAILS?.split(/[,\n]/).map(s => s.trim()).filter(Boolean) || []
    const buyerPasswordHashes = process.env.BUYER_PASSWORD_HASHES?.split(/[,\n]/).map(s => s.trim()).filter(Boolean) || []
    const isDevelopment = process.env.NODE_ENV === 'development'

    // Security: Require explicit credentials configuration
    if (adminEmails.length === 0 && buyerEmails.length === 0) {
      console.error('No admin or buyer emails configured')
      return NextResponse.json({ error: 'Authentication not configured' }, { status: 500 })
    }

    // Security: Require explicit password hashes unless in development
    if (adminPasswordHashes.length === 0 && buyerPasswordHashes.length === 0 && !isDevelopment) {
      console.error('No password hashes configured and not in development mode')
      return NextResponse.json({ error: 'Authentication not configured' }, { status: 500 })
    }

    // Security: Ensure email and password arrays align when not in development
    if (!isDevelopment) {
      if (adminEmails.length > 0 && adminEmails.length !== adminPasswordHashes.length) {
        console.error(`ADMIN_EMAILS (${adminEmails.length} entries) and ADMIN_PASSWORD_HASHES (${adminPasswordHashes.length} entries) length mismatch`)
        return NextResponse.json({ error: 'Authentication configuration mismatch' }, { status: 500 })
      }
      if (buyerEmails.length > 0 && buyerEmails.length !== buyerPasswordHashes.length) {
        console.error(`BUYER_EMAILS (${buyerEmails.length} entries) and BUYER_PASSWORD_HASHES (${buyerPasswordHashes.length} entries) length mismatch`)
        return NextResponse.json({ error: 'Authentication configuration mismatch' }, { status: 500 })
      }
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

    // Check if user is admin
    const adminIndex = adminEmails.findIndex(adminEmail => 
      adminEmail.trim().toLowerCase() === normalizedEmail
    )

    let userRole = null
    let isValidCredentials = false

    if (adminIndex !== -1) {
      // Development bypass: allow any password when in development and no hashes configured
      if (isDevelopment && adminPasswordHashes.length === 0) {
        console.warn('Development mode: Allowing admin authentication without password verification')
        userRole = 'admin'
        isValidCredentials = true
      } else {
        // Production mode: require explicit password verification using bcrypt
        const storedHash = adminPasswordHashes[adminIndex]?.trim()
        if (storedHash) {
          try {
            const isPasswordValid = await bcrypt.compare(password, storedHash)
            if (isPasswordValid) {
              userRole = 'admin'
              isValidCredentials = true
            }
          } catch (error) {
            console.error('Error verifying admin password:', error)
            return NextResponse.json({ error: 'Authentication error' }, { status: 500 })
          }
        }
      }
    }

    // If not admin, check if user is buyer
    if (!isValidCredentials) {
      const buyerIndex = buyerEmails.findIndex(buyerEmail => 
        buyerEmail.trim().toLowerCase() === normalizedEmail
      )

      if (buyerIndex !== -1) {
        // Development bypass: allow any password when in development and no hashes configured
        if (isDevelopment && buyerPasswordHashes.length === 0) {
          console.warn('Development mode: Allowing buyer authentication without password verification')
          userRole = 'buyer'
          isValidCredentials = true
        } else {
          // Production mode: require explicit password verification using bcrypt
          const storedHash = buyerPasswordHashes[buyerIndex]?.trim()
          if (storedHash) {
            try {
              const isPasswordValid = await bcrypt.compare(password, storedHash)
              if (isPasswordValid) {
                userRole = 'buyer'
                isValidCredentials = true
              }
            } catch (error) {
              console.error('Error verifying buyer password:', error)
              return NextResponse.json({ error: 'Authentication error' }, { status: 500 })
            }
          }
        }
      }
    }

    if (!isValidCredentials) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Create JWT token with role information
    const secret = new TextEncoder().encode(authSecret)
    const token = await new SignJWT({ 
      email: normalizedEmail,
      name: normalizedEmail.split('@')[0],
      role: userRole
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
      httpOnly: true, // Restored for security
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
