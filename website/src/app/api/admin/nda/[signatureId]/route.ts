import { NextRequest, NextResponse } from 'next/server';
import { deleteNDASignature, enableNDAStorage } from '@/lib/nda-storage';

/**
 * DELETE /api/admin/nda/[signatureId] - Delete NDA signature (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    // Initialize NDA storage (in-memory only for API routes)
    await enableNDAStorage({ enablePersistence: false });
    
    const { signatureId } = await params;
    
    if (!signatureId) {
      return NextResponse.json(
        { success: false, error: 'Signature ID is required' },
        { status: 400 }
      );
    }
    
    // Delete signature with admin auth
    const result = await deleteNDASignature(signatureId);
    
    if ('error' in result) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Signature deleted successfully',
      data: {
        deletedSignature: result.signature
      }
    });
    
  } catch (error) {
    console.error('Error deleting NDA signature:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
