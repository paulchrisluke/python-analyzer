import { NextRequest, NextResponse } from 'next/server'

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/docs']

// Public routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route
  )

  // For protected routes, we'll let the client-side handle authentication
  // since we're using Better Auth with client-side session management
  if (isProtectedRoute) {
    // The client-side components will handle redirecting to login if not authenticated
    return NextResponse.next()
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
