import { NextResponse } from "next/server"
import { auth } from "@/auth"

export async function middleware(req: any) {
  const { pathname } = req.nextUrl
  const session = await auth()

  // Public pages
  if (["/", "/unauthorized"].includes(pathname)) {
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

  return NextResponse.next()
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