import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { getUserRole } from "./src/lib/nda-storage"

// Module-load validation for required environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET

if (!GOOGLE_CLIENT_ID) {
  throw new Error(
    "Missing required environment variable: GOOGLE_CLIENT_ID. " +
    "Please set this in your .env.local file or Vercel secrets."
  )
}

if (!GOOGLE_CLIENT_SECRET) {
  throw new Error(
    "Missing required environment variable: GOOGLE_CLIENT_SECRET. " +
    "Please set this in your .env.local file or Vercel secrets."
  )
}

if (!AUTH_SECRET) {
  throw new Error(
    "Missing required environment variable: AUTH_SECRET (or NEXTAUTH_SECRET for backward compatibility). " +
    "Please set this in your .env.local file or Vercel secrets."
  )
}

// In-memory cache for user roles to avoid repeated blob storage calls
const roleCache = new Map<string, { role: 'admin' | 'buyer' | 'lawyer' | 'viewer', timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Valid roles allowlist
const VALID_ROLES = ['admin', 'buyer', 'lawyer', 'viewer'] as const

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    }),
  ],
  // Use default NextAuth pages to avoid redirect loops
  // pages: {
  //   signIn: '/api/auth/signin',
  //   signOut: '/api/auth/signout',
  //   error: '/api/auth/error',
  // },
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log("🔀 Redirect callback called:", { url, baseUrl })
      
      // Force redirect to home page after signin
      if (url.includes("/api/auth/signin")) {
        console.log("🔀 Redirecting to home page")
        return baseUrl
      }
      
      // If it's a relative URL, make it absolute
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // If it's the same origin, allow it
      if (url.startsWith(baseUrl)) return url
      // Default to home page
      return baseUrl
    },
    async jwt({ token, user, account }) {
      if (user) {
        // Get admin emails from environment variables
        const adminEmails = (process.env.ADMIN_EMAILS ?? "")
          .split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean)
        const email = (user.email ?? "").toLowerCase()

        // Ensure user data is preserved
        token.email = user.email
        token.name = user.name
        token.picture = user.image

        // Check if user is admin from environment variable
        if (adminEmails.includes(email)) {
          token.role = 'admin'
        } else {
          // For non-admin users, check blob storage for other roles
          const userId = user.id || token.sub
          if (userId && email) {
            // Check cache first
            const cacheKey = `${userId}:${email}`
            const cached = roleCache.get(cacheKey)
            const now = Date.now()
            
            if (cached && (now - cached.timestamp) < CACHE_TTL) {
              token.role = cached.role
            } else {
              try {
                const blobRole = await getUserRole(userId, email)
                
                // Validate the returned role
                if (VALID_ROLES.includes(blobRole)) {
                  token.role = blobRole
                  // Update cache
                  roleCache.set(cacheKey, { role: blobRole, timestamp: now })
                } else {
                  console.warn(`Invalid role returned from blob storage: ${blobRole}`)
                  token.role = 'viewer'
                }
              } catch (error) {
                console.error('Error fetching user role from blob storage:', error)
                // Don't mutate token.role on failure, keep existing or default to viewer
                if (!token.role) {
                  token.role = 'viewer'
                }
              }
            }
          } else {
            token.role = 'viewer'
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub || ''
        session.user.role = token.role as 'admin' | 'buyer' | 'lawyer' | 'viewer'
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
        
        // NDA status is checked server-side in API endpoints
        session.user.ndaSigned = undefined
        session.user.ndaSignedAt = undefined
      }
      return session
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: AUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === 'development'
})
