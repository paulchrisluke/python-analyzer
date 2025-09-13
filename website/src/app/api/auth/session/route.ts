import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function GET(request: NextRequest) {
  try {
    // Get the JWT token from the HttpOnly cookie
    const token = request.cookies.get('cranberry-auth-session')?.value

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    // Verify the JWT token
    const authSecret = process.env.AUTH_SECRET
    if (!authSecret) {
      console.error('AUTH_SECRET not configured')
      return NextResponse.json({ error: 'Authentication not configured' }, { status: 500 })
    }

    const secret = new TextEncoder().encode(authSecret)
    
    try {
      const { payload } = await jwtVerify(token, secret, {
        issuer: 'cranberry',
        audience: 'web'
      })

      // Extract user information from the JWT payload
      const user = {
        email: payload.email as string,
        name: payload.name as string,
        role: payload.role as 'admin' | 'buyer',
        isAdmin: payload.role === 'admin',
        isBuyer: payload.role === 'buyer',
        avatar: "/avatars/user.jpg"
      }

      return NextResponse.json({ user }, { status: 200 })
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError)
      // Invalid or expired token - clear the cookie
      const response = NextResponse.json({ user: null }, { status: 200 })
      response.cookies.delete('cranberry-auth-session')
      return response
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
