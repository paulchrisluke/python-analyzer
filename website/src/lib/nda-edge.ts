/**
 * Edge-safe NDA utilities
 * 
 * This module contains NDA utilities that are compatible with Edge runtime
 * and can be used in middleware and other edge contexts.
 * 
 * For crypto-dependent functions, use the server-only nda.ts module instead.
 */

import type { NDADocumentConfig } from '@/types/nda';

// NDA Configuration (edge-safe)
export const NDA_CONFIG: NDADocumentConfig = {
  version: '1.0',
  effectiveDate: '2025-01-15',
  title: 'Non-Disclosure Agreement',
  description: 'Confidentiality agreement for business acquisition evaluation',
  requiredRoles: ['buyer', 'lawyer', 'viewer'],
  exemptRoles: ['admin']
};

// Phases that require NDA signature (edge-safe)
export const NDA_REQUIRED_PHASES = ['p2b', 'p3a', 'p3b', 'p4', 'p5', 'legal'];


/**
 * Check if user role requires NDA signature (edge-safe)
 */
export function requiresNDA(userRole: string): boolean {
  return NDA_CONFIG.requiredRoles.includes(userRole);
}

/**
 * Check if user role is exempt from NDA requirements (edge-safe)
 */
export function isNDAExempt(userRole: string): boolean {
  return NDA_CONFIG.exemptRoles.includes(userRole);
}

/**
 * Check if a document phase requires NDA (edge-safe)
 */
export function phaseRequiresNDA(phase: string): boolean {
  return NDA_REQUIRED_PHASES.includes(phase);
}

/**
 * Get client IP address from request (edge-safe)
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return 'unknown';
}

/**
 * Sanitize user agent string (edge-safe)
 */
export function sanitizeUserAgent(userAgent: string): string {
  return userAgent.substring(0, 500); // Limit length
}

/**
 * Log NDA activity for audit trail (edge-safe)
 */
export function logNDAActivity(
  userId: string,
  action: 'sign' | 'view' | 'access_denied',
  details?: Record<string, any>
): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    userId,
    action,
    details: details || {}
  };

  // In production, this should be sent to a proper logging service
  console.info('NDA_ACTIVITY:', JSON.stringify(logEntry));
}
