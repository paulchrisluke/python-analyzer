"use client"

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface NextAuthProviderProps {
  children: ReactNode
}

export function NextAuthProvider({ children }: NextAuthProviderProps) {
  return (
    <SessionProvider
      // Re-fetch session every 5 minutes
      refetchInterval={5 * 60}
      // Re-fetch session when window regains focus
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  )
}
