import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { createHash } from 'crypto';
import { DocumentStorage } from '@/lib/document-storage-server';

// POST /api/documents/upload - Upload a document file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const category = formData.get('category') as string;
    const notes = formData.get('notes') as string;
    const visibility = formData.get('visibility') as string;
    const due_date = formData.get('due_date') as string;

    // Validate required fields
    if (!file || !name || !category) {
      return NextResponse.json(
        { success: false, error: 'File, name, and category are required' },
        { status: 400 }
      );
    }

    // Validate file size (4.5MB limit for server uploads)
    if (file.size > 4.5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 4.5MB' },
        { status: 400 }
      );
    }

    // Calculate file hash
    const buffer = await file.arrayBuffer();
    const hash = createHash('sha256');
    hash.update(Buffer.from(buffer));
    const fileHash = hash.digest('hex');

    // Upload to Vercel Blob
    const blob = await put(`documents/${category}/${file.name}`, file, {
      access: 'public',
    });

    // Create document record
    const document = DocumentStorage.create({
      name,
      category,
      blob_url: blob.url,
      file_type: `.${file.name.split('.').pop()?.toLowerCase()}`,
      file_size: file.size,
      file_size_display: formatFileSize(file.size),
      file_hash: fileHash,
      status: true,
      expected: true,
      notes: notes || '',
      visibility: visibility ? visibility.split(',') : ['admin'],
      due_date: due_date || null,
      last_modified: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: document
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const sizeNames = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  
  while (size >= 1024 && i < sizeNames.length - 1) {
    size /= 1024.0;
    i++;
  }
  
  return `${size.toFixed(1)} ${sizeNames[i]}`;
}
