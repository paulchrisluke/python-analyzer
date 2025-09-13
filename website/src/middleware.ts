import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/docs', '/admin', '/buyer']

// Admin-only routes
const adminOnlyRoutes = ['/admin']

// Buyer-only routes  
const buyerOnlyRoutes = ['/buyer']

// Public routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup']

// Helper function to check if a pathname matches a route exactly or as a prefix with slash
function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(route + '/')
}

// Valid roles in the system
const VALID_ROLES = ['admin', 'buyer'] as const

// Get user role from JWT token
async function getUserRole(req: NextRequest): Promise<string | null> {
  try {
    // Development bypass: return configured role when bypass is enabled
    // Single DEV_AUTH_ROLE variable: if set in development, use it; if not set, use normal auth
    if (process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH_ROLE) {
      const devRole = process.env.DEV_AUTH_ROLE.trim()
      // Validate role against known roles, fallback to 'admin' if invalid
      return VALID_ROLES.includes(devRole as any) ? devRole : 'admin'
    }

    const authSecret = process.env.AUTH_SECRET?.trim()
    if (!authSecret || authSecret.length < 32) {
      return null
    }

    const sessionCookie = req.cookies.get('cranberry-auth-session')
    if (!sessionCookie?.value) return null
    
    const token = sessionCookie.value
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(authSecret),
      { issuer: 'cranberry', audience: 'web' }
    )
    
    // Extract role from token payload
    return (payload as any)?.role || null
  } catch (error) {
    console.error('Role extraction failed:', error)
    return null
  }
}

// Simple authentication check using session cookie
async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const role = await getUserRole(req)
  return role !== null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route
  )

  // For public routes, allow access
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check if the route is protected using exact-or-prefix-with-slash matching
  const isProtectedRoute = protectedRoutes.some(route => 
    matchesRoute(pathname, route)
  )

  // For protected routes, check authentication and authorization
  if (isProtectedRoute) {
    const userRole = await getUserRole(request)
    
    if (!userRole) {
      // Redirect to login page, preserving the original pathname
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check admin-only routes
    const isAdminOnlyRoute = adminOnlyRoutes.some(route => 
      matchesRoute(pathname, route)
    )
    
    if (isAdminOnlyRoute && userRole !== 'admin') {
      // Redirect to unauthorized page or buyer dashboard
      const unauthorizedUrl = new URL('/unauthorized', request.url)
      return NextResponse.redirect(unauthorizedUrl)
    }

    // Check buyer-only routes
    const isBuyerOnlyRoute = buyerOnlyRoutes.some(route => 
      matchesRoute(pathname, route)
    )
    
    if (isBuyerOnlyRoute && userRole !== 'buyer') {
      // Redirect to unauthorized page or admin dashboard
      const unauthorizedUrl = new URL('/unauthorized', request.url)
      return NextResponse.redirect(unauthorizedUrl)
    }
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
