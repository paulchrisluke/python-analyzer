import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: 'admin' | 'buyer' | 'lawyer' | 'viewer'
      ndaSigned?: boolean
      ndaSignedAt?: string
    }
  }

  interface User {
    role: 'admin' | 'buyer' | 'lawyer' | 'viewer'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'admin' | 'buyer' | 'lawyer' | 'viewer'
  }
}
