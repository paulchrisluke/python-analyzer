import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Document, DocumentCategory, DocumentStats, CoverageAnalysis } from '@/types/document';

// File-based storage for documents metadata (SERVER-SIDE ONLY)
const DATA_DIR = join(process.cwd(), 'data');
const DOCUMENTS_FILE = join(DATA_DIR, 'documents.json');
const CATEGORIES_FILE = join(DATA_DIR, 'categories.json');

// In-process write queue to prevent race conditions
let writeQueue: Promise<void> = Promise.resolve();

// Helper function to enqueue write operations
function enqueueWrite<T>(operation: () => T | Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    writeQueue = writeQueue.then(async () => {
      try {
        const result = await operation();
        resolve(result);
        return; // Return void to maintain writeQueue type
      } catch (error) {
        reject(error);
        return; // Return void even on error
      }
    }).catch(() => {
      // Swallow errors to prevent writeQueue from staying rejected
      // The error has already been propagated to the caller via reject()
      return; // Return void to maintain writeQueue type
    });
  });
}

// Ensure data directory exists
function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Validate Document object structure and required fields
function validateDocument(doc: any): doc is Document {
  if (!doc || typeof doc !== 'object') {
    return false;
  }

  // Check required string fields
  const requiredStringFields = ['id', 'name', 'category', 'sanitized_name', 'path_segment', 'blob_url', 'file_type', 'file_size_display', 'file_hash', 'notes', 'last_modified', 'created_at', 'updated_at'];
  for (const field of requiredStringFields) {
    if (typeof doc[field] !== 'string') {
      return false;
    }
  }

  // Check required number fields
  if (typeof doc.file_size !== 'number' || doc.file_size < 0) {
    return false;
  }

  // Check required boolean fields
  if (typeof doc.status !== 'boolean' || typeof doc.expected !== 'boolean') {
    return false;
  }

  // Check required array field
  if (!Array.isArray(doc.visibility)) {
    return false;
  }

  // Check optional field (due_date can be string or null)
  if (doc.due_date !== null && typeof doc.due_date !== 'string') {
    return false;
  }

  return true;
}

// Validate array of documents
function validateDocuments(documents: any): documents is Document[] {
  if (!Array.isArray(documents)) {
    return false;
  }

  return documents.every(validateDocument);
}

// Default document categories
const DEFAULT_CATEGORIES: DocumentCategory[] = [
  {
    name: 'financials',
    description: 'Financial documents including P&L, balance sheets, bank statements, and tax documents',
    required: true,
    frequency: 'monthly',
    period: '24_months'
  },
  {
    name: 'legal',
    description: 'Legal documents including leases, insurance policies, and business licenses',
    required: true,
    frequency: 'annual',
    period: 'current'
  },
  {
    name: 'equipment',
    description: 'Equipment inventory, quotes, maintenance records, and warranties',
    required: true,
    frequency: 'as_needed',
    period: 'current'
  },
  {
    name: 'operational',
    description: 'Operational data including sales records, customer data, and staff records',
    required: true,
    frequency: 'monthly',
    period: '24_months'
  },
  {
    name: 'corporate',
    description: 'Corporate documents including articles of incorporation, bylaws, and board minutes',
    required: true,
    frequency: 'as_needed',
    period: 'current'
  },
  {
    name: 'other',
    description: 'Miscellaneous documents and files',
    required: false,
    frequency: 'as_needed',
    period: 'current'
  }
];

