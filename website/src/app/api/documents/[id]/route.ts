import { NextRequest, NextResponse } from 'next/server';
import { DocumentStorage } from '@/lib/document-storage-server';

// GET /api/documents/[id] - Get a specific document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const document = await DocumentStorage.findById(id);
    
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
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

// PUT /api/documents/[id] - Update a specific document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
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

    const updatedDocument = await DocumentStorage.update(id, {
      name,
      category,
      status,
      expected,
      notes,
      visibility,
      due_date
    });

    if (!updatedDocument) {
      return NextResponse.json(
        { success: false, error: 'Document not found or failed to update' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedDocument
    });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id] - Delete a specific document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const deleted = await DocumentStorage.delete(id);
    
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
