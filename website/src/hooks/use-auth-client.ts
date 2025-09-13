"use client"

import { useSession } from '@/lib/simple-auth'

/**
 * Client-side authentication hook for conditional rendering
 * Provides admin status and user information for components
 */
export function useAuth() {
  const { data: session, isPending } = useSession()
  
  return {
    user: session?.user || null,
    isAdmin: !!session?.user,
    isLoading: isPending,
    isAuthenticated: !!session?.user
  }
}

/**
 * Hook specifically for admin-only features
 * Returns true only if user is authenticated admin
 */
export function useAdminAuth() {
  const { isAdmin, isLoading } = useAuth()
  
  return {
    isAdmin,
    isLoading,
    canAccessAdminFeatures: isAdmin && !isLoading
  }
}
