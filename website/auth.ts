import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

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
        // Get admin emails from environment variables (only for admin role)
        const adminEmails = (process.env.ADMIN_EMAILS ?? "")
          .split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean)
        const email = (user.email ?? "").toLowerCase()

        // Only admin role is determined by email - all others start as viewer
        if (adminEmails.includes(email)) {
          token.role = 'admin'
        } else {
          token.role = 'viewer'
        }
        
        // Ensure user data is preserved
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      
      // Check user role from Vercel Blob storage
      if (token.sub) {
        try {
          const { getUserRole } = await import('@/lib/nda-storage')
          const userRole = await getUserRole(token.sub, token.email as string)
          token.role = userRole
        } catch (error) {
          console.error('Error getting user role from blob:', error)
          // Keep the original role if there's an error
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
