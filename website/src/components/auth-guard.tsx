"use client"

import { SignedIn, SignedOut, RedirectToSignIn } from "@daveyplate/better-auth-ui"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        {children}
      </SignedIn>
    </>
  )
}
