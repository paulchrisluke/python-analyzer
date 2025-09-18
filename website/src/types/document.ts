// Document Management System TypeScript Interfaces - Blob Storage Version

// Document phase types for structured metadata
export type DocumentPhase = 'p1' | 'p2a' | 'p2b' | 'p3a' | 'p3b' | 'p4' | 'p5' | 'legal' | 'legacy';

export interface Document {
  id: string;
  name: string;
  category: string;
  sanitized_name: string;
  path_segment: string;
  blob_url: string;
  file_type: string;
  file_size: number;
  file_size_display: string;
  file_hash: string;
  status: boolean; // exists/missing
  expected: boolean;
  notes: string;
  phase: DocumentPhase; // Structured phase metadata
  visibility: string[];
  due_date: string | null;
  last_modified: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentCategory {
  name: string;
  description: string;
  required: boolean;
  frequency: string;
  period: string;
}

export interface CreateDocumentData {
  name: string;
  category: string;
  file_type: string;
  file_size: number;
  file_size_display: string;
  file_hash: string;
  status?: boolean;
  expected?: boolean;
  notes?: string;
  phase: DocumentPhase;
  visibility?: string[];
  due_date?: string;
}

export interface UpdateDocumentData {
  name?: string;
  category?: string;
  status?: boolean;
  expected?: boolean;
  notes?: string;
  phase?: DocumentPhase;
  visibility?: string[];
  due_date?: string;
}

export interface DocumentFilters {
  category?: string;
  status?: boolean;
  expected?: boolean;
  file_type?: string;
  visibility?: string[];
  search?: string;
}

export interface DocumentStats {
  total: number;
  found: number;
  missing: number;
  expected: number;
  by_category: Record<string, number>;
  by_file_type: Record<string, number>;
}

export interface CoverageAnalysis {
  overall_coverage: number;
  total_expected: number;
  total_found: number;
  total_missing: number;
  categories: Array<{
    category_name: string;
    description: string;
    required: boolean;
    frequency: string;
    period: string;
    expected_documents: number;
    found_documents: number;
    missing_documents: number;
    coverage_percentage: number;
  }>;
  summary: DocumentStats;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export interface DocumentListResponse extends ApiResponse<Document[]> {
  count: number;
}

export interface DocumentResponse extends ApiResponse<Document> {}

export interface CoverageResponse extends ApiResponse<CoverageAnalysis> {}

export interface StatsResponse extends ApiResponse<DocumentStats> {}

// File Upload Types
export interface FileUploadResult {
  success: boolean;
  blob_url?: string;
  file_size?: number;
  file_hash?: string;
  error?: string;
}

export interface DocumentUploadData {
  file: File;
  name: string;
  category: string;
  notes?: string;
  visibility?: string[];
  due_date?: string;
}

// Blob Storage Types
export interface BlobDocument {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
}

export interface BlobListResult {
  blobs: BlobDocument[];
  hasMore: boolean;
  cursor?: string;
}