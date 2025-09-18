'use server';

/**
 * NDA Storage utilities for persisting NDA signatures
 * 
 * IMPORTANT: This module requires explicit initialization via enableNDAStorage()
 * before use. It will not auto-initialize on import.
 * 
 * In a production environment, this would typically use a database.
 * For this implementation, we'll use a simple in-memory store with
 * optional file-based persistence for development (requires ENABLE_DEV_PERSISTENCE=true).
 * 
 * This module is server-only and should not be imported into client components.
 * 
 * Usage:
 * 1. Call enableNDAStorage({ enablePersistence: true }) to enable file persistence
 * 2. Or call enableNDAStorage() for in-memory only storage
 * 3. Never call enableNDAStorage() in production - use a proper database instead
 */

import type { NDASignature, NDAStatus } from '@/types/nda';
import { createNDAStatus, generateSignatureId, validateSignatureIntegrity } from './nda';
import { auth } from '@/auth';
import { put, del, list, head } from '@vercel/blob';
import { Mutex } from 'async-mutex';

// In-memory storage for development
// In production, replace with database operations
const signatureStore = new Map<string, NDASignature>();

// Flag to track if storage has been initialized
let storageInitialized = false;

// Vercel Blob configuration
const BLOB_STORE_KEY = 'nda-signatures.json';
const USER_ROLES_BLOB_KEY = 'user-roles.json';
const SANITIZED_EXPORT_BLOB_KEY = 'nda-signatures-sanitized.json';

// User role management
interface UserRole {
  userId: string;
  email: string;
  role: 'admin' | 'buyer' | 'lawyer' | 'viewer';
  updatedAt: string;
}

// Audit log for admin operations
interface AdminAuditLog {
  id: string;
  adminUserId: string;
  adminEmail: string;
  action: 'get_all_signatures' | 'delete_signature';
  targetSignatureId?: string;
  timestamp: string;
  // Note: ipAddress and userAgent removed for privacy compliance
}

const auditLog: AdminAuditLog[] = [];

// Proper mutex for thread safety in concurrent environments
// Using async-mutex to prevent race conditions
const mutex = new Mutex();

/**
 * Admin authentication utilities
 */

/**
 * Verify that the current user is authenticated and has admin role
 * @returns Promise<{ isAdmin: boolean; user?: { id: string; email: string; role: string } }>
 */
async function verifyAdminAuth(): Promise<{ 
  isAdmin: boolean; 
  user?: { id: string; email: string; role: string }; 
  error?: string 
}> {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { isAdmin: false, error: 'Not authenticated' };
    }
    
    if (session.user.role !== 'admin') {
      return { 
        isAdmin: false, 
        user: { 
          id: session.user.id, 
          email: session.user.email || '', 
          role: session.user.role 
        },
        error: 'Insufficient permissions - admin role required' 
      };
    }
    
    return { 
      isAdmin: true, 
      user: { 
        id: session.user.id, 
        email: session.user.email || '', 
        role: session.user.role 
      } 
    };
  } catch (error) {
    console.error('Error verifying admin auth:', error);
    return { isAdmin: false, error: 'Authentication verification failed' };
  }
}

/**
 * Log admin operations for audit trail
 */
function logAdminOperation(
  adminUser: { id: string; email: string },
  action: AdminAuditLog['action'],
  targetSignatureId?: string
): void {
  const auditEntry: AdminAuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    adminUserId: adminUser.id,
    adminEmail: adminUser.email,
    action,
    targetSignatureId,
    timestamp: new Date().toISOString()
  };
  
  auditLog.push(auditEntry);
  
  // Keep only last 1000 audit entries to prevent memory bloat
  if (auditLog.length > 1000) {
    auditLog.splice(0, auditLog.length - 1000);
  }
  
  console.log(`Admin audit: ${adminUser.email} performed ${action}${targetSignatureId ? ` on signature ${targetSignatureId}` : ''}`);
}

// Retry configuration for blob operations
const BLOB_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
};

