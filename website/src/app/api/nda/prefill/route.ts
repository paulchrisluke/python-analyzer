import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';
import { createHash } from 'crypto';
import { z } from 'zod';

// Email validation regex - RFC 5322 compliant
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Validation schemas
const prefillSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Name cannot be empty after trimming')
    .refine(val => !/[<>\"'&]/.test(val), 'Name contains invalid characters'),
  email: z.string()
    .min(1, 'Email is required')
    .max(254, 'Email must be 254 characters or less')
    .transform(val => val.trim().toLowerCase())
    .refine(val => val.length > 0, 'Email cannot be empty after trimming')
    .refine(val => EMAIL_REGEX.test(val), 'Invalid email format'),
  phone: z.string()
    .max(20, 'Phone must be 20 characters or less')
    .transform(val => val?.trim() || '')
    .optional()
    .default(''),
  message: z.string()
    .max(1000, 'Message must be 1000 characters or less')
    .transform(val => val?.trim() || '')
    .optional()
    .default('')
});

// In-memory store for prefill data (in production, use Redis or database)
const prefillStore = new Map<string, {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  submittedAt: string;
  expiresAt: number;
}>();

// Clean up expired entries lazily
// Note: For production serverless environments, consider using an external scheduled job
// (e.g., Vercel Cron Jobs, AWS Lambda scheduled events) for non-lazy cleanup
function cleanupExpired() {
  const now = Date.now();
  for (const [nonce, data] of prefillStore) {
    if (now > data.expiresAt) {
      prefillStore.delete(nonce);
    }
  }
}

// POST /api/nda/prefill - Store PII securely and return nonce
export async function POST(request: NextRequest) {
  try {
    // Clean up expired entries before processing
    cleanupExpired();
    
    const body = await request.json();
    
    // Validate and sanitize input data
    const validationResult = prefillSchema.safeParse(body);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;

    // Generate secure nonce
    const nonce = crypto.randomBytes(32).toString('hex');
    
    // Generate server-side timestamp
    const submittedAt = new Date().toISOString();
    
    // Store PII data with 30-minute expiration
    const expiresAt = Date.now() + (30 * 60 * 1000); // 30 minutes
    
    prefillStore.set(nonce, {
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone,
      message: validatedData.message,
      submittedAt,
      expiresAt
    });

    // Create response with secure HttpOnly cookie
    const response = NextResponse.json({
      success: true,
      nonce,
      expiresAt: new Date(expiresAt).toISOString()
    });

    // Set secure HttpOnly cookie with proper security flags
    response.cookies.set('nda_prefill_nonce', nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60, // 30 minutes in seconds
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Error storing prefill data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/nda/prefill - Retrieve non-PII prefill data from httpOnly cookie
export async function GET(request: NextRequest) {
  try {
    // Clean up expired entries before processing
    cleanupExpired();
    
    // Get nonce from httpOnly cookie
    const nonce = request.cookies.get('nda_prefill_nonce')?.value;
    
    if (!nonce || nonce.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'No valid session found' },
        { status: 404 }
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
        emailHash: crypto.createHash('sha256').update(data.email).digest('hex').substring(0, 8),
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

// DELETE /api/nda/prefill - Clear session and httpOnly cookie
export async function DELETE(request: NextRequest) {
  try {
    // Get nonce from httpOnly cookie
    const nonce = request.cookies.get('nda_prefill_nonce')?.value;
    
    if (nonce) {
      // Remove data from store
      prefillStore.delete(nonce);
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Session cleared successfully'
    });

    // Clear the httpOnly cookie
    response.cookies.set('nda_prefill_nonce', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Error clearing prefill session:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
