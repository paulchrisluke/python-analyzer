import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { 
  storeNDASignature, 
  getNDAStatus, 
  hasUserSignedNDA 
} from '@/lib/nda-storage';
import { 
  validateSignatureData, 
  generateDocumentHash, 
  checkNDARateLimit, 
  getClientIP, 
  sanitizeUserAgent,
  logNDAActivity,
  requiresNDA,
  isNDAExempt
} from '@/lib/nda';
import { NDASigningRequest, NDASigningResponse } from '@/types/nda';

// GET /api/nda - Get user's NDA status
export async function GET(request: NextRequest) {
  try {
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

    // Check rate limiting
    const rateLimit = checkNDARateLimit(userId);
    if (!rateLimit.allowed) {
      logNDAActivity(userId, 'rate_limited', { 
        attempts: rateLimit.attempts,
        resetTime: rateLimit.resetTime 
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many signing attempts. Please try again later.',
          rateLimit: {
            attempts: rateLimit.attempts,
            maxAttempts: rateLimit.maxAttempts,
            resetTime: rateLimit.resetTime
          }
        },
        { status: 429 }
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

    // Read NDA document and generate hash
    let ndaContent: string;
    
    try {
      const fs = require('fs');
      const path = require('path');
      const ndaPath = path.join(process.cwd(), 'src', 'data', 'nda-document.md');
      ndaContent = fs.readFileSync(ndaPath, 'utf8');
    } catch (error) {
      console.error('Error reading NDA document:', error);
      return NextResponse.json(
        { success: false, error: 'NDA document not found' },
        { status: 500 }
      );
    }

    const documentHash = generateDocumentHash(ndaContent);

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

    // Log successful signing
    logNDAActivity(userId, 'sign', {
      signatureId: signature.id,
      userRole,
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
