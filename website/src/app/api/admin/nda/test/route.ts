import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * GET /api/admin/nda/test - Test admin authentication (admin only)
 * This endpoint can be used to verify that admin authentication is working correctly
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Not authenticated',
          statusCode: 401 
        },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient permissions - admin role required',
          statusCode: 403,
          userRole: session.user.role 
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Admin authentication successful',
      data: {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        name: session.user.name
      }
    });
    
  } catch (error) {
    console.error('Error testing admin authentication:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
