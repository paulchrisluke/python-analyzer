import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { NDA_REQUIRED_PHASES } from "@/lib/nda"

export async function middleware(req: any) {
  const { pathname } = req.nextUrl
  const session = await auth()

  // Public pages
  if (["/", "/unauthorized"].includes(pathname)) {
    return NextResponse.next()
  }

  // NDA pages - allow access
  if (pathname.startsWith("/nda")) {
    return NextResponse.next()
  }

  // Require login for everything else
  if (!session) {
    return NextResponse.redirect(new URL("/api/auth/signin", req.url))
  }

  // Role gates
  if (pathname.startsWith("/admin") && session.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  if (pathname.startsWith("/buyer") && !["buyer", "admin"].includes(session.user?.role)) {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  // NDA enforcement for protected content
  const requiresNDA = checkIfRequiresNDA(pathname, session.user?.role)
  if (requiresNDA) {
    // For non-admin users, redirect to NDA required page
    // The NDA required page will check the actual NDA status via API
    if (session.user?.role !== 'admin') {
      return NextResponse.redirect(new URL("/nda/required", req.url))
    }
  }

  return NextResponse.next()
}

// Helper function to check if a path requires NDA
function checkIfRequiresNDA(pathname: string, userRole?: string): boolean {
  // Admin users are exempt
  if (userRole === 'admin') {
    return false
  }

  // Check for protected document paths
  const protectedPaths = [
    '/buyer/documents',
    '/docs',
    '/api/documents/proxy'
  ]

  // Check if path matches protected patterns
  for (const protectedPath of protectedPaths) {
    if (pathname.startsWith(protectedPath)) {
      return true
    }
  }

  // Check for specific document phases in URL parameters
  const url = new URL(pathname, 'http://localhost')
  const phase = url.searchParams.get('phase')
  if (phase && NDA_REQUIRED_PHASES.includes(phase)) {
    return true
  }

  return false
}

export const config = {
  matcher: [
    // Match all routes except for the ones starting with:
    // - api (API routes)
    // - _next (Next.js internals)
    // - static files like favicon, manifest, assets
    "/((?!api|_next/static|_next/image|favicon.ico|site.webmanifest).*)",
  ],
}