import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuditLogs, enableNDAStorage } from '@/lib/nda-storage';

/**
 * GET /api/admin/nda/audit - Get admin audit logs (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize NDA storage (in-memory only for API routes)
    await enableNDAStorage({ enablePersistence: false });
    
    // Get admin audit logs (includes authentication check)
    const result = await getAdminAuditLogs();
    
    if ('error' in result) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode }
      );
    }
    
    return NextResponse.json({
      success: true,
      auditLogs: result.auditLogs
    });
    
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
