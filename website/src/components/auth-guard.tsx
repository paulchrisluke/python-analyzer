"use client"

import { SignedIn, RedirectToSignIn } from "@daveyplate/better-auth-ui"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  return (
    <>
      <RedirectToSignIn />
      <SignedIn>
        {children}
      </SignedIn>
    </>
  )
}
