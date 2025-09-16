/**
 * NDA (Non-Disclosure Agreement) utilities
 */

import * as crypto from 'crypto';
import { NDASignature, NDAStatus, NDADocumentConfig, NDARateLimit } from '@/types/nda';

// NDA Configuration
export const NDA_CONFIG: NDADocumentConfig = {
  version: '1.0',
  effectiveDate: '2025-01-15',
  title: 'Non-Disclosure Agreement',
  description: 'Confidentiality agreement for business acquisition evaluation',
  requiredRoles: ['buyer', 'lawyer', 'viewer'],
  exemptRoles: ['admin']
};

// Phases that require NDA signature
export const NDA_REQUIRED_PHASES = ['p2b', 'p3a', 'p3b', 'p4', 'p5', 'legal'];

// Rate limiting configuration
export const NDA_RATE_LIMIT = {
  MAX_ATTEMPTS: 5,
  WINDOW_MS: 60 * 60 * 1000, // 1 hour
  STORAGE_KEY_PREFIX: 'nda_rate_limit_'
};

/**
 * Generate a unique signature ID
 */
export function generateSignatureId(): string {
  return `nda_sig_${crypto.randomBytes(16).toString('hex')}`;
}

/**
 * Generate hash of NDA document content for integrity verification
 */
export function generateDocumentHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Validate signature data format
 */
export function validateSignatureData(signatureData: string): { valid: boolean; error?: string } {
  if (!signatureData || typeof signatureData !== 'string') {
    return { valid: false, error: 'Signature data is required' };
  }

  // Check if it's valid base64
  try {
    const decoded = Buffer.from(signatureData, 'base64');
    if (decoded.length === 0) {
      return { valid: false, error: 'Invalid signature data' };
    }
  } catch (error) {
    return { valid: false, error: 'Invalid base64 signature data' };
  }

  return { valid: true };
}

/**
 * Check if user role requires NDA signature
 */
export function requiresNDA(userRole: string): boolean {
  return NDA_CONFIG.requiredRoles.includes(userRole);
}

/**
 * Check if user role is exempt from NDA requirements
 */
export function isNDAExempt(userRole: string): boolean {
  return NDA_CONFIG.exemptRoles.includes(userRole);
}

/**
 * Check if a document phase requires NDA
 */
export function phaseRequiresNDA(phase: string): boolean {
  return NDA_REQUIRED_PHASES.includes(phase);
}

/**
 * Create NDA status object
 */
export function createNDAStatus(signature?: NDASignature | null): NDAStatus {
  if (!signature) {
    return {
      isSigned: false,
      canAccessProtectedContent: false
    };
  }

  return {
    isSigned: true,
    signedAt: signature.signedAt,
    version: signature.ndaVersion,
    canAccessProtectedContent: true,
    signatureId: signature.id
  };
}

/**
 * Validate NDA signature integrity
 */
export function validateSignatureIntegrity(
  signature: NDASignature, 
  documentHash: string
): { valid: boolean; error?: string } {
  // Check if signature version matches current NDA version
  if (signature.ndaVersion !== NDA_CONFIG.version) {
    return { valid: false, error: 'NDA version mismatch' };
  }

  // Check if document hash matches
  if (signature.documentHash !== documentHash) {
    return { valid: false, error: 'Document integrity check failed' };
  }

  // Check if signature is not too old (optional - could add expiration)
  const signedDate = new Date(signature.signedAt);
  const now = new Date();
  const daysSinceSigned = (now.getTime() - signedDate.getTime()) / (1000 * 60 * 60 * 24);
  
  // NDA is valid for 2 years
  if (daysSinceSigned > 730) {
    return { valid: false, error: 'NDA signature has expired' };
  }

  return { valid: true };
}

/**
 * Rate limiting for NDA signing attempts
 */
const rateLimitStore = new Map<string, { attempts: number; resetTime: number }>();

export function checkNDARateLimit(userId: string): NDARateLimit {
  const now = Date.now();
  const key = `${NDA_RATE_LIMIT.STORAGE_KEY_PREFIX}${userId}`;
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset or create new window
    rateLimitStore.set(key, {
      attempts: 1,
      resetTime: now + NDA_RATE_LIMIT.WINDOW_MS
    });
    
    return {
      attempts: 1,
      maxAttempts: NDA_RATE_LIMIT.MAX_ATTEMPTS,
      resetTime: now + NDA_RATE_LIMIT.WINDOW_MS,
      allowed: true
    };
  }
  
  if (current.attempts >= NDA_RATE_LIMIT.MAX_ATTEMPTS) {
    return {
      attempts: current.attempts,
      maxAttempts: NDA_RATE_LIMIT.MAX_ATTEMPTS,
      resetTime: current.resetTime,
      allowed: false
    };
  }
  
  current.attempts++;
  rateLimitStore.set(key, current);
  
  return {
    attempts: current.attempts,
    maxAttempts: NDA_RATE_LIMIT.MAX_ATTEMPTS,
    resetTime: current.resetTime,
    allowed: true
  };
}

/**
 * Log NDA activity for audit trail
 */
export function logNDAActivity(
  userId: string,
  action: 'sign' | 'view' | 'access_denied' | 'rate_limited',
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

/**
 * Get client IP address from request
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
 * Sanitize user agent string
 */
export function sanitizeUserAgent(userAgent: string): string {
  return userAgent.substring(0, 500); // Limit length
}
