import { NextRequest, NextResponse } from 'next/server';
import { DocumentStorage } from '@/lib/document-storage-blob';
import { auth } from '@/auth';
import { hasUserSignedNDA, enableNDAStorage } from '@/lib/nda-storage';
import { isNDAExempt } from '@/lib/nda-edge';

// GET /api/documents/signed-url/[...id] - Generate a secure proxy URL for document access
// This endpoint now returns the secure proxy URL instead of a direct blob URL
// Uses catch-all route to support IDs with '/' characters
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string[] }> }
) {
  try {
    // Initialize NDA storage (in-memory only for API routes)
    await enableNDAStorage({ enablePersistence: true });
    
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
      console.warn(`Unauthorized signed URL request for document ${documentId} from ${request.headers.get('x-forwarded-for') || 'unknown IP'}`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get document metadata
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
      console.warn(`Unauthorized signed URL request for document ${documentId} by user ${session.user?.email} with role ${userRole}`);
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // NDA verification for non-admin users accessing NDA-required documents
    if (userRole !== 'admin' && document.visibility.includes('nda')) {
      const userId = session.user?.id;
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'User ID not found' },
          { status: 400 }
        );
      }

      // Check if user is exempt from NDA requirements
      // Guard against undefined userRole - treat as non-exempt
      const safeUserRole = typeof userRole === 'string' ? userRole : 'guest';
      if (!isNDAExempt(safeUserRole)) {
        const hasSignedNDA = await hasUserSignedNDA(userId);
        if (!hasSignedNDA) {
          console.warn(`NDA required but not signed for document ${documentId} by user ${session.user?.email}`);
          return NextResponse.json(
            { success: false, error: 'NDA signature required to access this document' },
            { status: 403 }
          );
        }
      }
    }

    // Generate secure proxy URL
    const signedUrl = await DocumentStorage.generateSignedUrl(documentId);
    
    if (!signedUrl) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate secure URL' },
        { status: 500 }
      );
    }

    // Log access for audit trail
    console.info(`Secure URL generated for document ${documentId} by user ${session.user?.email} (role: ${userRole})`);

    return NextResponse.json({
      success: true,
      data: {
        signedUrl,
        expiresIn: null, // Proxy URLs don't expire, access is controlled by authentication
        documentId,
        documentName: document.name
      }
    });
  } catch (error) {
    console.error('Error generating secure URL:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate secure URL' },
      { status: 500 }
    );
  }
}
