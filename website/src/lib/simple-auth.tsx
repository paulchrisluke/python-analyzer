"use client"

import React, { useState, useEffect, createContext, useContext } from "react"

// User type with role information
export interface User {
  email: string
  name: string
  role: 'admin' | 'buyer' | 'user'
  isAdmin: boolean
  isBuyer: boolean
  avatar?: string
}

// Session data type - only store minimal authoritative fields (deprecated - using HttpOnly cookies now)
interface SessionData {
  email: string
  timestamp: number
}

// Helper functions outside component for security
const getAdminEmails = (): string[] => {
  return process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || []
}

const getBuyerEmails = (): string[] => {
  return process.env.NEXT_PUBLIC_BUYER_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || []
}


// Infer role from environment variables - never trust client data
const inferRoleFromEnv = (email: string): 'admin' | 'buyer' | null => {
  const normalizedEmail = email.toLowerCase().trim()
  const adminEmails = getAdminEmails()
  const buyerEmails = getBuyerEmails()
  
  if (adminEmails.includes(normalizedEmail)) {
    return 'admin'
  }
  if (buyerEmails.includes(normalizedEmail)) {
    return 'buyer'
  }
  return null
}

// Create user object with proper role flags - never trust stored role data
const makeUser = (email: string, role: 'admin' | 'buyer'): User => {
  const normalizedEmail = email.toLowerCase().trim()
  return {
    email: normalizedEmail,
    name: normalizedEmail.split('@')[0],
    role,
    isAdmin: role === 'admin',
    isBuyer: role === 'buyer',
    avatar: "/avatars/user.jpg"
  }
}

// Auth context type
interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => void
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount using server-side validation
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include', // Include HttpOnly cookies
        })

        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            // Server has validated the session and returned user data
            setUser(data.user)
          }
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Use the secure API route for authentication
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include HttpOnly cookies
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Authentication successful - the server has set an HttpOnly cookie
        // Now fetch the user data from the session endpoint
        const sessionResponse = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
        })

        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json()
          if (sessionData.user) {
            setUser(sessionData.user)
            return { success: true }
          }
        }
        
        return { success: false, error: 'Session creation failed' }
      } else {
        // Authentication failed
        return { success: false, error: data.error || 'Invalid email or password' }
      }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  const signOut = () => {
    // Clear the HttpOnly cookie by calling a logout endpoint
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(error => console.error('Error during logout:', error))
    
    // Clear local state immediately
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for session (compatible with existing code)
export function useSession() {
  const { user, isLoading } = useAuth()
  return {
    data: user ? { user } : null,
    isPending: isLoading,
    error: null
  }
}
