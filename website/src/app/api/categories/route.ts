import { NextRequest, NextResponse } from 'next/server';
import { DocumentStorage } from '@/lib/document-storage-blob';
import { auth } from '@/auth';

// GET /api/categories - Get all document categories
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  
  if (session.user?.role !== 'admin') {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const withCounts = searchParams.get('with_counts') === 'true';

    let categories = DocumentStorage.getDefaultCategories();

    if (withCounts) {
      const documents = await DocumentStorage.findAll();
      const stats = await DocumentStorage.getStats();
      
      // Build category counts in a single pass
      const categoryCounts = new Map<string, { total: number; found: number; missing: number }>();
      
      // Initialize all categories with zero counts
      categories.forEach(category => {
        categoryCounts.set(category.name, { total: 0, found: 0, missing: 0 });
      });
      
      // Single pass through documents to build counts
      documents.forEach(doc => {
        const counts = categoryCounts.get(doc.category);
        if (counts) {
          counts.total++;
          if (doc.status) {
            counts.found++;
          } else {
            counts.missing++;
          }
        }
      });
      
      // Map categories to their counts
      categories = categories.map(category => {
        const counts = categoryCounts.get(category.name) || { total: 0, found: 0, missing: 0 };
        return {
          ...category,
          document_count: stats.by_category[category.name] || 0,
          found_count: counts.found,
          missing_count: counts.missing
        };
      });
    }

    return NextResponse.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  
  if (session.user?.role !== 'admin') {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description, required, frequency, period } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    // For blob-only storage, categories are static and predefined
    // We don't allow dynamic category creation
    return NextResponse.json(
      { success: false, error: 'Categories are predefined and cannot be created dynamically' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}