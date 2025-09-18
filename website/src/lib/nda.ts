/**
 * Server-only NDA (Non-Disclosure Agreement) utilities
 * 
 * This module contains NDA utilities that require Node.js crypto APIs
 * and can only be used in server-side contexts (API routes, server components).
 * 
 * For edge-safe utilities, use the nda-edge.ts module instead.
 */

import * as crypto from 'crypto';
import type { NDASignature, NDAStatus, NDARateLimit } from '@/types/nda';
import { NDA_CONFIG, NDA_RATE_LIMIT } from './nda-edge';

// Re-export edge-safe utilities for convenience
export {
  NDA_REQUIRED_PHASES,
  requiresNDA,
  isNDAExempt,
  phaseRequiresNDA,
  getClientIP,
  sanitizeUserAgent,
  logNDAActivity
} from './nda-edge';

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

