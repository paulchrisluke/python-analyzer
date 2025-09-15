import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/auth"

export default auth((req) => {
  const { pathname } = req.nextUrl
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/unauthorized']
  const isPublicRoute = publicRoutes.includes(pathname)
  
  // Skip middleware for API routes, static files, and data files
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.startsWith('/data/') || pathname === '/favicon.ico') {
    return NextResponse.next()
  }
  
  // If user is not authenticated and trying to access protected route
  if (!req.auth && !isPublicRoute) {
    const loginUrl = new URL("/api/auth/signin", req.url)
    // Only set callbackUrl for actual pages, not data files or assets
    if (!pathname.startsWith('/data/') && !pathname.includes('.')) {
      loginUrl.searchParams.set("callbackUrl", pathname)
    } else {
      // Default to dashboard for data files and assets
      loginUrl.searchParams.set("callbackUrl", "/dashboard")
    }
    return NextResponse.redirect(loginUrl)
  }
  
  // If user is authenticated and trying to access signin page, redirect to dashboard
  if (req.auth && pathname === '/api/auth/signin') {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }
  
  // Check role-based access for admin routes
  if (req.auth && pathname.startsWith('/admin')) {
    if (req.auth.user?.role !== 'admin') {
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }
  }
  
  // Check role-based access for buyer routes
  if (req.auth && pathname.startsWith('/buyer')) {
    if (req.auth.user?.role !== 'buyer' && req.auth.user?.role !== 'admin') {
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}