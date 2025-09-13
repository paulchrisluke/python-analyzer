"use client"

import React, { useState, useEffect, createContext, useContext } from "react"

// User type with role information
export interface User {
  email: string
  name: string
  role: 'admin' | 'user'
  isAdmin: boolean
  avatar?: string
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

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = () => {
      try {
        const sessionData = localStorage.getItem('cranberry-auth-session')
        if (sessionData) {
          const parsed = JSON.parse(sessionData)
          // Check if session is still valid (7 days)
          if (parsed.timestamp && Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
            setUser(parsed.user)
          } else {
            localStorage.removeItem('cranberry-auth-session')
          }
        }
      } catch (error) {
        console.error('Error checking session:', error)
        localStorage.removeItem('cranberry-auth-session')
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get admin credentials from environment (in a real app, this would be server-side)
      const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || []
      const adminPasswords = process.env.NEXT_PUBLIC_ADMIN_PASSWORDS?.split(',') || []

      // Find matching admin
      const adminIndex = adminEmails.findIndex(adminEmail => 
        adminEmail.trim().toLowerCase() === email.toLowerCase()
      )

      if (adminIndex === -1) {
        return { success: false, error: 'Invalid email or password' }
      }

      const correctPassword = adminPasswords[adminIndex]?.trim()
      if (!correctPassword || correctPassword !== password) {
        return { success: false, error: 'Invalid email or password' }
      }

      // Create user object with admin role (since only admins can sign in)
      const userData: User = {
        email: email.toLowerCase(),
        name: email.split('@')[0], // Simple name from email
        role: 'admin',
        isAdmin: true,
        avatar: "/avatars/user.jpg" // Default avatar
      }

      // Store session
      const sessionData = {
        user: userData,
        timestamp: Date.now()
      }
      localStorage.setItem('cranberry-auth-session', JSON.stringify(sessionData))
      setUser(userData)

      return { success: true }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  const signOut = () => {
    localStorage.removeItem('cranberry-auth-session')
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
