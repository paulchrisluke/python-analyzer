"use client"

import { useSession } from '@/lib/simple-auth'
import type { User } from '@/lib/simple-auth'

// Typed auth state interface
export interface AuthState {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
  isAuthenticated: boolean
}

// Narrowed user type for admin users
export type AdminUser = User & {
  role: 'admin'
  isAdmin: true
}

/**
 * Client-side authentication hook for conditional rendering
 * Provides admin status and user information for components
 */
export function useAuth(): AuthState {
  const { data: session, isPending } = useSession()
  
  const user = session?.user || null
  const isAuthenticated = !!user
  const isAdmin = user?.isAdmin === true && user?.role === 'admin'
  
  return {
    user,
    isAdmin,
    isLoading: isPending,
    isAuthenticated
  }
}

/**
 * Hook specifically for admin-only features
 * Returns true only if user is authenticated admin
 */
export function useAdminAuth() {
  const { isAdmin, isLoading, user } = useAuth()
  
  return {
    isAdmin,
    isLoading,
    user: user as AdminUser | null,
    canAccessAdminFeatures: isAdmin && !isLoading
  }
}
