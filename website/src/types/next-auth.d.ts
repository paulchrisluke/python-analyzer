import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: 'admin' | 'buyer'
    }
  }

  interface User {
    role: 'admin' | 'buyer'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'admin' | 'buyer'
  }
}
