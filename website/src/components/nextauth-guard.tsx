"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'

interface AuthGuardProps {
  children: ReactNode
  allowedRoles?: ('admin' | 'buyer' | 'viewer')[]
  fallback?: ReactNode
}

export function NextAuthGuard({ children, allowedRoles, fallback }: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      // Not authenticated, redirect to login
      router.push('/login')
      return
    }

    if (allowedRoles && !allowedRoles.includes(session.user.role)) {
      // Authenticated but wrong role, redirect to unauthorized
      router.push('/unauthorized')
      return
    }
  }, [session, status, allowedRoles, router])

  if (status === 'loading') {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to login
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return null // Will redirect to unauthorized
  }

  return <>{children}</>
}

// Convenience components
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <NextAuthGuard allowedRoles={['admin']} fallback={fallback}>
      {children}
    </NextAuthGuard>
  )
}

export function BuyerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <NextAuthGuard allowedRoles={['buyer']} fallback={fallback}>
      {children}
    </NextAuthGuard>
  )
}

export function AdminOrBuyer({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <NextAuthGuard allowedRoles={['admin', 'buyer']} fallback={fallback}>
      {children}
    </NextAuthGuard>
  )
}
