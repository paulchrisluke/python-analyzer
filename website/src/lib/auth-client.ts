"use client"

import { createAuthClient } from "better-auth/react"

// Create auth client instance
const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:8787",
})

// Session hook that returns session data and loading state
export function useSession() {
  const { data: session, isPending, error } = authClient.useSession()
  
  return {
    data: session,
    isPending,
    error
  }
}

// Sign in function with email/password
export const signIn = {
  email: async ({ email, password }: { email: string; password: string }) => {
    try {
      const result = await authClient.signIn.email({
        email,
        password,
      })
      return result
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : "Sign in failed"
        }
      }
    }
  }
}

// Sign out function
export async function signOut() {
  try {
    await authClient.signOut()
  } catch (error) {
    console.error("Sign out error:", error)
  }
}

// Sign up function with email/password
export const signUp = {
  email: async ({ name, email, password }: { name: string; email: string; password: string }) => {
    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
      })
      return result
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : "Sign up failed"
        }
      }
    }
  }
}