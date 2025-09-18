/**
 * Document Security Utilities
 * 
 * This module provides security utilities for document management,
 * including filename validation, access logging, and security checks.
 * 
 * Rate Limiting:
 * - Development/Test: Uses bounded in-memory store with automatic pruning
 * - Production: Should use Redis/Upstash for distributed rate limiting
 * - Current implementation includes warnings for production usage
 */

import * as crypto from 'crypto';
import { Document, DocumentPhase } from '@/types/document';

/**
 * Security configuration for document handling
 */
export const SECURITY_CONFIG = {
  // Maximum file size in bytes (100MB)
  MAX_FILE_SIZE: 100 * 1024 * 1024,
  
  // Allowed file extensions
  ALLOWED_EXTENSIONS: ['.pdf', '.csv', '.xlsx', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'],
  
  // Maximum filename length
  MAX_FILENAME_LENGTH: 255,
  
  // Rate limiting: max requests per minute per user
  RATE_LIMIT_REQUESTS_PER_MINUTE: 60,
  
  // Document retention period in days (90 days)
  RETENTION_DAYS: 90,
  
  // Audit log retention in days (365 days)
  AUDIT_LOG_RETENTION_DAYS: 365
};

/**
 * Document phases that require NDA signature for access
 */
export const NDA_REQUIRED_PHASES: DocumentPhase[] = ['p2b', 'p3a', 'p3b', 'p4', 'p5', 'legal'];

/**
 * Validate document filename for security
 */
export function validateDocumentFilename(filename: string): { valid: boolean; error?: string } {
  if (!filename || typeof filename !== 'string') {
    return { valid: false, error: 'Filename is required' };
  }

  if (filename.length > SECURITY_CONFIG.MAX_FILENAME_LENGTH) {
    return { valid: false, error: 'Filename too long' };
  }

  // Check for path traversal attempts
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return { valid: false, error: 'Invalid filename: path traversal detected' };
  }

  // Check for null bytes
  if (filename.includes('\0')) {
    return { valid: false, error: 'Invalid filename: null bytes detected' };
  }

  // Check file extension
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex <= 0) {
    return { valid: false, error: 'File must have a valid extension' };
  }
  
  const extension = filename.toLowerCase().substring(dotIndex);
  if (!SECURITY_CONFIG.ALLOWED_EXTENSIONS.includes(extension)) {
    return { valid: false, error: `File extension ${extension} not allowed` };
  }

  return { valid: true };
}

/**
 * Validate file size
 */
export function validateFileSize(size: number): { valid: boolean; error?: string } {
  if (size > SECURITY_CONFIG.MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large' };
  }
  return { valid: true };
}

/**
 * Check if a document should be cleaned up based on retention policy
 */
export function shouldCleanupDocument(document: Document): boolean {
  if (!document.last_modified) {
    return false;
  }

  const lastModified = new Date(document.last_modified);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - SECURITY_CONFIG.RETENTION_DAYS);

  return lastModified < cutoffDate;
}

/**
 * Generate a secure random filename component
 */
export function generateSecureFilenameComponent(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

/**
 * Log document access for audit trail
 */
export function logDocumentAccess(
  documentId: string,
  userId: string,
  userRole: string,
  action: 'view' | 'download' | 'delete' | 'upload',
  ipAddress?: string
): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    documentId,
    userId,
    userRole,
    action,
    ipAddress: ipAddress || 'unknown'
  };

  // In production, this should be sent to a proper logging service
  console.info('DOCUMENT_ACCESS:', JSON.stringify(logEntry));
}

/**
 * Check rate limit for document access with IP-based keying
 */
export function checkDocumentAccessRateLimit(
  userId: string,
  ipAddress?: string
): { allowed: boolean; remaining: number; resetTime: number } {
  return checkRateLimit(userId, ipAddress);
}

/**
 * Parse document phase from notes as fallback (for backward compatibility)
 * @deprecated Use structured document.phase field instead
 */
