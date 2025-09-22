import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET(request: NextRequest) {
  try {
    // List all files in the NDA signatures blob storage
    const { blobs } = await list({
      prefix: 'nda-signatures/',
      limit: 100
    });

    // Find the most recent signatures file
    const signaturesBlob = blobs.find(blob => 
      blob.pathname.includes('nda-signatures') && 
      blob.pathname.endsWith('.json')
    );

    if (!signaturesBlob) {
      return NextResponse.json({
        success: false,
        error: 'No signatures found'
      });
    }

    // Fetch the signatures file content
    const response = await fetch(signaturesBlob.url);
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch signatures'
      });
    }

    const signatures = await response.json();
    
    // Return just the email addresses for privacy
    const emails = signatures.map((sig: any) => ({
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
