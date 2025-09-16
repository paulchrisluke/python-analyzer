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
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        // Get admin and buyer emails from environment variables (Vercel secrets)
        const adminEmails = (process.env.ADMIN_EMAILS ?? "")
          .split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean)
        const buyerEmails = (process.env.BUYER_EMAILS ?? "")
          .split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean)
        const email = (user.email ?? "").toLowerCase()

        if (adminEmails.includes(email)) {
          token.role = 'admin'
        } else if (buyerEmails.includes(email)) {
          token.role = 'buyer'
        } else {
          token.role = 'viewer'
        }
        
        // Ensure user data is preserved
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub || ''
        session.user.role = token.role as 'admin' | 'buyer' | 'viewer'
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
      }
      return session
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: AUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === 'development'
})
