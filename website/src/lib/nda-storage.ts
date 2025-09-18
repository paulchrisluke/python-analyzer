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

// In-memory storage for development
// In production, replace with database operations
const signatureStore = new Map<string, NDASignature>();

// Check if dev persistence is enabled
const isDevPersistenceEnabled = (): boolean => {
  return process.env.ENABLE_DEV_PERSISTENCE === 'true' && 
         typeof process !== 'undefined' && 
         typeof process.cwd === 'function';
};

// File path for persistence (development only) - only use when explicitly enabled
const getStorageFile = () => {
  if (isDevPersistenceEnabled()) {
    const path = require('path');
    return path.join(process.cwd(), 'data', 'nda-signatures.json');
  }
  return null;
};

/**
 * Initialize storage - load from file if it exists (Node.js only)
 * Only works when ENABLE_DEV_PERSISTENCE=true and in Node.js environment
 * @deprecated Use enableNDAStorage() instead for explicit opt-in
 */
export async function initializeNDAStorage(): Promise<void> {
  if (!isDevPersistenceEnabled()) {
    console.log('NDA storage persistence disabled - using in-memory only');
    return;
  }

  try {
    const storageFile = getStorageFile();
    if (storageFile) {
      const fs = require('fs');
      if (fs.existsSync(storageFile)) {
        const data = fs.readFileSync(storageFile, 'utf8');
        const signatures: NDASignature[] = JSON.parse(data);
        
        // Load signatures into memory
        signatures.forEach(sig => {
          signatureStore.set(sig.id, sig);
        });
        
        console.log(`Loaded ${signatures.length} NDA signatures from storage`);
      }
    }
  } catch (error) {
    console.error('Error loading NDA signatures:', error);
  }
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
  
  if (enablePersistence && !isDevPersistenceEnabled()) {
    throw new Error(
      'NDA storage persistence requires ENABLE_DEV_PERSISTENCE=true environment variable. ' +
      'In production, use a proper database instead of file-based storage.'
    );
  }
  
  if (enablePersistence) {
    console.log('NDA storage enabled with file-based persistence (development only)');
    await initializeNDAStorage();
  } else {
    console.log('NDA storage enabled with in-memory only');
  }
}

/**
 * Save signatures to file (development only, Node.js only)
 * Only works when ENABLE_DEV_PERSISTENCE=true and in Node.js environment
 * Never writes raw PII - data is already sanitized in memory
 * 
 * WARNING: This function performs file I/O operations. In production,
 * use a proper database instead of file-based storage.
 */
function saveSignaturesToFile(): void {
  if (!isDevPersistenceEnabled()) {
    // No-op when persistence is disabled
    return;
  }

  // Additional safety check - refuse to perform disk I/O without explicit opt-in
  if (process.env.NODE_ENV === 'production') {
    console.warn('NDA storage: File I/O disabled in production. Use a database instead.');
    return;
  }

  try {
    const storageFile = getStorageFile();
    if (storageFile) {
      const fs = require('fs');
      const path = require('path');
      
      const signatures = Array.from(signatureStore.values());
      const data = JSON.stringify(signatures, null, 2);
      
      // Ensure directory exists
      const dir = path.dirname(storageFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(storageFile, data, 'utf8');
    }
  } catch (error) {
    console.error('Error saving NDA signatures:', error);
  }
}

/**
 * Store or update an NDA signature (upsert by userId)
 */
export async function storeNDASignature(signature: Omit<NDASignature, 'id'>): Promise<NDASignature> {
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
  
  saveSignaturesToFile();
  
  return fullSignature;
}

/**
 * Get NDA signature by ID
 */
export async function getNDASignature(signatureId: string): Promise<NDASignature | null> {
  return signatureStore.get(signatureId) || null;
}

/**
 * Get NDA signature by user ID
 */
export async function getNDASignatureByUserId(userId: string): Promise<NDASignature | null> {
  for (const signature of signatureStore.values()) {
    if (signature.userId === userId) {
      return signature;
    }
  }
  return null;
}

/**
 * Get NDA status for a user
 */
export async function getNDAStatus(userId: string): Promise<NDAStatus> {
  const signature = await getNDASignatureByUserId(userId);
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
 */
export async function getAllNDASignatures(): Promise<NDASignature[]> {
  return Array.from(signatureStore.values());
}

/**
 * Delete NDA signature (admin only)
 */
export async function deleteNDASignature(signatureId: string): Promise<boolean> {
  const deleted = signatureStore.delete(signatureId);
  if (deleted) {
    saveSignaturesToFile();
  }
  return deleted;
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
