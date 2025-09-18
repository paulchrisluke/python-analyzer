import { NextRequest, NextResponse } from 'next/server';
import { getNDAStatistics, enableNDAStorage } from '@/lib/nda-storage';
import { auth } from '@/auth';

/**
 * GET /api/admin/nda/statistics - Get NDA signature statistics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization first
    const session = await auth();
    if (!session || !session.user) {
      console.warn(`Unauthorized statistics request from ${request.headers.get('x-forwarded-for') || 'unknown IP'}`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'admin') {
      console.warn(`Non-admin user ${session.user.email} attempted to access NDA statistics`);
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Initialize NDA storage (in-memory only for API routes)
    await enableNDAStorage({ enablePersistence: false });
    
    // Get statistics
    const statistics = await getNDAStatistics();
    
    // Sanitize PII from recentSignatures
    const sanitizedStatistics = {
      ...statistics,
      recentSignatures: statistics.recentSignatures.map(sig => ({
        id: sig.id,
        signedAt: sig.signedAt,
        ndaVersion: sig.ndaVersion,
        // Remove PII: userId, userEmail, userName, signatureData, ipAddress, userAgent
        // Only include non-identifying fields
        userRole: 'anonymous', // Anonymized role
        documentHash: sig.documentHash.substring(0, 8) + '...' // Truncated hash for integrity check
      }))
    };
    
    return NextResponse.json({
      success: true,
      data: sanitizedStatistics
    });
    
  } catch (error) {
    console.error('Error fetching NDA statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
