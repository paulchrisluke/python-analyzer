import { NextRequest, NextResponse } from 'next/server';
import { initializeNDAStorage, getAllNDASignatures } from '@/lib/nda-storage';

export async function GET(request: NextRequest) {
  try {
    // Initialize NDA storage
    await initializeNDAStorage();
    
    // Get all signatures
    const result = await getAllNDASignatures();
    
    if ('error' in result) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode }
      );
    }
    
    // Return just the email addresses for privacy
    const emails = result.signatures.map(sig => ({
      email: sig.userEmail,
      name: sig.userName,
      signedAt: sig.signedAt
    }));
    
    return NextResponse.json({
      success: true,
      count: emails.length,
      signatures: emails
    });
  } catch (error) {
    console.error('Error fetching NDA signatures:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch signatures' },
      { status: 500 }
    );
  }
}
