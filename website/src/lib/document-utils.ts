import { Document, DocumentCategory } from '@/types/document';

// Browser-compatible async SHA-256 helper
export async function computeSHA256(input: string | ArrayBuffer): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    // Browser environment - use Web Crypto API
    let data: BufferSource;
    
    if (typeof input === 'string') {
      const encoder = new TextEncoder();
      data = encoder.encode(input);
    } else {
      data = input;
    }
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  } else {
    // Node.js environment - use dynamic import
    const { createHash } = await import('crypto');
    const hash = createHash('sha256');
    
    if (typeof input === 'string') {
      hash.update(input);
    } else {
      hash.update(Buffer.from(input));
    }
    
    return hash.digest('hex');
  }
}

// File size formatting utility
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const sizeNames = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let size = bytes;
  
  while (size >= 1024 && i < sizeNames.length - 1) {
    size /= 1024.0;
    i++;
  }
  
  return `${size.toFixed(1)} ${sizeNames[i]}`;
}

// Calculate file hash
export async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return await computeSHA256(buffer);
}

// Validate file type
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  return allowedTypes.includes(fileExtension);
}

// Get file type from filename
export function getFileType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? `.${extension}` : '';
}

// Document status helpers
export function getDocumentStatusColor(status: boolean): string {
  return status ? 'text-green-600' : 'text-red-600';
}

export function getDocumentStatusBadge(status: boolean): string {
  return status ? 'Found' : 'Missing';
}

export function getDocumentStatusIcon(status: boolean): string {
  return status ? '✓' : '✗';
}

// Category helpers
export function getCategoryColor(categoryName: string): string {
  const colors: Record<string, string> = {
    financials: 'bg-blue-100 text-blue-800',
    legal: 'bg-purple-100 text-purple-800',
    equipment: 'bg-green-100 text-green-800',
    operational: 'bg-yellow-100 text-yellow-800',
    corporate: 'bg-indigo-100 text-indigo-800',
    other: 'bg-gray-100 text-gray-800'
  };
  
  return colors[categoryName] || colors.other;
}

// Visibility helpers
export function canUserViewDocument(document: Document, userRole: string): boolean {
  return document.visibility.includes(userRole) || document.visibility.includes('all');
}

export function getVisibilityBadge(visibility: string[]): string {
  if (visibility.includes('all')) return 'Public';
  if (visibility.includes('admin') && visibility.includes('buyer')) return 'Admin & Buyer';
  if (visibility.includes('admin')) return 'Admin Only';
  if (visibility.includes('buyer')) return 'Buyer Only';
  return 'Restricted';
}

// Document filtering helpers
export function filterDocumentsByCategory(documents: Document[], categoryName: string): Document[] {
  return documents.filter(doc => doc.category === categoryName);
}

export function filterDocumentsByStatus(documents: Document[], status: boolean): Document[] {
  return documents.filter(doc => doc.status === status);
}

export function filterDocumentsByVisibility(documents: Document[], userRole: string): Document[] {
  return documents.filter(doc => canUserViewDocument(doc, userRole));
}

export function searchDocuments(documents: Document[], searchTerm: string): Document[] {
  if (!searchTerm) return documents;
  
  const term = searchTerm.toLowerCase();
  return documents.filter(doc => 
    doc.name.toLowerCase().includes(term) ||
    doc.notes?.toLowerCase().includes(term) ||
    doc.file_type?.toLowerCase().includes(term)
  );
}

// Document sorting helpers
export function sortDocuments(documents: Document[], sortBy: string, sortOrder: 'asc' | 'desc' = 'asc'): Document[] {
  return [...documents].sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'created_at':
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
        break;
      case 'updated_at':
        aValue = new Date(a.updated_at);
        bValue = new Date(b.updated_at);
        break;
      case 'file_size':
        aValue = a.file_size || 0;
        bValue = b.file_size || 0;
        break;
      case 'status':
        aValue = a.status ? 1 : 0;
        bValue = b.status ? 1 : 0;
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}

// Document validation helpers
export function validateDocumentData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Document name is required');
  }
  
  if (data.name && data.name.length > 255) {
    errors.push('Document name must be less than 255 characters');
  }
  
  if (data.file_size_bytes && data.file_size_bytes < 0) {
    errors.push('File size cannot be negative');
  }
  
  if (data.visibility && !Array.isArray(data.visibility)) {
    errors.push('Visibility must be an array');
  }
  
  if (data.due_date && isNaN(Date.parse(data.due_date))) {
    errors.push('Due date must be a valid date');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Document statistics helpers
export function calculateCoveragePercentage(found: number, expected: number): number {
  if (expected === 0) return 100;
  return Math.round((found / expected) * 100 * 100) / 100; // Round to 2 decimal places
}

export function getCoverageStatus(coverage: number): { status: string; color: string } {
  if (coverage >= 90) return { status: 'Excellent', color: 'text-green-600' };
  if (coverage >= 75) return { status: 'Good', color: 'text-blue-600' };
  if (coverage >= 50) return { status: 'Fair', color: 'text-yellow-600' };
  return { status: 'Poor', color: 'text-red-600' };
}

// CSV escaping helper function (RFC 4180 compliant)
function escapeCSVField(field: any): string {
  // Convert to string first
  const stringField = String(field);
  // Escape internal double quotes by doubling them
  const escapedField = stringField.replace(/"/g, '""');
  // Wrap in surrounding double quotes
  return `"${escapedField}"`;
}

// Export helpers
export function exportDocumentsToCSV(documents: Document[], categories: DocumentCategory[]): string {
  const categoryMap = new Map(categories.map(cat => [cat.name, cat.name]));
  
  const headers = [
    'ID',
    'Name',
    'Category',
    'File Type',
    'File Size',
    'Status',
    'Expected',
    'Notes',
    'Visibility',
    'Due Date',
    'Created At',
    'Updated At'
  ];
  
  const rows = documents.map(doc => [
    doc.id,
    doc.name,
    doc.category ? categoryMap.get(doc.category) || 'Unknown' : 'Uncategorized',
    doc.file_type || '',
    doc.file_size_display || '',
    doc.status ? 'Found' : 'Missing',
    doc.expected ? 'Yes' : 'No',
    doc.notes || '',
    doc.visibility.join(', '),
    doc.due_date || '',
    doc.created_at,
    doc.updated_at
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => escapeCSVField(field)).join(','))
    .join('\n');
  
  return csvContent;
}

// Date helpers
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export function getDaysUntilDue(dueDate: string | null): number | null {
  if (!dueDate) return null;
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
