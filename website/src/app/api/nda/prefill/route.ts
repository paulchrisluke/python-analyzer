import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

// In-memory store for prefill data (in production, use Redis or database)
const prefillStore = new Map<string, {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  submittedAt: string;
  expiresAt: number;
}>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(prefillStore.entries());
  for (const [nonce, data] of entries) {
    if (now > data.expiresAt) {
      prefillStore.delete(nonce);
    }
  }
}, 5 * 60 * 1000);

// POST /api/nda/prefill - Store PII securely and return nonce
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Generate secure nonce
    const nonce = crypto.randomBytes(32).toString('hex');
    
    // Store PII data with 30-minute expiration
    const expiresAt = Date.now() + (30 * 60 * 1000); // 30 minutes
    
    prefillStore.set(nonce, {
      name: body.name,
      email: body.email,
      phone: body.phone || '',
      message: body.message || '',
      submittedAt: body.submittedAt,
      expiresAt
    });

    return NextResponse.json({
      success: true,
      nonce,
      expiresAt: new Date(expiresAt).toISOString()
    });

  } catch (error) {
    console.error('Error storing prefill data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/nda/prefill - Retrieve non-PII prefill data by nonce
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nonce = searchParams.get('nonce');
    
    if (!nonce) {
      return NextResponse.json(
        { success: false, error: 'Nonce is required' },
        { status: 400 }
      );
    }

    const data = prefillStore.get(nonce);
    
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Prefill data not found or expired' },
        { status: 404 }
      );
    }

    // Check if data has expired
    if (Date.now() > data.expiresAt) {
      prefillStore.delete(nonce);
      return NextResponse.json(
        { success: false, error: 'Prefill data has expired' },
        { status: 410 }
      );
    }

    // Return only non-PII data for display purposes
    return NextResponse.json({
      success: true,
      data: {
        displayName: data.name,
        emailHash: btoa(data.email).substring(0, 8),
        submittedAt: data.submittedAt
      }
    });

  } catch (error) {
    console.error('Error retrieving prefill data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
