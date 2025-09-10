import { describe, it, expect } from 'vitest'
import { 
  canAccessDocument, 
  canAccessRoute, 
  UserRole, 
  DocumentAccess,
  hasPermission,
  hasRole,
  getRoleDisplayName,
  getRoleDescription,
  getProtectedRoutes,
  PERMISSIONS
} from '../roles'

describe('canAccessDocument', () => {
  // Test matrix for all DocumentAccess values across all UserRole values
  const testCases = [
    // PUBLIC access - should be true for all roles
    { userRole: UserRole.GUEST, documentAccess: DocumentAccess.PUBLIC, expected: true },
    { userRole: UserRole.VIEWER, documentAccess: DocumentAccess.PUBLIC, expected: true },
    { userRole: UserRole.BUYER, documentAccess: DocumentAccess.PUBLIC, expected: true },
    { userRole: UserRole.ADMIN, documentAccess: DocumentAccess.PUBLIC, expected: true },
    
    // AUTHENTICATED access - should be true for all except GUEST
    { userRole: UserRole.GUEST, documentAccess: DocumentAccess.AUTHENTICATED, expected: false },
    { userRole: UserRole.VIEWER, documentAccess: DocumentAccess.AUTHENTICATED, expected: true },
    { userRole: UserRole.BUYER, documentAccess: DocumentAccess.AUTHENTICATED, expected: true },
    { userRole: UserRole.ADMIN, documentAccess: DocumentAccess.AUTHENTICATED, expected: true },
    
    // BUYER_ONLY access - should be true for BUYER and ADMIN only
    { userRole: UserRole.GUEST, documentAccess: DocumentAccess.BUYER_ONLY, expected: false },
    { userRole: UserRole.VIEWER, documentAccess: DocumentAccess.BUYER_ONLY, expected: false },
    { userRole: UserRole.BUYER, documentAccess: DocumentAccess.BUYER_ONLY, expected: true },
    { userRole: UserRole.ADMIN, documentAccess: DocumentAccess.BUYER_ONLY, expected: true },
    
    // ADMIN_ONLY access - should be true for ADMIN only
    { userRole: UserRole.GUEST, documentAccess: DocumentAccess.ADMIN_ONLY, expected: false },
    { userRole: UserRole.VIEWER, documentAccess: DocumentAccess.ADMIN_ONLY, expected: false },
    { userRole: UserRole.BUYER, documentAccess: DocumentAccess.ADMIN_ONLY, expected: false },
    { userRole: UserRole.ADMIN, documentAccess: DocumentAccess.ADMIN_ONLY, expected: true },
  ]

  testCases.forEach(({ userRole, documentAccess, expected }) => {
    it(`should return ${expected} for ${userRole} accessing ${documentAccess}`, () => {
      expect(canAccessDocument(userRole, documentAccess)).toBe(expected)
    })
  })

  // Test unknown/invalid DocumentAccess value
  it('should return false for unknown DocumentAccess value', () => {
    const unknownAccess = 'unknown_access' as DocumentAccess
    expect(canAccessDocument(UserRole.ADMIN, unknownAccess)).toBe(false)
  })

  // Test with invalid UserRole (edge case)
  it('should handle invalid UserRole gracefully', () => {
    const invalidRole = 'invalid_role' as UserRole
    expect(canAccessDocument(invalidRole, DocumentAccess.PUBLIC)).toBe(false)
  })
})

