import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function GET(request: NextRequest) {
  try {
    // Get the JWT token from the HttpOnly cookie
    const token = request.cookies.get('cranberry-auth-session')?.value

    if (!token) {
      return NextResponse.json({ user: null }, { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'Vary': 'Cookie'
        }
      })
    }

    // Verify the JWT token
    const authSecret = process.env.AUTH_SECRET
    if (!authSecret) {
      console.error('AUTH_SECRET not configured')
      return NextResponse.json({ error: 'Authentication not configured' }, { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
          'Vary': 'Cookie'
        }
      })
    }

    const secret = new TextEncoder().encode(authSecret)
    
    try {
      const { payload } = await jwtVerify(token, secret, {
        issuer: 'cranberry',
        audience: 'web'
      })

      // Validate JWT payload fields
      const email = payload.email
      const name = payload.name
      const role = payload.role

      // Validate email is a non-empty string
      if (typeof email !== 'string' || email.trim() === '') {
        console.error('Invalid email in JWT payload:', email)
        const response = NextResponse.json({ user: null }, { 
          status: 200,
          headers: {
            'Cache-Control': 'no-store',
            'Vary': 'Cookie'
          }
        })
        response.cookies.delete('cranberry-auth-session')
        return response
      }

      // Validate name is a non-empty string
      if (typeof name !== 'string' || name.trim() === '') {
        console.error('Invalid name in JWT payload:', name)
        const response = NextResponse.json({ user: null }, { 
          status: 200,
          headers: {
            'Cache-Control': 'no-store',
            'Vary': 'Cookie'
          }
        })
        response.cookies.delete('cranberry-auth-session')
        return response
      }

      // Validate role is either 'admin' or 'buyer'
      if (role !== 'admin' && role !== 'buyer') {
        console.error('Invalid role in JWT payload:', role)
        const response = NextResponse.json({ user: null }, { 
          status: 200,
          headers: {
            'Cache-Control': 'no-store',
            'Vary': 'Cookie'
          }
        })
        // Clear the HttpOnly cookie by setting it to expire immediately
        response.cookies.set('cranberry-auth-session', '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 0, // Expire immediately
          path: '/'
        })
        return response
      }

      // Extract user information from the validated JWT payload
      const user = {
        email: email.trim(),
        name: name.trim(),
        role: role as 'admin' | 'buyer',
        isAdmin: role === 'admin',
        isBuyer: role === 'buyer',
        avatar: "/avatars/user.jpg"
      }

      return NextResponse.json({ user }, { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'Vary': 'Cookie'
        }
      })
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError)
      // Invalid or expired token - clear the cookie
      const response = NextResponse.json({ user: null }, { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'Vary': 'Cookie'
        }
      })
      response.cookies.delete('cranberry-auth-session')
      return response
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
        'Vary': 'Cookie'
      }
    })
  }
}
