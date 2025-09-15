import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/docs', '/admin', '/buyer']

// Admin-only routes
const adminOnlyRoutes = ['/admin']

// Public routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup', '/unauthorized']

// Helper function to check if a pathname matches a route exactly or as a prefix with slash
function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(route + '/')
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
    // Get the JWT token using NextAuth's getToken function
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token) {
      // Redirect to login page, preserving the original pathname
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const userRole = token.role

    // Check admin-only routes
    const isAdminOnlyRoute = adminOnlyRoutes.some(route => 
      matchesRoute(pathname, route)
    )
    
    if (isAdminOnlyRoute && userRole !== 'admin') {
      // Redirect to unauthorized page
      const unauthorizedUrl = new URL('/unauthorized', request.url)
      return NextResponse.redirect(unauthorizedUrl)
    }

    // For buyer routes, allow both admin and buyer roles
    // (admins can access buyer routes for oversight)
    const isBuyerRoute = matchesRoute(pathname, '/buyer')
    if (isBuyerRoute && userRole !== 'buyer' && userRole !== 'admin') {
      // Redirect to unauthorized page
      const unauthorizedUrl = new URL('/unauthorized', request.url)
      return NextResponse.redirect(unauthorizedUrl)
    }
  }

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