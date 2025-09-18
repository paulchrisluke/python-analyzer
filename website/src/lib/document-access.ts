/**
 * Document access utilities for secure document viewing and downloading
 */

import { Document } from '@/types/document';

/**
 * Download a document via server-side proxy (no direct URL exposure)
 */
export async function downloadDocument(doc: Document): Promise<boolean> {
  try {
    // Use the proxy route instead of direct download
    const proxyUrl = `/api/documents/proxy/${encodeURIComponent(doc.id)}`;
    
    // Create a link element and trigger download
    const link = document.createElement('a');
    link.href = proxyUrl;
    link.download = doc.name || doc.sanitized_name || 'document';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error('Error downloading document:', error);
    return false;
  }
}


/**
 * Check if a document can be accessed by the current user
 */
export async function canAccessDocument(documentId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/documents/${documentId}`, {
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
    const response = await fetch(`/api/documents/${documentId}`, {
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
