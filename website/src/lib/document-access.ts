/**
 * Document access utilities for secure document viewing and downloading
 */

import { Document } from '@/types/document';

/**
 * Generate a signed URL for document access
 */
export async function getDocumentSignedUrl(documentId: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}/signed-url`, {
      method: 'GET',
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      console.error('Failed to get signed URL:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    if (data.success && data.data?.signedUrl) {
      return data.data.signedUrl;
    }

    return null;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }
}

/**
 * Download a document using signed URL
 */
export async function downloadDocument(doc: Document): Promise<boolean> {
  try {
    const signedUrl = await getDocumentSignedUrl(doc.id);
    if (!signedUrl) {
      console.error('Failed to get signed URL for document:', doc.id);
      return false;
    }

    // Create a temporary link and trigger download
    const link = globalThis.document.createElement('a');
    link.href = signedUrl;
    link.download = doc.name || doc.sanitized_name || 'document';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Append to body, click, and remove
    globalThis.document.body.appendChild(link);
    link.click();
    globalThis.document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error('Error downloading document:', error);
    return false;
  }
}

/**
 * Open a document in a new tab using signed URL
 */
export async function viewDocument(doc: Document): Promise<boolean> {
  try {
    const signedUrl = await getDocumentSignedUrl(doc.id);
    if (!signedUrl) {
      console.error('Failed to get signed URL for document:', doc.id);
      return false;
    }

    // Open in new tab
    window.open(signedUrl, '_blank', 'noopener,noreferrer');
    return true;
  } catch (error) {
    console.error('Error viewing document:', error);
    return false;
  }
}

/**
 * Check if a document can be accessed by the current user
 */
export async function canAccessDocument(documentId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}`, {
      method: 'GET',
      credentials: 'include',
    });

    return response.ok;
  } catch (error) {
    console.error('Error checking document access:', error);
    return false;
  }
}

/**
 * Get document metadata with access check
 */
export async function getDocumentWithAccess(documentId: string): Promise<Document | null> {
  try {
    const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error getting document:', error);
    return null;
  }
}
