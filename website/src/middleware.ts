import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/docs']

// Public routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup']

// Helper function to check if a pathname matches a route exactly or as a prefix with slash
function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(route + '/')
}

// Simple authentication check using session cookie
async function isAuthenticated(req: NextRequest): Promise<boolean> {
  try {
    // In development, allow access for testing
    if (process.env.NODE_ENV === 'development') {
      return true
    }

    // Check for signed session token and verify on the server
    const sessionCookie = req.cookies.get('cranberry-auth-session')
    if (!sessionCookie?.value) return false
    const token = sessionCookie.value
    await jwtVerify(
      token,
      new TextEncoder().encode(process.env.AUTH_SECRET as string),
      { issuer: 'cranberry', audience: 'web' }
    )
    return true
  } catch (error) {
    console.error('Authentication check failed:', error)
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the route is protected using exact-or-prefix-with-slash matching
  const isProtectedRoute = protectedRoutes.some(route => 
    matchesRoute(pathname, route)
  )

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route
  )

  // For protected routes, check authentication server-side
  if (isProtectedRoute) {
    const authenticated = await isAuthenticated(request)
    
    if (!authenticated) {
      // Redirect to login page, preserving the original pathname
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // For public routes, allow access
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // For any other routes, allow access (they can handle their own auth logic)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
