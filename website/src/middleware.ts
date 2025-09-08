import { NextRequest, NextResponse } from 'next/server'

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/docs']

// Public routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup']

// Helper function to check if a pathname matches a route exactly or as a prefix with slash
function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(route + '/')
}

// Server-side authentication check using auth worker session endpoint
async function isAuthenticated(req: NextRequest): Promise<boolean> {
  try {
    const authWorkerUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL
    
    if (!authWorkerUrl) {
      console.warn('Missing BETTER_AUTH_URL for authentication check')
      return false
    }

    // Skip auth check if the auth worker URL is localhost (development/test environment)
    if (authWorkerUrl.includes('localhost') || authWorkerUrl.includes('127.0.0.1')) {
      return true
    }

    // Sanitize the auth worker URL by trimming trailing slashes to prevent double slashes
    const sanitizedAuthWorkerUrl = authWorkerUrl.replace(/\/+$/, '')

    // Call the auth worker's session endpoint
    const sessionResponse = await fetch(`${sanitizedAuthWorkerUrl}/api/auth/session`, {
      method: 'GET',
      headers: {
        'Cookie': req.headers.get('cookie') || '',
        'User-Agent': req.headers.get('user-agent') || '',
        'Accept': 'application/json',
      },
    })

    if (!sessionResponse.ok) {
      return false
    }

    const sessionData = await sessionResponse.json() as { user?: any }
    return !!sessionData?.user
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
