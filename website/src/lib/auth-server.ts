import { auth } from '@/../auth'
import { redirect } from 'next/navigation'

/**
 * Server-side authentication utility for checking user roles
 * This should be used in server components to enforce auth before data loading
 */

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'buyer' | 'viewer'
}

/**
 * Get the current user from the session on the server side
 * Returns null if not authenticated
 */
export async function getServerUser(): Promise<AuthUser | null> {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return null
    }

    return {
      id: session.user.id || '',
      email: session.user.email || '',
      name: session.user.name || '',
      role: session.user.role as 'admin' | 'buyer' | 'viewer'
    }
  } catch (error) {
    console.error('Error getting server user:', error)
    return null
  }
}

/**
 * Require admin role on the server side
 * Redirects to login if not authenticated, or unauthorized if not admin
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await getServerUser()
  
  if (!user) {
    redirect('/login')
  }
  
  if (user.role !== 'admin') {
    redirect('/unauthorized')
  }
  
  return user
}

/**
 * Require buyer role on the server side
 * Redirects to login if not authenticated, or unauthorized if not buyer
 */
export async function requireBuyer(): Promise<AuthUser> {
  const user = await getServerUser()
  
  if (!user) {
    redirect('/login')
  }
  
  if (user.role !== 'buyer') {
    redirect('/unauthorized')
  }
  
  return user
}

/**
 * Require either admin or buyer role on the server side
 * Redirects to login if not authenticated, or unauthorized if neither role
 */
export async function requireAdminOrBuyer(): Promise<AuthUser> {
  const user = await getServerUser()
  
  if (!user) {
    redirect('/login')
  }
  
  if (user.role !== 'admin' && user.role !== 'buyer') {
    redirect('/unauthorized')
  }
  
  return user
}
