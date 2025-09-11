"use client"

import { SignedIn, SignedOut, RedirectToSignIn } from "@daveyplate/better-auth-ui"

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        {fallback || <RedirectToSignIn />}
      </SignedOut>
    </>
  )
}
