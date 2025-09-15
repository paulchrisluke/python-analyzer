import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const adminEmails = [
          'admin@cranberryhearing.com',
          'paul@cranberryhearing.com'
        ]
        const buyerEmails = [
          'buyer@example.com',
          'investor@example.com'
        ]
        
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
  secret: process.env.AUTH_SECRET
})

export { handler as GET, handler as POST }