import { NextRequest, NextResponse } from 'next/server';
import { DocumentStorage } from '@/lib/document-storage-blob';
import { auth } from '@/auth';
import { head } from '@vercel/blob';
import { 
  logDocumentAccess, 
  hasDocumentAccess, 
  getSecurityHeaders, 
  checkRateLimit 
} from '@/lib/document-security';

// GET /api/documents/proxy/[...id] - Serve document content through authenticated proxy
// Uses catch-all route to support IDs with '/' characters
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string[] } }
) {
  try {
    const { id } = params;
    
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
      console.warn(`Unauthorized proxy request for document ${documentId} from ${request.headers.get('x-forwarded-for') || 'unknown IP'}`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting check
    const userId = session.user?.id || 'anonymous';
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for user ${userId} accessing document ${documentId}`);
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '60',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString()
          }
        }
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
    const hasAccess = hasDocumentAccess(userRole, document);
    
    if (!hasAccess) {
      console.warn(`Unauthorized proxy request for document ${documentId} by user ${session.user?.email} with role ${userRole}`);
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get blob metadata to verify file exists
    const blobMetadata = await head(documentId);
    if (!blobMetadata) {
      return NextResponse.json(
        { success: false, error: 'Document not found in storage' },
        { status: 404 }
      );
    }

    // Fetch the actual file content from Vercel Blob
    const response = await fetch(blobMetadata.url);
    if (!response.ok) {
      console.error(`Failed to fetch document content from blob storage: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch document content' },
        { status: 500 }
      );
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');

    // Log access for audit trail
    logDocumentAccess(
      documentId,
      session.user?.id || 'unknown',
      userRole || 'unknown',
      'view',
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    );

    // Return the file content with appropriate headers - stream the response body
    const securityHeaders = getSecurityHeaders();
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${document.name}"`,
      ...securityHeaders,
      // Rate limiting headers
      'X-RateLimit-Limit': '60',
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': rateLimit.resetTime.toString()
    };

    // Add content length if available
    if (contentLength) {
      headers['Content-Length'] = contentLength;
    }

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error serving document via proxy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to serve document' },
      { status: 500 }
    );
  }
}