describe('canAccessRoute', () => {
  const protectedRoutes = getProtectedRoutes()

  describe('exact route matches', () => {
    it('should allow access to protected routes based on role hierarchy', () => {
      // Dashboard requires VIEWER role
      expect(canAccessRoute(UserRole.GUEST, '/dashboard')).toBe(false)
      expect(canAccessRoute(UserRole.VIEWER, '/dashboard')).toBe(true)
      expect(canAccessRoute(UserRole.BUYER, '/dashboard')).toBe(true)
      expect(canAccessRoute(UserRole.ADMIN, '/dashboard')).toBe(true)

      // Admin routes require ADMIN role
      expect(canAccessRoute(UserRole.GUEST, '/admin')).toBe(false)
      expect(canAccessRoute(UserRole.VIEWER, '/admin')).toBe(false)
      expect(canAccessRoute(UserRole.BUYER, '/admin')).toBe(false)
      expect(canAccessRoute(UserRole.ADMIN, '/admin')).toBe(true)
    })

    it('should allow access to all protected routes for admin', () => {
      Object.keys(protectedRoutes).forEach(route => {
        expect(canAccessRoute(UserRole.ADMIN, route)).toBe(true)
      })
    })
  })

  describe('prefix matches', () => {
    it('should handle subpaths correctly', () => {
      // /admin/users should match /admin prefix
      expect(canAccessRoute(UserRole.GUEST, '/admin/users')).toBe(false)
      expect(canAccessRoute(UserRole.VIEWER, '/admin/users')).toBe(false)
      expect(canAccessRoute(UserRole.BUYER, '/admin/users')).toBe(false)
      expect(canAccessRoute(UserRole.ADMIN, '/admin/users')).toBe(true)

      // /admin/analytics should match /admin prefix
      expect(canAccessRoute(UserRole.ADMIN, '/admin/analytics')).toBe(true)
      expect(canAccessRoute(UserRole.BUYER, '/admin/analytics')).toBe(false)
    })

    it('should handle nested subpaths', () => {
      expect(canAccessRoute(UserRole.ADMIN, '/admin/users/create')).toBe(true)
      expect(canAccessRoute(UserRole.ADMIN, '/admin/analytics/reports')).toBe(true)
      expect(canAccessRoute(UserRole.BUYER, '/admin/users/create')).toBe(false)
    })
  })

  describe('non-protected routes', () => {
    it('should allow access to non-protected routes for all roles', () => {
      const nonProtectedRoutes = [
        '/',
        '/login',
        '/about',
        '/contact',
        '/public-docs',
        '/some/other/path'
      ]

      nonProtectedRoutes.forEach(route => {
        expect(canAccessRoute(UserRole.GUEST, route)).toBe(true)
        expect(canAccessRoute(UserRole.VIEWER, route)).toBe(true)
        expect(canAccessRoute(UserRole.BUYER, route)).toBe(true)
        expect(canAccessRoute(UserRole.ADMIN, route)).toBe(true)
      })
    })
  })

  describe('edge cases', () => {
    it('should handle trailing slashes', () => {
      expect(canAccessRoute(UserRole.ADMIN, '/admin/')).toBe(true)
      expect(canAccessRoute(UserRole.VIEWER, '/dashboard/')).toBe(true)
    })

    it('should handle query parameters and hash fragments', () => {
      expect(canAccessRoute(UserRole.ADMIN, '/admin?tab=users')).toBe(true)
      expect(canAccessRoute(UserRole.ADMIN, '/admin#section')).toBe(true)
      expect(canAccessRoute(UserRole.VIEWER, '/dashboard?view=grid')).toBe(true)
    })

    it('should handle empty pathname', () => {
      expect(canAccessRoute(UserRole.GUEST, '')).toBe(true)
      expect(canAccessRoute(UserRole.ADMIN, '')).toBe(true)
    })
  })
})

describe('hasRole', () => {
  it('should correctly compare role hierarchy', () => {
    // Same role
    expect(hasRole(UserRole.ADMIN, UserRole.ADMIN)).toBe(true)
    expect(hasRole(UserRole.BUYER, UserRole.BUYER)).toBe(true)
    expect(hasRole(UserRole.VIEWER, UserRole.VIEWER)).toBe(true)
    expect(hasRole(UserRole.GUEST, UserRole.GUEST)).toBe(true)

    // Higher role has access to lower role requirements
    expect(hasRole(UserRole.ADMIN, UserRole.BUYER)).toBe(true)
    expect(hasRole(UserRole.ADMIN, UserRole.VIEWER)).toBe(true)
    expect(hasRole(UserRole.ADMIN, UserRole.GUEST)).toBe(true)
    expect(hasRole(UserRole.BUYER, UserRole.VIEWER)).toBe(true)
    expect(hasRole(UserRole.BUYER, UserRole.GUEST)).toBe(true)
    expect(hasRole(UserRole.VIEWER, UserRole.GUEST)).toBe(true)

    // Lower role does not have access to higher role requirements
    expect(hasRole(UserRole.GUEST, UserRole.VIEWER)).toBe(false)
    expect(hasRole(UserRole.GUEST, UserRole.BUYER)).toBe(false)
    expect(hasRole(UserRole.GUEST, UserRole.ADMIN)).toBe(false)
    expect(hasRole(UserRole.VIEWER, UserRole.BUYER)).toBe(false)
    expect(hasRole(UserRole.VIEWER, UserRole.ADMIN)).toBe(false)
    expect(hasRole(UserRole.BUYER, UserRole.ADMIN)).toBe(false)
  })
})

