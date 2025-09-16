/**
 * Phase-based access control mapping for document security
 * Based on audiology clinic sale best practices
 */

export interface PhaseConfig {
  name: string;
  description: string;
  access: string[];
  blobAccess: 'private' | 'public';
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
}

export const PHASE_MAPPING: Record<string, PhaseConfig> = {
  p1: {
    name: 'Initial Interest',
    description: 'Company overview, practice stats, basic financials',
    access: ['buyer', 'admin'],
    blobAccess: 'private',
    securityLevel: 'medium'
  },
  p2a: {
    name: 'Pre-Qualification', 
    description: 'High-level financial summaries, staff overview',
    access: ['buyer', 'admin'],
    blobAccess: 'private',
    securityLevel: 'medium'
  },
  p2b: {
    name: 'Post-NDA',
    description: 'Detailed financials, lease summaries, ownership docs',
    access: ['buyer', 'admin'],
    blobAccess: 'private',
    securityLevel: 'high'
  },
  p3a: {
    name: 'Due Diligence Start',
    description: 'Full financials, contracts, licenses',
    access: ['buyer', 'admin'],
    blobAccess: 'private',
    securityLevel: 'high'
  },
  p3b: {
    name: 'Advanced Due Diligence',
    description: 'Staff contracts, patient demographics, equipment',
    access: ['buyer', 'admin'],
    blobAccess: 'private',
    securityLevel: 'critical'
  },
  p4: {
    name: 'Negotiation',
    description: 'Draft agreements, transition plans',
    access: ['buyer', 'admin'],
    blobAccess: 'private',
    securityLevel: 'critical'
  },
  p5: {
    name: 'Closing',
    description: 'Final agreements, closing docs',
    access: ['buyer', 'admin'],
    blobAccess: 'private',
    securityLevel: 'critical'
  },
  legal: {
    name: 'Legal Review',
    description: 'All legal documents, contracts, compliance',
    access: ['lawyer', 'admin'],
    blobAccess: 'private',
    securityLevel: 'critical'
  }
};

/**
 * Get phase configuration by phase key
 */
export function getPhaseConfig(phase: string): PhaseConfig | null {
  return PHASE_MAPPING[phase] || null;
}

/**
 * Get default visibility for a phase
 */
export function getPhaseVisibility(phase: string): string[] {
  const config = getPhaseConfig(phase);
  return config?.access || ['admin'];
}

/**
 * Get blob access level for a phase
 * Note: Vercel Blob only supports 'public' access, so this always returns 'public'
 * Private access is handled through authentication and authorization logic
 */
export function getPhaseBlobAccess(phase: string): 'public' {
  // Vercel Blob only supports public access
  // Private access is handled through authentication and authorization
  return 'public';
}

/**
 * Get security level for a phase
 */
export function getPhaseSecurityLevel(phase: string): 'low' | 'medium' | 'high' | 'critical' {
  const config = getPhaseConfig(phase);
  return config?.securityLevel || 'high'; // Default to high for security
}

/**
 * Check if a user role has access to a phase
 */
export function hasPhaseAccess(phase: string, userRole: string): boolean {
  const config = getPhaseConfig(phase);
  if (!config) return false;
  
  return config.access.includes(userRole) || userRole === 'admin';
}

/**
 * Get all allowed phases
 */
export function getAllowedPhases(): string[] {
  return Object.keys(PHASE_MAPPING);
}

/**
 * Get phases accessible by a user role
 */
export function getPhasesForRole(userRole: string): string[] {
  return Object.entries(PHASE_MAPPING)
    .filter(([_, config]) => config.access.includes(userRole) || userRole === 'admin')
    .map(([phase, _]) => phase);
}
