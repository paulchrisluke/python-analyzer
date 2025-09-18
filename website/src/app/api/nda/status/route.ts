import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getNDAStatus, getNDASignatureByUserId, enableNDAStorage } from '@/lib/nda-storage';
import { isNDAExempt } from '@/lib/nda';

// Force dynamic rendering to prevent static caching
export const dynamic = 'force-dynamic';

// GET /api/nda/status - Get detailed NDA status for user
export async function GET(request: NextRequest) {
  try {
    // Initialize NDA storage with Vercel Blob persistence
    await enableNDAStorage({ enablePersistence: true });
    
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    // Check if user role is exempt from NDA requirements
    if (isNDAExempt(userRole)) {
      return NextResponse.json({
        success: true,
        data: {
          isSigned: true,
          isExempt: true,
          canAccessProtectedContent: true,
          role: userRole,
          exemptReason: 'Admin users are exempt from NDA requirements'
        }
      });
    }

    // Get detailed NDA status
    const ndaStatus = await getNDAStatus(userId, session.user.email);
    const signature = await getNDASignatureByUserId(userId, session.user.email);

    return NextResponse.json({
      success: true,
      data: {
        ...ndaStatus,
        isExempt: false,
        role: userRole,
        signature: signature ? {
          id: signature.id,
          signedAt: signature.signedAt,
          version: signature.ndaVersion,
          // Don't include sensitive data like signatureData
        } : null
      }
    });

  } catch (error) {
    console.error('Error getting NDA status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
