import { NextRequest, NextResponse } from 'next/server';
import { DocumentStorage } from '@/lib/document-storage-blob';
import { auth } from '@/auth';

// GET /api/documents/[...id] - Get a specific document
// Uses catch-all route to support IDs with '/' characters
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string[] }> }
) {
  try {
    const { id } = await params;
    
    if (!id || id.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Reconstruct the original ID by joining the array and decoding
    const documentId = decodeURIComponent(id.join('/'));
    
    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Authentication check
    const session = await auth();
    if (!session) {
      console.warn(`Unauthorized access attempt to document ${documentId} from ${request.headers.get('x-forwarded-for') || 'unknown IP'}`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const document = await DocumentStorage.findById(documentId);
    
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Authorization check - verify user has access to this document
    const userRole = session.user?.role;
    const hasAccess = userRole === 'admin' || (userRole && document.visibility.includes(userRole));
    
    if (!hasAccess) {
      console.warn(`Unauthorized access attempt to document ${documentId} by user ${session.user?.email} with role ${userRole}`);
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

// PUT /api/documents/[...id] - Update a specific document
// Uses catch-all route to support IDs with '/' characters
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string[] }> }
) {
  try {
    const { id } = await params;
    
    if (!id || id.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Reconstruct the original ID by joining the array and decoding
    const documentId = decodeURIComponent(id.join('/'));
    
    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Authentication check
    const session = await auth();
    if (!session) {
      console.warn(`Unauthorized update attempt to document ${documentId} from ${request.headers.get('x-forwarded-for') || 'unknown IP'}`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Authorization check - only admins can update documents
    if (session.user?.role !== 'admin') {
      console.warn(`Unauthorized update attempt to document ${documentId} by user ${session.user?.email} with role ${session.user?.role}`);
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, category, status, expected, notes, visibility, due_date } = body;

    // Validate input fields
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Name must be a non-empty string' },
        { status: 400 }
      );
    }

    if (category !== undefined && (typeof category !== 'string' || category.trim().length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Category must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate category against allowed categories
    if (category !== undefined) {
      const normalizedCategory = category.trim();
      const allowedCategories = DocumentStorage.getDefaultCategories();
      const categoryExists = allowedCategories.some(cat => cat.name === normalizedCategory);
      
      if (!categoryExists) {
        return NextResponse.json(
          { success: false, error: 'Invalid category' },
          { status: 400 }
        );
      }
    }

    if (status !== undefined && typeof status !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Status must be a boolean value' },
        { status: 400 }
      );
    }

    if (expected !== undefined && typeof expected !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Expected must be a boolean value' },
        { status: 400 }
      );
    }

    if (notes !== undefined && typeof notes !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Notes must be a string' },
        { status: 400 }
      );
    }

    if (visibility !== undefined && (!Array.isArray(visibility) || !visibility.every(v => typeof v === 'string'))) {
      return NextResponse.json(
        { success: false, error: 'Visibility must be an array of strings' },
        { status: 400 }
      );
    }

    if (due_date !== undefined && due_date !== null && typeof due_date !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Due date must be a string or null' },
        { status: 400 }
      );
    }

    // For blob-only storage, we can't easily update metadata
    // The metadata is derived from the blob storage itself
    // For now, we'll return the existing document
    const existingDocument = await DocumentStorage.findById(documentId);
    
    if (!existingDocument) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Document metadata updates not supported in blob-only storage mode
    return NextResponse.json({
      success: false,
      error: 'Document metadata updates not supported in blob-only storage mode'
    }, { 
      status: 501,
      headers: {
        'Allow': 'GET, DELETE'
      }
    });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[...id] - Delete a specific document
// Uses catch-all route to support IDs with '/' characters
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string[] }> }
) {
  try {
    const { id } = await params;
    
    if (!id || id.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Reconstruct the original ID by joining the array and decoding
    const documentId = decodeURIComponent(id.join('/'));
    
    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Authentication check
    const session = await auth();
    if (!session) {
      console.warn(`Unauthorized delete attempt to document ${documentId} from ${request.headers.get('x-forwarded-for') || 'unknown IP'}`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch document to check ownership/authorization
    const document = await DocumentStorage.findById(documentId);
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Authorization check - verify user has admin role or ownership
    const userRole = session.user?.role;
    const userId = session.user?.id;
    if (!userRole || (userRole !== 'admin' && !document.visibility.includes(userRole))) {
      console.warn(`Unauthorized delete attempt to document ${documentId} by user ${session.user?.email} (ID: ${userId}) with role ${userRole}`);
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    console.info(`Document ${documentId} deletion authorized for user ${session.user?.email} (ID: ${userId}) with role ${userRole}`);
    const deleted = await DocumentStorage.delete(documentId);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}