export function parsePhaseFromNotes(notes: string): DocumentPhase {
  const match = notes?.match(/Phase:\s*(p[1-5](?:[ab])?|legal|legacy)/i);
  if (match) {
    const phase = match[1].toLowerCase() as DocumentPhase;
    // Validate the parsed phase
    const validPhases: DocumentPhase[] = ['p1', 'p2a', 'p2b', 'p3a', 'p3b', 'p4', 'p5', 'legal', 'legacy'];
    if (validPhases.includes(phase)) {
      return phase;
    }
  }
  // Default to 'legacy' for unknown phases to be restrictive
  return 'legacy';
}

/**
 * Get document phase with fallback to notes parsing
 */
export function getDocumentPhase(document: Document): DocumentPhase {
  // Use structured phase field if available
  if (document.phase) {
    return document.phase;
  }
  
  // Fallback to parsing from notes (backward compatibility)
  return parsePhaseFromNotes(document.notes);
}

/**
 * Check if user has access to document based on role and phase
 * 
 * @param userRole - The user's role (e.g., 'admin', 'investor', 'buyer')
 * @param document - The document to check access for
 * @param ndaSigned - Optional NDA signature status (defaults to false for security)
 * @returns true if user has access, false otherwise
 * 
 * @deprecated For callers that need to pass the real NDA status, use:
 * hasDocumentAccessWithNDA(userRole, document, actualNdaStatus)
 */
export function hasDocumentAccess(userRole: string, document: Document, ndaSigned?: boolean): boolean {
  if (userRole === 'admin') {
    return true;
  }

  // Default to false for security (secure default)
  const hasNda = ndaSigned ?? false;
  const documentPhase = getDocumentPhase(document);
  
  // Check if document phase requires NDA
  if (NDA_REQUIRED_PHASES.includes(documentPhase) && !hasNda) {
    return false;
  }

  return document.visibility.includes(userRole);
}

/**
 * Migration helper: Check document access with explicit NDA status
 * 
 * Use this function when you have the actual NDA signature status
 * and want to avoid the secure default behavior.
 * 
 * @param userRole - The user's role
 * @param document - The document to check access for  
 * @param ndaSigned - The actual NDA signature status
 * @returns true if user has access, false otherwise
 */
export function hasDocumentAccessWithNDA(userRole: string, document: Document, ndaSigned: boolean): boolean {
  return hasDocumentAccess(userRole, document, ndaSigned);
}

/**
 * Generate security headers for document responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
}

/**
 * Validate document metadata for security
 */
