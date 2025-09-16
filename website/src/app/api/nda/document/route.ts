import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateDocumentHash } from '@/lib/nda';

// GET /api/nda/document - Get NDA document content and hash with dynamic fields
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // Allow unauthenticated access for public NDA viewing
    // If no session, use default values

    // Read NDA document template
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

    // Replace dynamic fields with actual user data
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Use session user data or fallback to defaults
    const userName = session?.user?.name || 'Potential Buyer';
    const userEmail = session?.user?.email || 'buyer@example.com';

    const personalizedContent = ndaContent
      .replace(/\[Date\]/g, currentDate)
      .replace(/\[User Name\]/g, userName)
      .replace(/\[User Email\]/g, userEmail)
      .replace(/Mark Gustina/g, 'Mark Gustina')
      .replace(/Cranberry Hearing and Balance Center/g, 'Cranberry Hearing and Balance Center');

    // Generate document hash based on the personalized content
    const documentHash = generateDocumentHash(personalizedContent);

    return NextResponse.json({
      success: true,
      data: {
        content: personalizedContent,
        hash: documentHash,
        version: '1.0',
        effectiveDate: currentDate,
        userInfo: {
          name: session?.user?.name || 'Potential Buyer',
          email: session?.user?.email || 'buyer@example.com',
          role: session?.user?.role || 'buyer'
        }
      }
    });

  } catch (error) {
    console.error('Error serving NDA document:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
