"use client"

import { SignedIn, SignedOut, RedirectToSignIn } from "@daveyplate/better-auth-ui"
import { useSession } from "@/lib/auth-client"

interface AdminGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { data: session } = useSession()

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        {session?.user?.role === "admin" ? (
          children
        ) : (
          fallback || (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
                <p className="text-muted-foreground mb-4">
                  You don't have permission to access this page.
                </p>
                <p className="text-sm text-muted-foreground">
                  This page requires admin privileges.
                </p>
              </div>
            </div>
          )
        )}
      </SignedIn>
    </>
  )
}