export function validateDocumentMetadata(document: Partial<Document>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (document.name) {
    const nameValidation = validateDocumentFilename(document.name);
    if (!nameValidation.valid) {
      errors.push(`Name: ${nameValidation.error}`);
    }
  }

  if (document.category && typeof document.category !== 'string') {
    errors.push('Category must be a string');
  }

  if (document.visibility && !Array.isArray(document.visibility)) {
    errors.push('Visibility must be an array');
  }

  if (document.file_size && typeof document.file_size !== 'number') {
    errors.push('File size must be a number');
  }

  if (document.file_size) {
    const sizeValidation = validateFileSize(document.file_size);
    if (!sizeValidation.valid) {
      errors.push(`File size: ${sizeValidation.error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_CONFIG = {
  // Maximum number of keys to store in memory (prevents unbounded growth)
  MAX_STORE_SIZE: 10000,
  
  // How often to prune expired entries (in milliseconds)
  PRUNE_INTERVAL: 5 * 60 * 1000, // 5 minutes
  
  // Maximum age for rate limit entries (in milliseconds)
  MAX_ENTRY_AGE: 2 * 60 * 1000, // 2 minutes (longer than window for cleanup)
};

/**
 * Rate limiting store with memory bounds and automatic pruning
 * Only used in non-production environments
 */
class BoundedRateLimitStore {
  private store = new Map<string, { count: number; resetTime: number; createdAt: number }>();
  private lastPrune = Date.now();

  constructor() {
    // Only use in-memory store in non-production
    if (process.env.NODE_ENV === 'production') {
      console.warn('In-memory rate limiting should not be used in production. Use Redis/Upstash instead.');
    }
  }

  private shouldPrune(): boolean {
    return Date.now() - this.lastPrune > RATE_LIMIT_CONFIG.PRUNE_INTERVAL;
  }

  private prune(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      // Remove entries that are both expired and old
      if (now > entry.resetTime && (now - entry.createdAt) > RATE_LIMIT_CONFIG.MAX_ENTRY_AGE) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.store.delete(key));
    this.lastPrune = now;

    if (expiredKeys.length > 0) {
      console.debug(`Rate limit store pruned ${expiredKeys.length} expired entries`);
    }
  }

  private enforceSizeLimit(): void {
    if (this.store.size > RATE_LIMIT_CONFIG.MAX_STORE_SIZE) {
      // Remove oldest entries (by creation time)
      const entries = Array.from(this.store.entries())
        .sort(([, a], [, b]) => a.createdAt - b.createdAt);
      
      const toRemove = entries.slice(0, this.store.size - RATE_LIMIT_CONFIG.MAX_STORE_SIZE);
      toRemove.forEach(([key]) => this.store.delete(key));
      
      console.warn(`Rate limit store exceeded size limit, removed ${toRemove.length} oldest entries`);
    }
  }

  get(key: string): { count: number; resetTime: number } | undefined {
    if (this.shouldPrune()) {
      this.prune();
    }

    const entry = this.store.get(key);
    if (!entry) return undefined;

    // Return undefined for expired entries
    if (Date.now() > entry.resetTime) {
      this.store.delete(key);
      return undefined;
    }

    return { count: entry.count, resetTime: entry.resetTime };
  }

  set(key: string, count: number, resetTime: number): void {
    this.enforceSizeLimit();
    
    this.store.set(key, {
      count,
      resetTime,
      createdAt: Date.now()
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  size(): number {
    return this.store.size;
  }
}

// Global rate limit store instance
const rateLimitStore = new BoundedRateLimitStore();

/**
 * Generate rate limit key with optional IP address for better security
 */
function generateRateLimitKey(userId: string, ipAddress?: string): string {
  if (ipAddress) {
    return `rate_limit_${userId}_${ipAddress}`;
  }
  return `rate_limit_${userId}`;
}

/**
 * Rate limiting check with improved memory management
 * 
 * @param userId - User identifier
 * @param ipAddress - Optional IP address for additional security
 * @returns Rate limit status
 */
export function checkRateLimit(
  userId: string, 
  ipAddress?: string
): { allowed: boolean; remaining: number; resetTime: number } {
  // In production, this should delegate to Redis/Upstash
  if (process.env.NODE_ENV === 'production') {
    console.warn('Production rate limiting not implemented. Use Redis/Upstash.');
    // For now, allow all requests in production (should be replaced with Redis)
    return {
      allowed: true,
      remaining: SECURITY_CONFIG.RATE_LIMIT_REQUESTS_PER_MINUTE,
      resetTime: Date.now() + 60 * 1000
    };
  }

  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const key = generateRateLimitKey(userId, ipAddress);
  
  const current = rateLimitStore.get(key);
  
  if (!current) {
    // Create new window
    rateLimitStore.set(key, 1, now + windowMs);
    
    return {
      allowed: true,
      remaining: SECURITY_CONFIG.RATE_LIMIT_REQUESTS_PER_MINUTE - 1,
      resetTime: now + windowMs
    };
  }
  
  if (current.count >= SECURITY_CONFIG.RATE_LIMIT_REQUESTS_PER_MINUTE) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime
    };
  }
  
  // Increment count
  rateLimitStore.set(key, current.count + 1, current.resetTime);
  
  return {
    allowed: true,
    remaining: SECURITY_CONFIG.RATE_LIMIT_REQUESTS_PER_MINUTE - (current.count + 1),
    resetTime: current.resetTime
  };
}

/**
 * Clear rate limit for a specific user (useful for testing or manual overrides)
 */
export function clearRateLimit(userId: string, ipAddress?: string): void {
  const key = generateRateLimitKey(userId, ipAddress);
  rateLimitStore.delete(key);
}

/**
 * Get current rate limit store statistics (for monitoring)
 */
export function getRateLimitStats(): { size: number; isProduction: boolean } {
  return {
    size: rateLimitStore.size(),
    isProduction: process.env.NODE_ENV === 'production'
  };
}
