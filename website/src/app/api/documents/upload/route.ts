import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { computeSHA256 } from '@/lib/document-utils';
import { DocumentStorage } from '@/lib/document-storage-blob';
import { auth } from '@/auth';
import { getPhaseConfig, getPhaseVisibility, getPhaseBlobAccess, getAllowedPhases } from '@/lib/phase-mapping';

// Security validation functions
function sanitizePathComponent(input: string): string {
  // Remove any path traversal attempts and dangerous characters
  return input
    .replace(/[\/\\:*?"<>|]/g, '_')  // Replace path separators and invalid filename chars
    .replace(/\.\./g, '_')           // Replace parent directory references
    .replace(/^\.+/, '')             // Remove leading dots
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace any other non-alphanumeric chars except dots, underscores, hyphens
    .substring(0, 100);              // Limit length
}

function validateCategory(category: string): { valid: boolean; error?: string } {
  const allowedCategories = DocumentStorage.getDefaultCategories();
  const categoryNames = allowedCategories.map(cat => cat.name);
  
  if (!categoryNames.includes(category)) {
    return {
      valid: false,
      error: `Invalid category. Allowed categories: ${categoryNames.join(', ')}`
    };
  }
  
  return { valid: true };
}

function generateUniqueFilename(originalName: string, fileHash: string): string {
  // Extract name and extension
  const lastDotIndex = originalName.lastIndexOf('.');
  const nameWithoutExt = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
  const extension = lastDotIndex !== -1 ? originalName.substring(lastDotIndex) : '';
  
  // Sanitize the name
  const sanitizedName = sanitizePathComponent(nameWithoutExt);
  
  // Create unique filename using hash prefix to prevent collisions
  const hashPrefix = fileHash.substring(0, 8);
  const timestamp = Date.now();
  
  return `${hashPrefix}_${timestamp}_${sanitizedName}${extension}`;
}

function determineBlobAccess(visibility: string[]): 'private' {
  // Use private access for all documents to ensure security
  // Access control is handled at the application level through authentication
  return 'private';
}

// POST /api/documents/upload - Upload a document file
export async function POST(request: NextRequest) {
  // Authentication and authorization check
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  if (session.user?.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    
    // Extract and validate file
    const fileEntry = formData.get('file');
    if (!fileEntry || !(fileEntry instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'Valid file is required' },
        { status: 400 }
      );
    }
    const file = fileEntry;

    // Extract and validate name
    const nameEntry = formData.get('name');
    if (!nameEntry || typeof nameEntry !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Name is required and must be a string' },
        { status: 400 }
      );
    }
    const name = nameEntry.trim();
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name cannot be empty' },
        { status: 400 }
      );
    }
    
    // Validate name length and characters
    if (name.length > 255) {
      return NextResponse.json(
        { success: false, error: 'Name must be less than 255 characters' },
        { status: 400 }
      );
    }
    
    // Sanitize name to prevent XSS and other issues
    const sanitizedName = name.replace(/[<>:"/\\|?*]/g, '_');

    // Extract and validate category
    const categoryEntry = formData.get('category');
    if (!categoryEntry || typeof categoryEntry !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Category is required and must be a string' },
        { status: 400 }
      );
    }
    const category = categoryEntry.trim();
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category cannot be empty' },
        { status: 400 }
      );
    }
    
    // Validate category against allowed list
    const categoryValidation = validateCategory(category);
    if (!categoryValidation.valid) {
      return NextResponse.json(
        { success: false, error: categoryValidation.error },
        { status: 400 }
      );
    }

    // Extract and validate optional notes
    const notesEntry = formData.get('notes');
    let notes = notesEntry && typeof notesEntry === 'string' ? notesEntry.trim() : '';
    
    // Validate notes length
    if (notes.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Notes must be less than 1000 characters' },
        { status: 400 }
      );
    }

    // Extract and validate optional visibility
    const visibilityEntry = formData.get('visibility');
    const visibility = visibilityEntry && typeof visibilityEntry === 'string' ? visibilityEntry.trim() : '';

    // Extract and validate optional phase
    const phaseEntry = formData.get('phase');
    const phase = phaseEntry && typeof phaseEntry === 'string' ? phaseEntry.trim() : 'p3a'; // Default to due diligence phase
    
    // Validate phase against allowed phases
    const allowedPhases = getAllowedPhases();
    if (!allowedPhases.includes(phase)) {
      return NextResponse.json(
        { success: false, error: `Invalid phase. Allowed phases: ${allowedPhases.join(', ')}` },
        { status: 400 }
      );
    }

    // Extract and validate optional due_date
    const dueDateEntry = formData.get('due_date');
    let due_date: string | null = null;
    if (dueDateEntry && typeof dueDateEntry === 'string') {
      const trimmedDate = dueDateEntry.trim();
      if (trimmedDate) {
        // Enhanced date validation
        const parsedDate = new Date(trimmedDate);
        if (isNaN(parsedDate.getTime())) {
          return NextResponse.json(
            { success: false, error: 'Due date must be a valid date in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)' },
            { status: 400 }
          );
        }
        
        // Check if date is in the future (optional business rule)
        const now = new Date();
        if (parsedDate < now) {
          return NextResponse.json(
            { success: false, error: 'Due date must be in the future' },
            { status: 400 }
          );
        }
        
        due_date = parsedDate.toISOString();
      }
    }

    // Validate file size (4.5MB limit for server uploads)
    if (file.size > 4.5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 4.5MB' },
        { status: 400 }
      );
    }

    // File type validation - matches client accept attribute
    const allowedExtensions = ['.pdf', '.csv', '.xlsx', '.xls', '.doc', '.docx', '.txt'];
    
    // MIME type validation mapping - tolerant for browser/OS variations
    const allowedMimeTypes = {
      '.pdf': ['application/pdf'],
      '.csv': ['', 'text/csv', 'application/csv', 'application/vnd.ms-excel'],
      '.xlsx': ['', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
      '.xls': ['', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      '.doc': ['', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      '.docx': ['', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'],
      '.txt': ['', 'text/plain']
    };
    
    // Extract file extension safely with better error handling
    const fileName = file.name;
    if (!fileName || fileName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'File must have a valid name' },
        { status: 400 }
      );
    }
    
    const lastDotIndex = fileName.lastIndexOf('.');
    const fileExtension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex).toLowerCase() : '';
    
    // Check if file has an extension
    if (!fileExtension) {
      return NextResponse.json(
        { success: false, error: `File must have an extension. Allowed types: ${allowedExtensions.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Check if file extension is allowed (case-insensitive)
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, error: `File type '${fileExtension}' not allowed. Allowed types: ${allowedExtensions.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Validate MIME type matches extension (tolerant approach)
    const expectedMimeTypes = allowedMimeTypes[fileExtension as keyof typeof allowedMimeTypes];
    if (expectedMimeTypes && file.type && !expectedMimeTypes.includes(file.type)) {
      // Only reject if MIME type is provided and doesn't match expected types
      // Empty MIME types are acceptable when extension matches
      return NextResponse.json(
        { success: false, error: `File MIME type '${file.type}' does not match extension '${fileExtension}'. Expected: ${expectedMimeTypes.filter(t => t !== '').join(', ')}` },
        { status: 400 }
      );
    }

    // Calculate file hash first (needed for unique filename generation)
    const fileHash = await computeSHA256(file);
    
    // Generate unique filename to prevent collisions
    const uniqueFilename = generateUniqueFilename(fileName, fileHash);
    
    // Sanitize category path to prevent traversal
    const sanitizedCategory = sanitizePathComponent(category);
    
    // Determine visibility based on phase if not explicitly provided
    let visibilityArray: string[];
    if (visibility) {
      visibilityArray = visibility.split(',').map(v => v.trim());
    } else {
      // Set default visibility based on phase using phase mapping
      visibilityArray = getPhaseVisibility(phase);
    }
    
    // Get blob access level from phase mapping
    const blobAccess = getPhaseBlobAccess(phase);

    // Upload to Vercel Blob with secure path
    const blob = await put(`documents/${sanitizedCategory}/${uniqueFilename}`, file, {
      access: blobAccess,
      addRandomSuffix: true,
    });

    // For blob-only storage, we don't need to create a separate metadata record
    // The document metadata is derived from the blob storage itself
    // Create a document object for the response
    const document = {
      id: blob.url, // Use blob URL as ID
      name: name,
      category: category,
      sanitized_name: sanitizedName,
      path_segment: sanitizedCategory,
      blob_url: blob.url,
      file_type: fileExtension,
      file_size: file.size,
      file_size_display: formatFileSize(file.size),
      file_hash: fileHash,
      status: true,
      expected: true,
      notes: notes ? `${notes} | Phase: ${phase}` : `Phase: ${phase}`,
      visibility: visibilityArray,
      due_date: due_date || null,
      last_modified: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: document
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const sizeNames = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  
  while (size >= 1024 && i < sizeNames.length - 1) {
    size /= 1024.0;
    i++;
  }
  
  return `${size.toFixed(1)} ${sizeNames[i]}`;
}
