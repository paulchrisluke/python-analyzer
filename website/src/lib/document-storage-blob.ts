import { list, del } from '@vercel/blob';
import { Document, DocumentCategory, DocumentStats, CoverageAnalysis } from '@/types/document';

// Simple blob-based document storage - no local files needed!
export class DocumentStorage {
  // Get all documents by listing blob storage
  static async findAll(filters?: {
    category?: string;
    status?: boolean;
    expected?: boolean;
    file_type?: string;
    visibility?: string[];
    phase?: string;
    userRole?: string;
  }): Promise<Document[]> {
    try {
      const { blobs } = await list({
        limit: 1000
      });

      const documents: Document[] = [];

      for (const blob of blobs) {
        // Parse metadata from blob filename
        const filename = blob.pathname;
        
        let category: string;
        let originalName: string;
        let phase: string = 'legacy'; // Default for old format
        
        // Check if it's in the new phase format: p{phase}_{category}_{subtype}_{date}_{originalname}
        const phaseMatch = filename.match(/^(p\d+[ab]?|legal)_(.+?)_(.+?)_(.+?)_(.+)$/);
        if (phaseMatch) {
          phase = phaseMatch[1];
          category = phaseMatch[2];
          originalName = phaseMatch[5]; // Last part is the original filename
        } else if (filename.startsWith('documents/')) {
          // Check if it's in the new format: documents/category/filename
          const pathParts = filename.split('/');
          if (pathParts.length < 3) continue;
          category = pathParts[1];
          originalName = pathParts[2];
        } else {
          // Check if it's in the old format: timestamp_category_originalname
          const nameMatch = filename.match(/^\d+_(.+?)_(.+)$/);
          if (!nameMatch) continue; // Skip if doesn't match expected pattern
          category = nameMatch[1];
          originalName = nameMatch[2];
        }
        
        // Determine file type from extension
        const fileExtension = filename.split('.').pop()?.toLowerCase() || '';
        
        // Determine visibility based on phase and user role
        const visibility = this.getDocumentVisibility(phase, category);
        
        // Create document object
        const document: Document = {
          id: blob.pathname, // Use blob path as unique ID
          name: originalName,
          category: category,
          sanitized_name: filename,
          path_segment: category,
          blob_url: blob.url,
          file_type: fileExtension,
          file_size: blob.size,
          file_size_display: this.formatFileSize(blob.size),
          file_hash: '', // Not available from blob metadata
          status: true, // If it's in blob storage, it exists
          expected: true,
          notes: `Phase: ${phase}`,
          visibility: visibility,
          due_date: null,
          last_modified: blob.uploadedAt.toISOString(),
          created_at: blob.uploadedAt.toISOString(),
          updated_at: blob.uploadedAt.toISOString()
        };

        documents.push(document);
      }

      // Apply filters
      let filteredDocuments = documents;
      if (filters) {
        if (filters.category) {
          filteredDocuments = filteredDocuments.filter(doc => doc.category === filters.category);
        }
        if (filters.status !== undefined) {
          filteredDocuments = filteredDocuments.filter(doc => doc.status === filters.status);
        }
        if (filters.expected !== undefined) {
          filteredDocuments = filteredDocuments.filter(doc => doc.expected === filters.expected);
        }
        if (filters.file_type) {
          filteredDocuments = filteredDocuments.filter(doc => doc.file_type === filters.file_type);
        }
        if (filters.visibility && filters.visibility.length > 0) {
          filteredDocuments = filteredDocuments.filter(doc => 
            filters.visibility!.some(role => doc.visibility.includes(role))
          );
        }
        if (filters.phase) {
          filteredDocuments = filteredDocuments.filter(doc => 
            doc.notes?.includes(`Phase: ${filters.phase}`)
          );
        }
        if (filters.userRole) {
          filteredDocuments = filteredDocuments.filter(doc => 
            doc.visibility.includes(filters.userRole!)
          );
        }
      }

      return filteredDocuments;
    } catch (error) {
      console.error('Error fetching documents from blob storage:', error);
      return [];
    }
  }

  // Get document by ID (blob path)
  static async findById(id: string): Promise<Document | null> {
    try {
      const documents = await this.findAll();
      return documents.find(doc => doc.id === id) || null;
    } catch (error) {
      console.error('Error finding document by ID:', error);
      return null;
    }
  }

  // Delete document
  static async delete(id: string): Promise<boolean> {
    try {
      await del(id); // id is the blob path
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  // Generate signed URL for document access
  // Note: Vercel Blob doesn't have built-in signed URLs, so we'll use the blob URL
  // with proper authentication checks at the API level
  static async generateSignedUrl(documentId: string, expiresInSeconds: number = 900): Promise<string | null> {
    try {
      // Get document metadata to verify it exists
      const document = await this.findById(documentId);
      if (!document) {
        return null;
      }

      // For Vercel Blob, we return the blob URL
      // The actual access control is handled at the API level with authentication
      // The URL will be validated when accessed through our API endpoints
      return document.blob_url;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return null;
    }
  }

  // Get document statistics
  static async getStats(): Promise<DocumentStats> {
    const documents = await this.findAll();
    
    const stats: DocumentStats = {
      total: documents.length,
      found: documents.length, // All documents in blob storage are found
      missing: 0, // Since we only list existing documents, missing is always 0
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
  static async getCoverageAnalysis(): Promise<CoverageAnalysis> {
    const documents = await this.findAll();
    const categories = this.getDefaultCategories();
    const stats = await this.getStats();
    
    const categoryAnalysis = categories.map(category => {
      const categoryDocs = documents.filter(doc => doc.category === category.name);
      const expected = this.calculateExpectedDocuments(category);
      const found = categoryDocs.length; // All documents in blob storage are found
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

  // Helper methods
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Determine document visibility based on phase and category
  private static getDocumentVisibility(phase: string, category: string): string[] {
    const visibility: string[] = ['admin']; // Admin always has access
    
    switch (phase) {
      case 'p1':
        // Initial Interest - Basic business info
        visibility.push('buyer');
        break;
      case 'p2a':
        // Pre-Qualification - High-level summaries
        visibility.push('buyer');
        break;
      case 'p2b':
        // Post-NDA - Detailed financials, ownership
        visibility.push('buyer');
        break;
      case 'p3a':
        // Due Diligence Start - Full financials, contracts
        visibility.push('buyer');
        break;
      case 'p3b':
        // Advanced Due Diligence - Staff, patients, equipment
        visibility.push('buyer');
        break;
      case 'p4':
        // Negotiation - Draft agreements
        visibility.push('buyer');
        break;
      case 'p5':
        // Closing - Final agreements
        visibility.push('buyer');
        break;
      case 'legal':
        // Legal Review - All legal documents
        visibility.push('lawyer');
        break;
      case 'legacy':
        // Legacy files - default to buyer access for now
        visibility.push('buyer');
        break;
      default:
        // Unknown phase - admin only
        break;
    }
    
    return visibility;
  }

  static getDefaultCategories(): DocumentCategory[] {
    return [
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
  }

  private static calculateExpectedDocuments(category: DocumentCategory): number {
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
}
