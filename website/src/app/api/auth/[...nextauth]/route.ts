import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Admin users configuration
        const adminUsers = [
          {
            email: 'admin@cranberryhearing.com',
            password: 'admin123!', // In production, use hashed passwords
            role: 'admin' as const,
            name: 'Admin User'
          },
          {
            email: 'admin2@example.com',
            password: 'admin123!',
            role: 'admin' as const, 
            name: 'Admin User 2'
          }
        ]

        // Buyer users configuration
        const buyerUsers = [
          {
            email: 'buyer@example.com',
            password: 'buyer123!',
            role: 'buyer' as const,
            name: 'Buyer User'
          },
          {
            email: 'investor@example.com',
            password: 'buyer123!',
            role: 'buyer' as const,
            name: 'Investor User'
          }
        ]

        // Combine all users
        const allUsers = [...adminUsers, ...buyerUsers]

        // Find user by email
        const user = allUsers.find(u => u.email === credentials.email)

        if (!user) {
          return null
        }

        // For development, allow any password if DEV_AUTH_ROLE is set
        if (process.env.DEV_AUTH_ROLE && process.env.NODE_ENV !== 'production') {
          return {
            id: user.email,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }

        // In production, verify password (for now, simple string comparison)
        // TODO: Implement proper password hashing
        if (user.password === credentials.password) {
          return {
            id: user.email,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }

        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub || ''
        session.user.role = token.role
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
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development'
})

export { handler as GET, handler as POST }
