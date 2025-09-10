"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { UserRole, hasRole, getRoleDisplayName } from "@/lib/roles"

interface RoleGuardProps {
  children: React.ReactNode
  requiredRole: UserRole
  fallback?: React.ReactNode
}

export function RoleGuard({ children, requiredRole, fallback }: RoleGuardProps) {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && session?.user) {
      const userRole = (session.user as any).role as UserRole || UserRole.GUEST
      if (!hasRole(userRole, requiredRole)) {
        // Redirect to appropriate page based on user role
        if (userRole === UserRole.GUEST) {
          router.push("/")
        } else if (hasRole(userRole, UserRole.VIEWER)) {
          router.push("/dashboard")
        } else {
          router.push("/")
        }
      }
    }
  }, [session, isPending, requiredRole, router])

  if (isPending) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null // Will redirect to login
  }

  const userRole = (session.user as any).role as UserRole || UserRole.GUEST
  if (!hasRole(userRole, requiredRole)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-destructive mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You need {getRoleDisplayName(requiredRole)} privileges to access this page.
          </p>
          <p className="text-sm text-muted-foreground">
            Your current role: {getRoleDisplayName(userRole)}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
