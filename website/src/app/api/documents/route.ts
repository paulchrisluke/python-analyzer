import { NextRequest, NextResponse } from 'next/server';
import { DocumentStorage } from '@/lib/document-storage-server';

// GET /api/documents - Get all documents with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') ? searchParams.get('status') === 'true' : undefined,
      expected: searchParams.get('expected') ? searchParams.get('expected') === 'true' : undefined,
      file_type: searchParams.get('file_type') || undefined,
      visibility: searchParams.get('visibility') ? searchParams.get('visibility')!.split(',') : undefined,
      search: searchParams.get('search') || undefined,
    };

    const documents = DocumentStorage.findAll(filters);
    
    return NextResponse.json({
      success: true,
      data: documents,
      count: documents.length
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST /api/documents - Create a new document (metadata only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, blob_url, file_type, file_size, file_size_display, file_hash, status, expected, notes, visibility, due_date } = body;

    // Validate required fields
    if (!name || !category) {
      return NextResponse.json(
        { success: false, error: 'Document name and category are required' },
        { status: 400 }
      );
    }

    const document = DocumentStorage.create({
      name,
      category,
      blob_url: blob_url || '',
      file_type: file_type || '',
      file_size: file_size || 0,
      file_size_display: file_size_display || '0 B',
      file_hash: file_hash || '',
      status: status || false,
      expected: expected !== undefined ? expected : true,
      notes: notes || '',
      visibility: visibility || ['admin'],
      due_date: due_date || null,
      last_modified: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: document
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create document' },
      { status: 500 }
    );
  }
}
