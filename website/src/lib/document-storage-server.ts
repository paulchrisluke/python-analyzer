import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Document, DocumentCategory, DocumentStats, CoverageAnalysis } from '@/types/document';

// File-based storage for documents metadata (SERVER-SIDE ONLY)
const DATA_DIR = join(process.cwd(), 'data');
const DOCUMENTS_FILE = join(DATA_DIR, 'documents.json');
const CATEGORIES_FILE = join(DATA_DIR, 'categories.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
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
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading documents:', error);
    return [];
  }
}

// Save documents to file
export function saveDocuments(documents: Document[]): void {
  ensureDataDir();
  
  try {
    writeFileSync(DOCUMENTS_FILE, JSON.stringify(documents, null, 2));
  } catch (error) {
    console.error('Error saving documents:', error);
    throw error;
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
  static create(data: Omit<Document, 'id' | 'created_at' | 'updated_at'>): Document {
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
  }

  // Get all documents
  static findAll(filters?: {
    category?: string;
    status?: boolean;
    expected?: boolean;
    file_type?: string;
    visibility?: string[];
    search?: string;
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
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        documents = documents.filter(doc => 
          doc.name.toLowerCase().includes(searchTerm) ||
          doc.notes.toLowerCase().includes(searchTerm)
        );
      }
    }
    
    return documents;
  }

  // Get document by ID
  static findById(id: string): Document | null {
    const documents = loadDocuments();
    return documents.find(doc => doc.id === id) || null;
  }

  // Update document
  static update(id: string, data: Partial<{
    name?: string;
    category?: string;
    status?: boolean;
    expected?: boolean;
    notes?: string;
    visibility?: string[];
    due_date?: string;
  }>): Document | null {
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
  }

  // Delete document
  static delete(id: string): boolean {
    const documents = loadDocuments();
    const filtered = documents.filter(doc => doc.id !== id);
    
    if (filtered.length === documents.length) {
      return false; // Document not found
    }
    
    saveDocuments(filtered);
    return true;
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

  // Get coverage analysis
  static getCoverageAnalysis(): CoverageAnalysis {
    const documents = loadDocuments();
    const categories = loadCategories();
    const stats = this.getStats();
    
    const categoryAnalysis = categories.map(category => {
      const categoryDocs = documents.filter(doc => doc.category === category.name);
      const expected = category.required ? categoryDocs.length : 0;
      const found = categoryDocs.filter(doc => doc.status).length;
      const missing = categoryDocs.filter(doc => !doc.status).length;
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
