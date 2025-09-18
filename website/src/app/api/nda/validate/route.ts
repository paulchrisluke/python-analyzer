import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { validateNDASignature, enableNDAStorage } from '@/lib/nda-storage';
import { generateDocumentHash } from '@/lib/nda';
import { NDAValidationRequest, NDAValidationResponse } from '@/types/nda';
import { promises as fs } from 'fs';
import path from 'path';

// POST /api/nda/validate - Validate NDA signature integrity
export async function POST(request: NextRequest) {
  try {
    // Initialize NDA storage (in-memory only for API routes)
    await enableNDAStorage({ enablePersistence: true });
    
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can validate signatures
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body: NDAValidationRequest = await request.json();
    
    if (!body.signatureId || !body.documentHash) {
      return NextResponse.json(
        { success: false, error: 'Signature ID and document hash are required' },
        { status: 400 }
      );
    }

    // Read current NDA document and generate hash
    let ndaContent: string;
    
    try {
      const ndaPath = path.join(process.cwd(), 'src', 'data', 'nda-document.md');
      ndaContent = await fs.readFile(ndaPath, 'utf8');
    } catch (error) {
      console.error('Error reading NDA document:', error);
      return NextResponse.json(
        { success: false, error: 'NDA document not found' },
        { status: 500 }
      );
    }

    // Generate personalized content (same logic as POST endpoint)
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Function to escape HTML entities to prevent injection
    function escapeHtml(text: string): string {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    }

    const userName = escapeHtml(session.user.name || 'Potential Buyer');
    const userEmail = escapeHtml(session.user.email || 'buyer@example.com');

    const personalizedContent = ndaContent
      .replace(/\[Date\]/g, currentDate)
      .replace(/\[User Name\]/g, userName)
      .replace(/\[User Email\]/g, userEmail)
      .replace(/Mark Gustina/g, 'Mark Gustina')
      .replace(/Cranberry Hearing and Balance Center/g, 'Cranberry Hearing and Balance Center');

    const currentDocumentHash = generateDocumentHash(personalizedContent);

    // Validate signature
    const validation = await validateNDASignature(body.signatureId, body.documentHash);
    
    if (!validation.valid) {
      const response: NDAValidationResponse = {
        valid: false,
        error: validation.error
      };
      return NextResponse.json(response);
    }

    // Check if document hash matches current version
    if (body.documentHash !== currentDocumentHash) {
      const response: NDAValidationResponse = {
        valid: false,
        error: 'Document has been updated since signature'
      };
      return NextResponse.json(response);
    }

    const response: NDAValidationResponse = {
      valid: true,
      signature: validation.signature
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error validating NDA signature:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
