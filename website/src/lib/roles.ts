// Role-based access control types and utilities

export enum UserRole {
  ADMIN = 'admin',
  BUYER = 'buyer', 
  VIEWER = 'viewer',
  GUEST = 'guest'
}

export enum DocumentAccess {
  PUBLIC = 'public',
  AUTHENTICATED = 'authenticated',
  BUYER_ONLY = 'buyer_only',
  ADMIN_ONLY = 'admin_only'
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

// Role hierarchy - higher roles inherit permissions from lower roles
export const ROLE_HIERARCHY = {
  [UserRole.GUEST]: 0,
  [UserRole.VIEWER]: 1,
  [UserRole.BUYER]: 2,
  [UserRole.ADMIN]: 3
}

// Permission definitions
export const PERMISSIONS = {
  // Document access permissions
  VIEW_PUBLIC_DOCS: 'view_public_docs',
  VIEW_AUTHENTICATED_DOCS: 'view_authenticated_docs',
  VIEW_BUYER_DOCS: 'view_buyer_docs',
  VIEW_ADMIN_DOCS: 'view_admin_docs',
  DOWNLOAD_DOCS: 'download_docs',
  UPLOAD_DOCS: 'upload_docs',
  
  // User management permissions
  VIEW_USERS: 'view_users',
  MANAGE_USERS: 'manage_users',
  VIEW_USER_ACTIVITY: 'view_user_activity',
  
  // Admin permissions
  VIEW_ADMIN_DASHBOARD: 'view_admin_dashboard',
  MANAGE_SYSTEM: 'manage_system',
  VIEW_ANALYTICS: 'view_analytics'
} as const

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.GUEST]: [
    PERMISSIONS.VIEW_PUBLIC_DOCS
  ],
  [UserRole.VIEWER]: [
    PERMISSIONS.VIEW_PUBLIC_DOCS,
    PERMISSIONS.VIEW_AUTHENTICATED_DOCS
  ],
  [UserRole.BUYER]: [
    PERMISSIONS.VIEW_PUBLIC_DOCS,
    PERMISSIONS.VIEW_AUTHENTICATED_DOCS,
    PERMISSIONS.VIEW_BUYER_DOCS,
    PERMISSIONS.DOWNLOAD_DOCS
  ],
  [UserRole.ADMIN]: [
    PERMISSIONS.VIEW_PUBLIC_DOCS,
    PERMISSIONS.VIEW_AUTHENTICATED_DOCS,
    PERMISSIONS.VIEW_BUYER_DOCS,
    PERMISSIONS.VIEW_ADMIN_DOCS,
    PERMISSIONS.DOWNLOAD_DOCS,
    PERMISSIONS.UPLOAD_DOCS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USER_ACTIVITY,
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,
    PERMISSIONS.MANAGE_SYSTEM,
    PERMISSIONS.VIEW_ANALYTICS
  ]
}

// Utility functions
export function hasPermission(userRole: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false
}

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function canAccessDocument(userRole: UserRole, documentAccess: DocumentAccess): boolean {
  switch (documentAccess) {
    case DocumentAccess.PUBLIC:
      return true
    case DocumentAccess.AUTHENTICATED:
      return userRole !== UserRole.GUEST
    case DocumentAccess.BUYER_ONLY:
      return hasRole(userRole, UserRole.BUYER)
    case DocumentAccess.ADMIN_ONLY:
      return userRole === UserRole.ADMIN
    default:
      return false
  }
}

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return 'Administrator'
    case UserRole.BUYER:
      return 'Qualified Buyer'
    case UserRole.VIEWER:
      return 'Viewer'
    case UserRole.GUEST:
      return 'Guest'
    default:
      return 'Unknown'
  }
}

export function getRoleDescription(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return 'Full system access including user management and document administration'
    case UserRole.BUYER:
      return 'Access to due diligence documents and business information'
    case UserRole.VIEWER:
      return 'Read-only access to authenticated documents'
    case UserRole.GUEST:
      return 'Public access only'
    default:
      return 'No access'
  }
}

// Route protection helpers
export function getProtectedRoutes(): Record<string, UserRole> {
  return {
    '/dashboard': UserRole.VIEWER,
    '/docs': UserRole.VIEWER,
    '/admin': UserRole.ADMIN,
    '/admin/users': UserRole.ADMIN,
    '/admin/analytics': UserRole.ADMIN,
    '/admin/documents': UserRole.ADMIN
  }
}

export function canAccessRoute(userRole: UserRole, pathname: string): boolean {
  const protectedRoutes = getProtectedRoutes()
  
  // Check exact match first
  if (protectedRoutes[pathname]) {
    return hasRole(userRole, protectedRoutes[pathname])
  }
  
  // Check prefix matches (e.g., /admin/users should match /admin)
  for (const [route, requiredRole] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route + '/')) {
      return hasRole(userRole, requiredRole)
    }
  }
  
  return true // Allow access to non-protected routes
}


