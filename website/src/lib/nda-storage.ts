/**
 * NDA Storage utilities for persisting NDA signatures
 * 
 * In a production environment, this would typically use a database.
 * For this implementation, we'll use a simple in-memory store with
 * file-based persistence for development.
 */

import { NDASignature, NDAStatus } from '@/types/nda';
import { createNDAStatus, generateSignatureId } from './nda';

// In-memory storage for development
// In production, replace with database operations
const signatureStore = new Map<string, NDASignature>();

// File path for persistence (development only) - only use in Node.js environment
const getStorageFile = () => {
  if (typeof process !== 'undefined' && process.cwd) {
    const path = require('path');
    return path.join(process.cwd(), 'data', 'nda-signatures.json');
  }
  return null;
};

/**
 * Initialize storage - load from file if it exists (Node.js only)
 */
export function initializeNDAStorage(): void {
  try {
    const storageFile = getStorageFile();
    if (storageFile && typeof require !== 'undefined') {
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
 * Save signatures to file (development only, Node.js only)
 */
function saveSignaturesToFile(): void {
  try {
    const storageFile = getStorageFile();
    if (storageFile && typeof require !== 'undefined') {
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
 * Store a new NDA signature
 */
export async function storeNDASignature(signature: Omit<NDASignature, 'id'>): Promise<NDASignature> {
  const id = generateSignatureId();
  const fullSignature: NDASignature = {
    ...signature,
    id
  };
  
  signatureStore.set(id, fullSignature);
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
  
  // Check document hash
  if (signature.documentHash !== documentHash) {
    return { valid: false, error: 'Document hash mismatch' };
  }
  
  // Check if signature is not expired (2 years)
  const signedDate = new Date(signature.signedAt);
  const now = new Date();
  const daysSinceSigned = (now.getTime() - signedDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceSigned > 730) {
    return { valid: false, error: 'Signature has expired' };
  }
  
  return { valid: true, signature };
}

// Initialize storage on module load
initializeNDAStorage();
