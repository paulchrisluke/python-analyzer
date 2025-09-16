import { NextRequest, NextResponse } from 'next/server';
import { DocumentStorage } from '@/lib/document-storage-blob';
import { auth } from '@/auth';

// GET /api/documents/[id]/signed-url - Generate a time-limited signed URL for document access
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

    // Authentication check
    const session = await auth();
    if (!session) {
      console.warn(`Unauthorized signed URL request for document ${id} from ${request.headers.get('x-forwarded-for') || 'unknown IP'}`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get document metadata
    const document = await DocumentStorage.findById(id);
    
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
      console.warn(`Unauthorized signed URL request for document ${id} by user ${session.user?.email} with role ${userRole}`);
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Generate signed URL with short expiry (15 minutes)
    const signedUrl = await DocumentStorage.generateSignedUrl(id, 15 * 60); // 15 minutes in seconds
    
    if (!signedUrl) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate signed URL' },
        { status: 500 }
      );
    }

    // Log access for audit trail
    console.info(`Signed URL generated for document ${id} by user ${session.user?.email} (role: ${userRole})`);

    return NextResponse.json({
      success: true,
      data: {
        signedUrl,
        expiresIn: 15 * 60, // 15 minutes in seconds
        documentId: id,
        documentName: document.name
      }
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate signed URL' },
      { status: 500 }
    );
  }
}
