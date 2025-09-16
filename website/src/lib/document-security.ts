/**
 * Document Security Utilities
 * 
 * This module provides security utilities for document management,
 * including filename validation, access logging, and security checks.
 */

import { Document } from '@/types/document';

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
  const crypto = require('crypto');
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
 * Check if user has access to document based on role and phase
 */
export function hasDocumentAccess(userRole: string, document: Document): boolean {
  if (userRole === 'admin') {
    return true;
  }

  return document.visibility.includes(userRole);
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
 * Rate limiting check (simple in-memory implementation)
 * In production, use Redis or a proper rate limiting service
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const key = `rate_limit_${userId}`;
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset or create new window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    
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
  
  current.count++;
  rateLimitStore.set(key, current);
  
  return {
    allowed: true,
    remaining: SECURITY_CONFIG.RATE_LIMIT_REQUESTS_PER_MINUTE - current.count,
    resetTime: current.resetTime
  };
}
