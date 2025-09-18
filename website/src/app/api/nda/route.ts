import { NextRequest, NextResponse } from 'next/server';
import { auth, signIn } from '@/auth';
import { 
  storeNDASignature, 
  getNDAStatus, 
  hasUserSignedNDA,
  enableNDAStorage
} from '@/lib/nda-storage';
import { 
  validateSignatureData, 
  generateDocumentHash
} from '@/lib/nda';
import { 
  logNDAActivity,
  isNDAExempt
} from '@/lib/nda-edge';
import { NDASigningRequest, NDASigningResponse } from '@/types/nda';
import { promises as fs } from 'fs';
import path from 'path';

// Singleton initialization for NDA storage
let ndaStorageInitialized: Promise<void> | null = null;

async function initializeNDAStorage(): Promise<void> {
  if (!ndaStorageInitialized) {
    ndaStorageInitialized = enableNDAStorage({ enablePersistence: true });
  }
  return ndaStorageInitialized;
}

// GET /api/nda - Get user's NDA status
export async function GET(request: NextRequest) {
  try {
    // Initialize NDA storage with Vercel Blob persistence (singleton)
    await initializeNDAStorage();
    
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
          role: userRole
        }
      });
    }

    // Get NDA status for non-exempt users
    const ndaStatus = await getNDAStatus(userId);
    
    return NextResponse.json({
      success: true,
      data: {
        ...ndaStatus,
        isExempt: false,
        role: userRole
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

// POST /api/nda - Submit NDA signature
export async function POST(request: NextRequest) {
  try {
    // Initialize NDA storage with Vercel Blob persistence (singleton)
    await initializeNDAStorage();
    
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
      return NextResponse.json(
        { success: false, error: 'Admin users are exempt from NDA requirements' },
        { status: 400 }
      );
    }


    // Note: We no longer pre-check if user has signed NDA to avoid TOCTOU race condition
    // The storeNDASignature function will handle this atomically with createOnly option

    // Parse request body
    const body: NDASigningRequest = await request.json();
    
    // Validate required fields
    if (!body.signatureData || !body.agreedToTerms || !body.understoodBinding || !body.effectiveDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate effectiveDate format
    const dateRegex = /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}$/;
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    
    if (!dateRegex.test(body.effectiveDate) && !isoDateRegex.test(body.effectiveDate)) {
      return NextResponse.json(
        { success: false, error: 'Invalid effectiveDate format. Expected "Month DD, YYYY" or ISO string' },
        { status: 400 }
      );
    }

    // Validate signature data
    const signatureValidation = validateSignatureData(body.signatureData);
    if (!signatureValidation.valid) {
      return NextResponse.json(
        { success: false, error: signatureValidation.error },
        { status: 400 }
      );
    }

    // Read NDA document and generate personalized content (same as GET endpoint)
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

    // Use client-provided effectiveDate for consistent hashing
    const currentDate = body.effectiveDate;

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
      .replace(/Cranberry Hearing and Balance Center/g, 'Cranberry Hearing and Balance Center')
      // Additional client-side replacements to match document route
      .replace(/Potential Buyer\(s\)/g, userName)
      .replace(/Name: _________________________/g, `Name: ${userName}`)
      .replace(/Title: _________________________/g, 'Title: Potential Buyer');

    const documentHash = generateDocumentHash(personalizedContent);

    // Validate document hash matches
    if (body.documentHash !== documentHash) {
      return NextResponse.json(
        { success: false, error: 'Document hash mismatch' },
        { status: 400 }
      );
    }

    // Store NDA signature with createOnly to prevent overwriting existing signatures
    let signature;
    try {
      // Convert effectiveDate to ISO string for storage
      const signedAt = dateRegex.test(body.effectiveDate) 
        ? new Date(body.effectiveDate).toISOString()
        : body.effectiveDate; // Already ISO format

      signature = await storeNDASignature({
        userId,
        userEmail: session.user.email,
        userName: session.user.name,
        signatureData: body.signatureData,
        signedAt,
        ndaVersion: '1.0',
        documentHash
      }, { createOnly: true });
    } catch (error) {
      if (error instanceof Error && error.message === 'NDA signature already exists for this user') {
        return NextResponse.json(
          { success: false, error: 'NDA has already been signed' },
          { status: 400 }
        );
      }
      throw error; // Re-throw unexpected errors
    }

    // Log successful signing
    logNDAActivity(userId, 'sign', {
      signatureId: signature.id,
      userRole: 'buyer' // User is now a buyer
    });

    const response: NDASigningResponse = {
      success: true,
      signatureId: signature.id,
      message: 'NDA signed successfully'
    };

    // Set httpOnly cookie to indicate NDA has been signed
    const responseWithCookie = NextResponse.json(response, { status: 201 });
    responseWithCookie.cookies.set('nda_signed', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 * 2 // 2 years (matches NDA term)
    });

    return responseWithCookie;

  } catch (error) {
    console.error('Error processing NDA signature:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
