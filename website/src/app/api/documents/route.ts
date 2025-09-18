import { NextRequest, NextResponse } from 'next/server';
import { DocumentStorage } from '@/lib/document-storage-blob';
import { auth } from '@/auth';

// GET /api/documents - Get all documents with optional filters
export async function GET(request: NextRequest) {
  const session = await auth();
  
  // For public documents, allow unauthenticated access but return limited data
  if (!session) {
    // Return public document preview data
    return NextResponse.json({
      success: true,
      data: [
        {
          id: 'financial-statements-2024',
          name: 'Financial Statements 2024',
          category: 'Financial',
          file_type: 'pdf',
          created_at: '2024-01-01T00:00:00Z',
          visibility: ['public']
        },
        {
          id: 'equipment-inventory',
          name: 'Equipment Inventory',
          category: 'Equipment',
          file_type: 'pdf',
          created_at: '2024-01-01T00:00:00Z',
          visibility: ['public']
        },
        {
          id: 'insurance-policies',
          name: 'Insurance Policies',
          category: 'Legal',
          file_type: 'pdf',
          created_at: '2024-01-01T00:00:00Z',
          visibility: ['public']
        },
        {
          id: 'lease-agreements',
          name: 'Lease Agreements',
          category: 'Legal',
          file_type: 'pdf',
          created_at: '2024-01-01T00:00:00Z',
          visibility: ['public']
        },
        {
          id: 'sales-data-2024',
          name: 'Sales Data 2024',
          category: 'Operational',
          file_type: 'csv',
          created_at: '2024-01-01T00:00:00Z',
          visibility: ['public']
        }
      ],
      count: 5
    });
  }
  
  // For authenticated users, check if they're admin for full access
  if (session.user?.role !== 'admin') {
    // Return limited document data for non-admin users based on their role
    try {
      const { searchParams } = new URL(request.url);
      const userRole = session.user?.role;
      
      // Scope visibility by role - only show documents appropriate for the user's role
      let visibility: string[] = ['public'];
      if (userRole === 'buyer') {
        visibility = ['public', 'buyer'];
      } else if (userRole === 'lawyer') {
        visibility = ['public', 'lawyer'];
      } else if (userRole === 'viewer') {
        visibility = ['public', 'viewer'];
      }
      
      const filters = {
        category: searchParams.get('category') || undefined,
        status: searchParams.get('status') ? searchParams.get('status') === 'true' : undefined,
        expected: searchParams.get('expected') ? searchParams.get('expected') === 'true' : undefined,
        file_type: searchParams.get('file_type') || undefined,
        visibility: visibility,
        phase: searchParams.get('phase') || undefined,
        userRole: userRole,
        search: searchParams.get('search') || undefined,
      };

      const documents = await DocumentStorage.findAll(filters);
      
      return NextResponse.json({
        success: true,
        data: documents,
        count: documents.length
      });
    } catch (error) {
      console.error('Error fetching documents for non-admin user:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }
  }

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

    const documents = await DocumentStorage.findAll(filters);
    
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
  const session = await auth();
  
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  
  if (session.user?.role !== 'admin') {
    return new NextResponse("Forbidden", { status: 403 });
  }

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

    // Sanitize name and category for path segments
    const sanitizedName = name.replace(/[<>:"/\\|?*]/g, '_');
    const sanitizedCategory = category.replace(/[<>:"/\\|?*]/g, '_');

    // For blob-only storage, we don't create metadata records directly
    // The metadata is derived from the blob storage itself
    // This endpoint is mainly for compatibility - actual document creation happens via upload
    return NextResponse.json(
      { success: false, error: 'Use /api/documents/upload to create documents' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create document' },
      { status: 500 }
    );
  }
}