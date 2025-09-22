import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET(request: NextRequest) {
  try {
    // List all files in blob storage to see what's actually there
    const { blobs } = await list({
      limit: 100
    });

    // Debug: return all blob paths to see what's available
    const allBlobPaths = blobs.map(blob => blob.pathname);
    
    // Look for any files that might contain NDA signatures
    const signatureBlobs = blobs.filter(blob => 
      blob.pathname.includes('nda') || 
      blob.pathname.includes('signature') ||
      blob.pathname.endsWith('.json')
    );

    if (signatureBlobs.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No signature files found in blob storage',
        debug: {
          totalBlobs: blobs.length,
          allPaths: allBlobPaths
        }
      });
    }

    // Try to fetch from the first signature blob found
    const signaturesBlob = signatureBlobs[0];
    const response = await fetch(signaturesBlob.url);
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch signatures',
        debug: {
          blobPath: signaturesBlob.pathname,
          blobUrl: signaturesBlob.url
        }
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
      signatures: emails,
      debug: {
        blobPath: signaturesBlob.pathname,
        totalBlobs: blobs.length
      }
    });
  } catch (error) {
    console.error('Error fetching NDA signatures:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch signatures' },
      { status: 500 }
    );
  }
}
