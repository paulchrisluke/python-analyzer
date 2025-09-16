/**
 * NDA (Non-Disclosure Agreement) TypeScript interfaces
 */

export interface NDASignature {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  signatureData: string; // Base64 encoded signature
  signedAt: string;
  ipAddress: string;
  userAgent: string;
  ndaVersion: string;
  documentHash: string; // Hash of NDA text for integrity
}

export interface NDAStatus {
  isSigned: boolean;
  signedAt?: string;
  version?: string;
  canAccessProtectedContent: boolean;
  signatureId?: string;
}

export interface NDASigningRequest {
  signatureData: string;
  agreedToTerms: boolean;
  understoodBinding: boolean;
  documentHash: string;
}

export interface NDASigningResponse {
  success: boolean;
  signatureId?: string;
  error?: string;
  message?: string;
}

export interface NDAValidationRequest {
  signatureId: string;
  documentHash: string;
}

export interface NDAValidationResponse {
  valid: boolean;
  error?: string;
  signature?: NDASignature;
}

// Extended user interface for Auth.js v5
export interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'buyer' | 'lawyer' | 'viewer';
  ndaSigned: boolean;
  ndaSignedAt?: string;
  ndaVersion?: string;
}

// NDA document configuration
export interface NDADocumentConfig {
  version: string;
  effectiveDate: string;
  title: string;
  description: string;
  requiredRoles: string[];
  exemptRoles: string[];
}

// Rate limiting for NDA signing
export interface NDARateLimit {
  attempts: number;
  maxAttempts: number;
  resetTime: number;
  allowed: boolean;
}