describe('hasPermission', () => {
  it('should return correct permissions for each role', () => {
    // GUEST permissions
    expect(hasPermission(UserRole.GUEST, PERMISSIONS.VIEW_PUBLIC_DOCS)).toBe(true)
    expect(hasPermission(UserRole.GUEST, PERMISSIONS.VIEW_AUTHENTICATED_DOCS)).toBe(false)
    expect(hasPermission(UserRole.GUEST, PERMISSIONS.MANAGE_USERS)).toBe(false)

    // VIEWER permissions
    expect(hasPermission(UserRole.VIEWER, PERMISSIONS.VIEW_PUBLIC_DOCS)).toBe(true)
    expect(hasPermission(UserRole.VIEWER, PERMISSIONS.VIEW_AUTHENTICATED_DOCS)).toBe(true)
    expect(hasPermission(UserRole.VIEWER, PERMISSIONS.VIEW_BUYER_DOCS)).toBe(false)

    // BUYER permissions
    expect(hasPermission(UserRole.BUYER, PERMISSIONS.VIEW_PUBLIC_DOCS)).toBe(true)
    expect(hasPermission(UserRole.BUYER, PERMISSIONS.VIEW_AUTHENTICATED_DOCS)).toBe(true)
    expect(hasPermission(UserRole.BUYER, PERMISSIONS.VIEW_BUYER_DOCS)).toBe(true)
    expect(hasPermission(UserRole.BUYER, PERMISSIONS.DOWNLOAD_DOCS)).toBe(true)
    expect(hasPermission(UserRole.BUYER, PERMISSIONS.MANAGE_USERS)).toBe(false)

    // ADMIN permissions
    expect(hasPermission(UserRole.ADMIN, PERMISSIONS.VIEW_PUBLIC_DOCS)).toBe(true)
    expect(hasPermission(UserRole.ADMIN, PERMISSIONS.MANAGE_USERS)).toBe(true)
    expect(hasPermission(UserRole.ADMIN, PERMISSIONS.VIEW_ADMIN_DASHBOARD)).toBe(true)
    expect(hasPermission(UserRole.ADMIN, PERMISSIONS.MANAGE_SYSTEM)).toBe(true)
  })

  it('should return false for unknown permissions', () => {
    expect(hasPermission(UserRole.ADMIN, 'unknown_permission')).toBe(false)
  })
})

describe('getRoleDisplayName', () => {
  it('should return correct display names for all roles', () => {
    expect(getRoleDisplayName(UserRole.ADMIN)).toBe('Administrator')
    expect(getRoleDisplayName(UserRole.BUYER)).toBe('Qualified Buyer')
    expect(getRoleDisplayName(UserRole.VIEWER)).toBe('Viewer')
    expect(getRoleDisplayName(UserRole.GUEST)).toBe('Guest')
  })

  it('should return "Unknown" for invalid role', () => {
    const invalidRole = 'invalid_role' as UserRole
    expect(getRoleDisplayName(invalidRole)).toBe('Unknown')
  })
})

describe('getRoleDescription', () => {
  it('should return correct descriptions for all roles', () => {
    expect(getRoleDescription(UserRole.ADMIN)).toBe('Full system access including user management and document administration')
    expect(getRoleDescription(UserRole.BUYER)).toBe('Access to due diligence documents and business information')
    expect(getRoleDescription(UserRole.VIEWER)).toBe('Read-only access to authenticated documents')
    expect(getRoleDescription(UserRole.GUEST)).toBe('Public access only')
  })

  it('should return "No access" for invalid role', () => {
    const invalidRole = 'invalid_role' as UserRole
    expect(getRoleDescription(invalidRole)).toBe('No access')
  })
})

describe('getProtectedRoutes', () => {
  it('should return expected protected routes', () => {
    const routes = getProtectedRoutes()
    
    expect(routes['/dashboard']).toBe(UserRole.VIEWER)
    expect(routes['/docs']).toBe(UserRole.VIEWER)
    expect(routes['/admin']).toBe(UserRole.ADMIN)
    expect(routes['/admin/users']).toBe(UserRole.ADMIN)
    expect(routes['/admin/analytics']).toBe(UserRole.ADMIN)
    expect(routes['/admin/documents']).toBe(UserRole.ADMIN)
  })

  it('should return a consistent object', () => {
    const routes1 = getProtectedRoutes()
    const routes2 = getProtectedRoutes()
    expect(routes1).toEqual(routes2)
  })
})