// Load documents from file
export function loadDocuments(): Document[] {
  ensureDataDir();
  
  if (!existsSync(DOCUMENTS_FILE)) {
    return [];
  }
  
  try {
    const data = readFileSync(DOCUMENTS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    
    // Validate that parsed data is an array of valid Document objects
    if (!validateDocuments(parsed)) {
      throw new Error(`Invalid document data structure in ${DOCUMENTS_FILE}. Expected array of Document objects with required fields: id, name, category, sanitized_name, path_segment, blob_url, file_type, file_size, file_size_display, file_hash, status, expected, notes, visibility, last_modified, created_at, updated_at`);
    }
    
    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse JSON from ${DOCUMENTS_FILE}: ${error.message}`);
    } else if (error instanceof Error && error.message.includes('Invalid document data structure')) {
      throw error; // Re-throw validation errors as-is
    } else {
      throw new Error(`Failed to read documents from ${DOCUMENTS_FILE}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Save documents to file
export function saveDocuments(documents: Document[]): void {
  ensureDataDir();
  
  // Validate input before saving
  if (!validateDocuments(documents)) {
    throw new Error('Invalid document data structure. Expected array of Document objects with required fields: id, name, category, blob_url, file_type, file_size, file_size_display, file_hash, status, expected, notes, visibility, last_modified, created_at, updated_at');
  }
  
  const tempFile = DOCUMENTS_FILE + '.tmp';
  
  try {
    // Write to temporary file first
    writeFileSync(tempFile, JSON.stringify(documents, null, 2), 'utf8');
    
    // Atomically move temp file to final location
    renameSync(tempFile, DOCUMENTS_FILE);
  } catch (error) {
    // Clean up temp file if it exists
    try {
      if (existsSync(tempFile)) {
        unlinkSync(tempFile); // Delete temp file
      }
    } catch (cleanupError) {
      // Ignore ENOENT (file not found) but surface other errors
      if (cleanupError instanceof Error && (cleanupError as any).code !== 'ENOENT') {
        console.warn(`Failed to cleanup temp file ${tempFile}:`, cleanupError.message);
      }
    }
    
    if (error instanceof Error) {
      throw new Error(`Failed to save documents to ${DOCUMENTS_FILE}: ${error.message}`);
    } else {
      throw new Error(`Failed to save documents to ${DOCUMENTS_FILE}: Unknown error`);
    }
  }
}

// Load categories from file
export function loadCategories(): DocumentCategory[] {
  ensureDataDir();
  
  if (!existsSync(CATEGORIES_FILE)) {
    // Initialize with default categories
    saveCategories(DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  }
  
  try {
    const data = readFileSync(CATEGORIES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading categories:', error);
    return DEFAULT_CATEGORIES;
  }
}

// Save categories to file
export function saveCategories(categories: DocumentCategory[]): void {
  ensureDataDir();
  
  try {
    writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
  } catch (error) {
    console.error('Error saving categories:', error);
    throw error;
  }
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Document CRUD operations
export class DocumentStorage {
  // Create a new document
  static async create(data: Omit<Document, 'id' | 'created_at' | 'updated_at'>): Promise<Document> {
    return enqueueWrite(() => {
      const documents = loadDocuments();
      const now = new Date().toISOString();
      
      const document: Document = {
        id: generateId(),
        created_at: now,
        updated_at: now,
        ...data
      };
      
      documents.push(document);
      saveDocuments(documents);
      
      return document;
    });
  }

  // Get all documents
  static findAll(filters?: {
    category?: string;
    status?: boolean;
    expected?: boolean;
    file_type?: string;
    visibility?: string[];
  }): Document[] {
    let documents = loadDocuments();
    
    if (filters) {
      if (filters.category) {
        documents = documents.filter(doc => doc.category === filters.category);
      }
      if (filters.status !== undefined) {
        documents = documents.filter(doc => doc.status === filters.status);
      }
      if (filters.expected !== undefined) {
        documents = documents.filter(doc => doc.expected === filters.expected);
      }
      if (filters.file_type) {
        documents = documents.filter(doc => doc.file_type === filters.file_type);
      }
      if (filters.visibility && filters.visibility.length > 0) {
        documents = documents.filter(doc => 
          filters.visibility!.some(role => doc.visibility.includes(role))
        );
      }
    }
    
    return documents;
  }

  // Get document by ID
  static async findById(id: string): Promise<Document | null> {
    const documents = loadDocuments();
    return documents.find(doc => doc.id === id) || null;
  }

  // Update document
  static async update(id: string, data: Partial<{
    name?: string;
    category?: string;
    status?: boolean;
    expected?: boolean;
    notes?: string;
    visibility?: string[];
    due_date?: string;
  }>): Promise<Document | null> {
    return enqueueWrite(() => {
      const documents = loadDocuments();
      const index = documents.findIndex(doc => doc.id === id);
      
      if (index === -1) {
        return null;
      }
      
      documents[index] = {
        ...documents[index],
        ...data,
        updated_at: new Date().toISOString()
      };
      
      saveDocuments(documents);
      return documents[index];
    });
  }

  // Delete document
  static async delete(id: string): Promise<boolean> {
    return enqueueWrite(() => {
      const documents = loadDocuments();
      const filtered = documents.filter(doc => doc.id !== id);
      
      if (filtered.length === documents.length) {
        return false; // Document not found
      }
      
      saveDocuments(filtered);
      return true;
    });
  }

  // Get document statistics
  static getStats(): DocumentStats {
    const documents = loadDocuments();
    
    const stats: DocumentStats = {
      total: documents.length,
      found: documents.filter(doc => doc.status).length,
      missing: documents.filter(doc => !doc.status).length,
      expected: documents.filter(doc => doc.expected).length,
      by_category: {},
      by_file_type: {}
    };
    
    // Count by category
    documents.forEach(doc => {
      stats.by_category[doc.category] = (stats.by_category[doc.category] || 0) + 1;
    });
    
    // Count by file type
    documents.forEach(doc => {
      stats.by_file_type[doc.file_type] = (stats.by_file_type[doc.file_type] || 0) + 1;
    });
    
    return stats;
  }

  // Calculate expected documents based on business rules
  static calculateExpectedDocuments(category: DocumentCategory): number {
    if (!category.required) {
      return 0;
    }

    // Calculate based on frequency and period
    switch (category.frequency) {
      case 'monthly':
        switch (category.period) {
          case '24_months':
            return 24; // 24 months of monthly documents
          case '12_months':
            return 12; // 12 months of monthly documents
          case 'current':
            return 1; // Current month only
          default:
            return 24; // Default to 24 months
        }
      
      case 'annual':
        switch (category.period) {
          case '24_months':
            return 2; // 2 years of annual documents
          case '12_months':
            return 1; // 1 year of annual documents
          case 'current':
            return 1; // Current year only
          default:
            return 2; // Default to 2 years
        }
      
      case 'as_needed':
        // For due diligence, as_needed categories typically need 1-3 documents
        switch (category.period) {
          case 'current':
            return 1; // Current version only
          case '24_months':
            return 3; // Up to 3 versions over 24 months
          default:
            return 1; // Default to current
        }
      
      default:
        return 1; // Fallback
    }
  }

  // Get coverage analysis
  static getCoverageAnalysis(): CoverageAnalysis {
    const documents = loadDocuments();
    const categories = loadCategories();
    const stats = this.getStats();
    
    const categoryAnalysis = categories.map(category => {
      const categoryDocs = documents.filter(doc => doc.category === category.name);
      const expected = this.calculateExpectedDocuments(category);
      const found = categoryDocs.filter(doc => doc.status).length;
      const missing = Math.max(0, expected - found);
      const coveragePercentage = expected > 0 ? (found / expected) * 100 : 100;
      
      return {
        category_name: category.name,
        description: category.description,
        required: category.required,
        frequency: category.frequency,
        period: category.period,
        expected_documents: expected,
        found_documents: found,
        missing_documents: missing,
        coverage_percentage: Math.round(coveragePercentage * 100) / 100
      };
    });
    
    const totalExpected = categoryAnalysis.reduce((sum, cat) => sum + cat.expected_documents, 0);
    const totalFound = categoryAnalysis.reduce((sum, cat) => sum + cat.found_documents, 0);
    const overallCoverage = totalExpected > 0 ? (totalFound / totalExpected) * 100 : 100;
    
    return {
      overall_coverage: Math.round(overallCoverage * 100) / 100,
      total_expected: totalExpected,
      total_found: totalFound,
      total_missing: totalExpected - totalFound,
      categories: categoryAnalysis,
      summary: stats
    };
  }
}
