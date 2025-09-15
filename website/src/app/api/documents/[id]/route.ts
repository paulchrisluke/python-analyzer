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

    const document = DocumentStorage.findById(id);
    
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

    const updatedDocument = DocumentStorage.update(id, {
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

    const deleted = DocumentStorage.delete(id);
    
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
