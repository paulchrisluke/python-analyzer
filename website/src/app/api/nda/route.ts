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
  generateDocumentHash, 
  getClientIP, 
  sanitizeUserAgent,
  logNDAActivity,
  requiresNDA,
  isNDAExempt
} from '@/lib/nda';
import { NDASigningRequest, NDASigningResponse } from '@/types/nda';
import { promises as fs } from 'fs';
import path from 'path';

// GET /api/nda - Get user's NDA status
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
      return NextResponse.json(
        { success: false, error: 'Admin users are exempt from NDA requirements' },
        { status: 400 }
      );
    }


    // Check if user has already signed NDA
    const alreadySigned = await hasUserSignedNDA(userId);
    if (alreadySigned) {
      return NextResponse.json(
        { success: false, error: 'NDA has already been signed' },
        { status: 400 }
      );
    }

    // Parse request body
    const body: NDASigningRequest = await request.json();
    
    // Validate required fields
    if (!body.signatureData || !body.agreedToTerms || !body.understoodBinding) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
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

    // Generate personalized content (same logic as GET endpoint)
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

    const documentHash = generateDocumentHash(personalizedContent);

    // Validate document hash matches
    if (body.documentHash !== documentHash) {
      return NextResponse.json(
        { success: false, error: 'Document hash mismatch' },
        { status: 400 }
      );
    }

    // Get client information
    const ipAddress = getClientIP(request);
    const userAgent = sanitizeUserAgent(request.headers.get('user-agent') || '');

    // Store NDA signature
    const signature = await storeNDASignature({
      userId,
      userEmail: session.user.email,
      userName: session.user.name,
      signatureData: body.signatureData,
      signedAt: new Date().toISOString(),
      ipAddress,
      userAgent,
      ndaVersion: '1.0',
      documentHash
    });

    // Update user role to buyer after successful NDA signing
    if (userRole === 'viewer') {
      try {
        const { updateUserRole } = await import('@/lib/nda-storage')
        await updateUserRole(userId, session.user.email, 'buyer')
        console.log(`Updated user ${userId} role from viewer to buyer after NDA signing`)
      } catch (error) {
        console.error('Error updating user role after NDA signing:', error)
      }
    }

    // Log successful signing
    logNDAActivity(userId, 'sign', {
      signatureId: signature.id,
      userRole: 'buyer', // User is now a buyer
      ipAddress
    });

    const response: NDASigningResponse = {
      success: true,
      signatureId: signature.id,
      message: 'NDA signed successfully'
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error processing NDA signature:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
