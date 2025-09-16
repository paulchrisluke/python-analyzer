/**
 * Document access utilities for secure document viewing and downloading
 */

import { Document } from '@/types/document';

/**
 * Download a document via server-side proxy (no direct URL exposure)
 */
export async function downloadDocument(doc: Document): Promise<boolean> {
  try {
    const response = await fetch(`/api/documents/${doc.id}/download`, {
      method: 'GET',
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      console.error('Failed to download document:', response.status, response.statusText);
      return false;
    }

    // Get the filename from the response headers or use document name
    const contentDisposition = response.headers.get('content-disposition');
    let filename = doc.name || doc.sanitized_name || 'document';
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    // Create blob from response and trigger download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error downloading document:', error);
    return false;
  }
}

/**
 * Open a document in a new tab via server-side proxy
 */
export async function viewDocument(doc: Document): Promise<boolean> {
  try {
    // Open the download endpoint in a new tab - the server will handle streaming
    const downloadUrl = `/api/documents/${doc.id}/download`;
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
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
