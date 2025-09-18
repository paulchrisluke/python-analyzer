import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllNDASignatures, 
  getNDAStatistics, 
  getAdminAuditLogs,
  enableNDAStorage 
} from '@/lib/nda-storage';

/**
 * GET /api/admin/nda - Get all NDA signatures (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize NDA storage (in-memory only for API routes)
    await enableNDAStorage({ enablePersistence: false });
    
    // Get client information for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Get all signatures with admin auth
    const result = await getAllNDASignatures(ipAddress, userAgent);
    
    if ('error' in result) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: result.signatures,
      count: result.signatures.length
    });
    
  } catch (error) {
    console.error('Error fetching NDA signatures:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
