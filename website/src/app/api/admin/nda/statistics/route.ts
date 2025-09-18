import { NextRequest, NextResponse } from 'next/server';
import { getNDAStatistics, enableNDAStorage } from '@/lib/nda-storage';

/**
 * GET /api/admin/nda/statistics - Get NDA signature statistics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize NDA storage (in-memory only for API routes)
    await enableNDAStorage({ enablePersistence: false });
    
    // Get statistics
    const statistics = await getNDAStatistics();
    
    return NextResponse.json({
      success: true,
      data: statistics
    });
    
  } catch (error) {
    console.error('Error fetching NDA statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
