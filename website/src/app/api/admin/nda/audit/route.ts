import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuditLogs, enableNDAStorage } from '@/lib/nda-storage';

/**
 * GET /api/admin/nda/audit - Get admin audit logs (admin only)
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
    
    // Get audit logs with admin auth
    const result = await getAdminAuditLogs(ipAddress, userAgent);
    
    if ('error' in result) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: result.auditLogs,
      count: result.auditLogs.length
    });
    
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
