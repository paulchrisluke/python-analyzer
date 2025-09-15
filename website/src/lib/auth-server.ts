import { getToken } from 'next-auth/jwt'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Server-side authentication utility for checking user roles
 * This should be used in server components to enforce auth before data loading
 */

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'buyer'
}

/**
 * Get the current user from the JWT token on the server side
 * Returns null if not authenticated
 */
export async function getServerUser(): Promise<AuthUser | null> {
  try {
    const headersList = await headers()
    const cookieHeader = headersList.get('cookie')
    
    if (!cookieHeader) {
      return null
    }

    // Create a mock request object for getToken
    const token = await getToken({ 
      req: {
        headers: {
          cookie: cookieHeader
        }
      } as any,
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token) {
      return null
    }

    return {
      id: token.sub || '',
      email: token.email || '',
      name: token.name || '',
      role: token.role as 'admin' | 'buyer'
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
