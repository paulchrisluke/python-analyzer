/**
 * NDA (Non-Disclosure Agreement) TypeScript interfaces
 */

export interface NDASignature {
  id: string;
  userId: string;
  userEmail: string | null; // Anonymized in public data
  userName: string | null; // Anonymized in public data
  signatureData: string; // Base64 encoded signature
  signedAt: string;
  ndaVersion: string;
  documentHash: string; // Hash of NDA text for integrity
  // Note: ipAddress and userAgent removed for privacy compliance
}

export interface NDAStatus {
  isSigned: boolean;
  signedAt?: string;
  version?: string;
  canAccessProtectedContent: boolean;
  signatureId?: string;
}

// Extended NDA status response from API that includes additional fields
export interface NDAStatusResponse {
  isSigned: boolean;
  isExempt: boolean;
  canAccessProtectedContent: boolean;
  role: string;
  signedAt?: string;
  version?: string;
  signatureId?: string;
  exemptReason?: string;
  signature?: {
    id: string;
    signedAt: string;
    version: string;
  } | null;
}

export interface NDASigningRequest {
  signatureData: string;
  agreedToTerms: boolean;
  understoodBinding: boolean;
  documentHash: string;
  effectiveDate: string; // e.g., "September 18, 2025" or ISO string
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
  ndaSigned?: boolean;
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

