import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Validate filename to prevent path traversal
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid filename' },
        { status: 400 }
      );
    }
    
    // Add .json extension if not present
    const jsonFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
    
    // Construct the local file path
    const filePath = join(process.cwd(), 'public', 'data', jsonFilename);
    
    // Read the local JSON file
    const fileContent = await readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    
    return NextResponse.json({
      success: true,
      data: jsonData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error reading local data file:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to read data file' 
      },
      { status: 500 }
    );
  }
}
