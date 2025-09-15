import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Get admin and buyer emails from environment variables (Vercel secrets)
        const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || []
        const buyerEmails = process.env.BUYER_EMAILS?.split(',').map(email => email.trim()) || []
        
        if (adminEmails.includes(user.email || '')) {
          token.role = 'admin'
        } else if (buyerEmails.includes(user.email || '')) {
          token.role = 'buyer'
        } else {
          token.role = 'viewer'
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub || ''
        session.user.role = token.role as 'admin' | 'buyer' | 'viewer'
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET
})