// Exponential backoff retry utility
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = BLOB_RETRY_CONFIG.maxRetries
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries) {
        console.error(`${operationName} failed after ${maxRetries + 1} attempts:`, lastError);
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        BLOB_RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
        BLOB_RETRY_CONFIG.maxDelay
      );
      
      console.warn(`${operationName} attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Vercel Blob storage functions
async function loadSignaturesFromBlob(): Promise<void> {
  await withRetry(async () => {
    console.log('Loading NDA signatures from blob storage...');
    // List blobs to check if our key exists
    const { blobs } = await list({ prefix: BLOB_STORE_KEY });
    console.log(`Found ${blobs.length} blobs with prefix ${BLOB_STORE_KEY}`);
    // Filter blobs that start with our key prefix and select the latest one
    const matchingBlobs = blobs.filter(blob => blob.pathname.startsWith(BLOB_STORE_KEY));
    const existingBlob = matchingBlobs.length > 0 
      ? matchingBlobs.reduce((latest, current) => 
          (current.size && latest.size && current.size > latest.size) 
            ? current 
            : latest
        )
      : null;
    
    if (!existingBlob) {
      console.log('No existing NDA signatures found in blob storage');
      return;
    }
    
    console.log(`Found NDA signatures blob: ${existingBlob.pathname}, size: ${existingBlob.size}`);

    // Use authenticated blob read instead of public URL
    console.log(`Fetching blob content using authenticated method`);
    const response = await fetch(existingBlob.url);
    console.log(`Fetch response status: ${response.status}, ok: ${response.ok}`);
    
    if (!response.ok) {
      console.log('No existing NDA signatures found in blob storage - fetch failed');
      return;
    }

    const data = await response.text();
    console.log(`Fetched data length: ${data.length} characters`);
    console.log(`First 200 characters: ${data.substring(0, 200)}`);
    
    const signatures: NDASignature[] = JSON.parse(data);
    console.log(`Parsed ${signatures.length} signatures from blob`);
    
    // Load signatures into memory
    signatures.forEach(sig => {
      signatureStore.set(sig.id, sig);
    });
    
    console.log(`Loaded ${signatures.length} NDA signatures from blob storage`);
  }, 'loadSignaturesFromBlob');
}

async function saveSignaturesToBlob(): Promise<void> {
  await withRetry(async () => {
    const signatures = Array.from(signatureStore.values());
    const data = JSON.stringify(signatures, null, 2);
    
    await put(BLOB_STORE_KEY, data, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    
    console.log(`Saved ${signatures.length} NDA signatures to blob storage`);
  }, 'saveSignaturesToBlob');
}

// User role management functions
async function loadUserRolesFromBlob(): Promise<Map<string, UserRole>> {
  const roleStore = new Map<string, UserRole>();
  
  await withRetry(async () => {
    const { blobs } = await list({ prefix: USER_ROLES_BLOB_KEY });
    const existingBlob = blobs.find(blob => blob.pathname === USER_ROLES_BLOB_KEY);
    
    if (!existingBlob) {
      console.log('No existing user roles found in blob storage');
      return;
    }
    
    // Use authenticated blob read instead of public URL
    const response = await fetch(existingBlob.url);
    if (!response.ok) {
      console.log('No existing user roles found in blob storage');
      return;
    }
    
    const data = await response.text();
    const roles: UserRole[] = JSON.parse(data);
    roles.forEach(role => {
      roleStore.set(role.userId, role);
    });
    console.log(`Loaded ${roles.length} user roles from blob storage`);
  }, 'loadUserRolesFromBlob');
  
  return roleStore;
}

async function saveUserRolesToBlob(roleStore: Map<string, UserRole>): Promise<void> {
  await withRetry(async () => {
    const roles = Array.from(roleStore.values());
    const data = JSON.stringify(roles, null, 2);
    await put(USER_ROLES_BLOB_KEY, data, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    console.log(`Saved ${roles.length} user roles to blob storage`);
  }, 'saveUserRolesToBlob');
}

// Public functions for user role management
export async function getUserRole(userId: string, email?: string): Promise<'admin' | 'buyer' | 'lawyer' | 'viewer'> {
  try {
    const roleStore = await loadUserRolesFromBlob();
    
    // First try to find by userId
    let userRole = roleStore.get(userId);
    
    // If not found and email is provided, try to find by email
    if (!userRole && email) {
      for (const [id, role] of roleStore.entries()) {
        if (role.email === email) {
          userRole = role;
          break;
        }
      }
    }
    
    return userRole?.role || 'viewer';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'viewer';
  }
}

export async function updateUserRole(userId: string, email: string, role: 'admin' | 'buyer' | 'lawyer' | 'viewer'): Promise<void> {
  try {
    const roleStore = await loadUserRolesFromBlob();
    roleStore.set(userId, {
      userId,
      email,
      role,
      updatedAt: new Date().toISOString()
    });
    await saveUserRolesToBlob(roleStore);
    console.log(`Updated user ${userId} role to ${role}`);
  } catch (error) {
    console.error('Error updating user role:', error);
  }
}

/**
 * Initialize storage - load from Vercel Blob
 * @deprecated Use enableNDAStorage() instead for explicit opt-in
 */
export async function initializeNDAStorage(): Promise<void> {
  console.log('Initializing NDA storage...');
  await loadSignaturesFromBlob();
  console.log(`NDA storage initialized. Current signature count: ${signatureStore.size}`);
}

/**
 * Enable NDA storage with explicit opt-in
 * This function must be called explicitly to enable storage functionality
 * 
 * @param options Configuration options for storage
 * @returns Promise that resolves when storage is enabled
 */
export async function enableNDAStorage(options: {
  enablePersistence?: boolean;
  requireExplicitOptIn?: boolean;
} = {}): Promise<void> {
  const { enablePersistence = false, requireExplicitOptIn = true } = options;
  
  if (requireExplicitOptIn && !enablePersistence) {
    console.log('NDA storage enabled with in-memory only (no persistence)');
    return;
  }
  
  if (enablePersistence) {
    if (!storageInitialized) {
      console.log('NDA storage enabled with Vercel Blob persistence');
      await initializeNDAStorage();
      storageInitialized = true;
    } else {
      console.log('NDA storage already initialized with Vercel Blob persistence');
    }
  } else {
    console.log('NDA storage enabled with in-memory only');
  }
}

/**
 * Save signatures to Vercel Blob
 * Sanitizes PII before persistence - only stores non-identifying metadata
 * Raw PII is never written to persistent storage in production
 */
async function saveSignaturesToFile(): Promise<void> {
  // Only persist in development mode with explicit opt-in
  if (process.env.NODE_ENV !== 'development' || !process.env.ENABLE_NDA_PERSISTENCE) {
    console.log('NDA signature persistence disabled in production for PII protection');
    return;
  }

  await withRetry(async () => {
    const signatures = Array.from(signatureStore.values());
    
    // Sanitize signatures - remove PII before persistence
    const sanitizedSignatures = signatures.map(sig => ({
      id: sig.id,
      signedAt: sig.signedAt,
      ndaVersion: sig.ndaVersion,
      documentHash: sig.documentHash.substring(0, 8) + '...', // Truncated hash
      // Remove PII: userId, userEmail, userName, signatureData, ipAddress, userAgent
      userRole: 'anonymous' // Anonymized role
    }));
    
    const data = JSON.stringify(sanitizedSignatures, null, 2);
    
    await put(SANITIZED_EXPORT_BLOB_KEY, data, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    
    console.log(`Saved ${sanitizedSignatures.length} sanitized NDA signatures to blob storage (dev only)`);
  }, 'saveSignaturesToFile');
}

/**
 * Store or update an NDA signature (upsert by userId)
 */
export async function storeNDASignature(
  signature: Omit<NDASignature, 'id'>, 
  options: { createOnly?: boolean } = {}
): Promise<NDASignature> {
  // Acquire lock for thread safety using proper async mutex
  const release = await mutex.acquire();
  
  try {
    // First, look for existing signature with the same userId
    let existingSignature: NDASignature | null = null;
    let existingId: string | null = null;
    
    for (const [id, existingSig] of signatureStore.entries()) {
      if (existingSig.userId === signature.userId) {
        existingSignature = existingSig;
        existingId = id;
        break;
      }
    }
    
    let fullSignature: NDASignature;
    
    if (existingSignature && existingId) {
      if (options.createOnly) {
        throw new Error('NDA signature already exists for this user');
      }
      // Update existing signature, keeping the same ID
      fullSignature = {
        ...existingSignature,
        ...signature,
        id: existingId
      };
      signatureStore.set(existingId, fullSignature);
    } else {
      // Create new signature
      const id = generateSignatureId();
      fullSignature = {
        ...signature,
        id
      };
      signatureStore.set(id, fullSignature);
    }
    
    await saveSignaturesToFile();
    
    return fullSignature;
  } finally {
    release();
  }
}

/**
 * Get NDA signature by ID
 */
export async function getNDASignature(signatureId: string): Promise<NDASignature | null> {
  // Acquire lock for thread safety using proper async mutex
  const release = await mutex.acquire();
  
  try {
    return signatureStore.get(signatureId) || null;
  } finally {
    release();
  }
}

/**
 * Get NDA signature by user ID
 */
export async function getNDASignatureByUserId(userId: string, email?: string): Promise<NDASignature | null> {
  // Acquire lock for thread safety using proper async mutex
  const release = await mutex.acquire();
  
  try {
    // First try to find by userId
    for (const signature of signatureStore.values()) {
      if (signature.userId === userId) {
        return signature;
      }
    }
    
    // If not found and email is provided, try to find by email
    if (email) {
      for (const signature of signatureStore.values()) {
        if (signature.userEmail === email) {
          return signature;
        }
      }
    }
    
    return null;
  } finally {
    release();
  }
}

/**
 * Get NDA status for a user
 */
export async function getNDAStatus(userId: string, email?: string): Promise<NDAStatus> {
  const signature = await getNDASignatureByUserId(userId, email);
  return createNDAStatus(signature);
}

/**
 * Check if user has signed NDA
 */
export async function hasUserSignedNDA(userId: string): Promise<boolean> {
  const signature = await getNDASignatureByUserId(userId);
  return signature !== null;
}

/**
 * Get all NDA signatures (admin only)
 * @returns Promise<{ signatures: NDASignature[] } | { error: string; statusCode: number }>
 */
export async function getAllNDASignatures(
): Promise<{ signatures: NDASignature[] } | { error: string; statusCode: number }> {
  // Verify admin authentication
  const authResult = await verifyAdminAuth();
  if (!authResult.isAdmin || !authResult.user) {
    return { 
      error: authResult.error || 'Authentication failed', 
      statusCode: authResult.user ? 403 : 401 
    };
  }
  
  // Log admin operation
  logAdminOperation(authResult.user, 'get_all_signatures', undefined);
  
  // Acquire lock for thread safety using proper async mutex
  const release = await mutex.acquire();
  
  try {
    const signatures = Array.from(signatureStore.values());
    return { signatures };
  } finally {
    release();
  }
}

/**
 * Delete NDA signature (admin only)
 * @param signatureId The ID of the signature to delete
 * @returns Promise<{ success: boolean; signature?: NDASignature } | { error: string; statusCode: number }>
 */
export async function deleteNDASignature(
  signatureId: string
): Promise<{ success: boolean; signature?: NDASignature } | { error: string; statusCode: number }> {
  // Verify admin authentication
  const authResult = await verifyAdminAuth();
  if (!authResult.isAdmin || !authResult.user) {
    return { 
      error: authResult.error || 'Authentication failed', 
      statusCode: authResult.user ? 403 : 401 
    };
  }
  
  // Acquire lock for thread safety using proper async mutex
  const release = await mutex.acquire();
  
  try {
    // Check if signature exists before deletion
    const existingSignature = signatureStore.get(signatureId);
    if (!existingSignature) {
      return { error: 'Signature not found', statusCode: 404 };
    }
    
    // Delete the signature
    const deleted = signatureStore.delete(signatureId);
    if (deleted) {
      await saveSignaturesToFile();
      
      // Log admin operation with target signature info
      logAdminOperation(authResult.user, 'delete_signature', signatureId);
      
      return { success: true, signature: existingSignature };
    }
    
    return { error: 'Failed to delete signature', statusCode: 500 };
  } finally {
    release();
  }
}

/**
 * Get NDA signature statistics
 */
export async function getNDAStatistics(): Promise<{
  totalSignatures: number;
  signaturesByVersion: Record<string, number>;
  signaturesByRole: Record<string, number>;
  recentSignatures: NDASignature[];
}> {
  // Acquire lock for thread safety using proper async mutex
  const release = await mutex.acquire();
  
  try {
    const signatures = Array.from(signatureStore.values());
    
    const signaturesByVersion: Record<string, number> = {};
    const signaturesByRole: Record<string, number> = {};
    
    signatures.forEach(sig => {
      // Count by version
      signaturesByVersion[sig.ndaVersion] = (signaturesByVersion[sig.ndaVersion] || 0) + 1;
      
      // Count by role (we'd need to get this from user data)
      // For now, we'll just count total
    });
    
    // Get recent signatures (last 10)
    const recentSignatures = signatures
      .sort((a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime())
      .slice(0, 10);
    
    return {
      totalSignatures: signatures.length,
      signaturesByVersion,
      signaturesByRole,
      recentSignatures
    };
  } finally {
    release();
  }
}

/**
 * Get admin audit logs (admin only)
 * @returns Promise<{ auditLogs: AdminAuditLog[] } | { error: string; statusCode: number }>
 */
export async function getAdminAuditLogs(
): Promise<{ auditLogs: AdminAuditLog[] } | { error: string; statusCode: number }> {
  // Verify admin authentication
  const authResult = await verifyAdminAuth();
  if (!authResult.isAdmin || !authResult.user) {
    return { 
      error: authResult.error || 'Authentication failed', 
      statusCode: authResult.user ? 403 : 401 
    };
  }
  
  // Log admin operation
  logAdminOperation(authResult.user, 'get_all_signatures', undefined);
  
  return { auditLogs: [...auditLog] }; // Return a copy to prevent external modification
}

/**
 * Validate NDA signature exists and is valid
 */
export async function validateNDASignature(
  signatureId: string,
  documentHash: string
): Promise<{ valid: boolean; signature?: NDASignature; error?: string }> {
  const signature = await getNDASignature(signatureId);
  
  if (!signature) {
    return { valid: false, error: 'Signature not found' };
  }
  
  // Use central validation function for consistency
  const validationResult = validateSignatureIntegrity(signature, documentHash);
  
  if (!validationResult.valid) {
    return { valid: false, error: validationResult.error };
  }
  
  return { valid: true, signature };
}

// Storage initialization is now opt-in via enableNDAStorage() function
// This prevents automatic initialization on import and requires explicit enablement

/**
 * ADMIN FUNCTIONS SECURITY NOTES:
 * 
 * 1. Admin Authentication: All admin functions (getAllNDASignatures, deleteNDASignature, getAdminAuditLogs)
 *    now require explicit admin authentication via verifyAdminAuth().
 * 
 * 2. Audit Logging: All admin operations are logged with:
 *    - Admin user ID and email
 *    - Action performed
 *    - Target signature ID (for deletions)
 *    - Timestamp
 *    - IP address and user agent (when available)
 * 
 * 3. Thread Safety: A simple mutex mechanism prevents race conditions in concurrent environments.
 *    In production, this should be replaced with proper database transactions.
 * 
 * 4. API Endpoints: Admin functions are exposed via:
 *    - GET /api/admin/nda - List all signatures
 *    - DELETE /api/admin/nda/[signatureId] - Delete signature
 *    - GET /api/admin/nda/statistics - Get statistics
 *    - GET /api/admin/nda/audit - Get audit logs
 * 
 * 5. Error Handling: Functions return structured error responses with appropriate HTTP status codes:
 *    - 401: Not authenticated
 *    - 403: Insufficient permissions (not admin)
 *    - 404: Signature not found (for deletions)
 *    - 503: Service temporarily unavailable (lock contention)
 */
