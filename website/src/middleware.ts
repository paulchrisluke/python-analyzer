import { NextResponse } from "next/server"
import { auth } from "../auth"
import { NDA_REQUIRED_PHASES, isNDAExempt } from "@/lib/nda-edge"

export async function middleware(req: any) {
  const { pathname } = req.nextUrl
  
  // Skip middleware for NextAuth routes to prevent redirect loops
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }
  
  // Skip middleware for NDA API routes to allow unauthenticated access
  if (pathname.startsWith("/api/nda")) {
    return NextResponse.next()
  }
  
  // Skip middleware for data API routes to allow unauthenticated access
  if (pathname.startsWith("/api/data") || pathname.startsWith("/api/test-data")) {
    return NextResponse.next()
  }
  
  // Skip middleware for public API routes
  if (pathname.startsWith("/api/documents") && /^\/api\/documents\/public(\/|$)/.test(pathname)) {
    return NextResponse.next()
  }
  
  // Allow access to documents API for public document previews only
  if (pathname === "/api/documents" && req.method === "GET" && req.nextUrl.searchParams.has("public")) {
    return NextResponse.next()
  }
  
  // Skip middleware for data files (JSON files in /data directory)
  if (pathname.startsWith("/data/") && pathname.endsWith(".json")) {
    return NextResponse.next()
  }
  
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

  if (pathname.startsWith("/buyer") && !["buyer", "admin", "viewer"].includes(session.user?.role)) {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  // NDA enforcement for protected content
  const requiresNDA = checkIfRequiresNDA(req.nextUrl, session.user?.role)
  if (requiresNDA && (!session.user?.role || !isNDAExempt(session.user.role))) {
    // Check if user has already signed NDA via cookie
    const ndaSignedCookie = req.cookies.get('nda_signed')?.value
    if (!ndaSignedCookie || ndaSignedCookie !== 'true') {
      return NextResponse.redirect(new URL("/nda/required", req.url))
    }
  }

  return NextResponse.next()
}

// Helper function to check if a path requires NDA
function checkIfRequiresNDA(nextUrl: URL, userRole?: string): boolean {
  // Exempt users don't need NDA
  if (userRole && isNDAExempt(userRole)) {
    return false
  }

  const pathname = nextUrl.pathname

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
  const phase = nextUrl.searchParams.get('phase')
  if (phase && NDA_REQUIRED_PHASES.includes(phase)) {
    return true
  }

  return false
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Skip NextAuth API routes, NDA API routes, documents API, and data files to prevent redirect loops
    '/((?!api/auth|api/nda|api/documents|data/.*\\.json|_next/static|_next/image|favicon.ico).*)',
  ],
}