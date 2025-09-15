import { NextRequest, NextResponse } from 'next/server';
import { loadCategories, saveCategories } from '@/lib/document-storage-server';
import { DocumentStorage } from '@/lib/document-storage-server';
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

    let categories = loadCategories();

    if (withCounts) {
      const documents = DocumentStorage.findAll();
      const stats = DocumentStorage.getStats();
      
      categories = categories.map(category => ({
        ...category,
        document_count: stats.by_category[category.name] || 0,
        found_count: documents.filter(doc => doc.category === category.name && doc.status).length,
        missing_count: documents.filter(doc => doc.category === category.name && !doc.status).length
      }));
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

    const categories = loadCategories();
    
    // Check if category already exists
    if (categories.find(cat => cat.name === name)) {
      return NextResponse.json(
        { success: false, error: 'Category already exists' },
        { status: 400 }
      );
    }

    const newCategory = {
      name,
      description: description || '',
      required: required || false,
      frequency: frequency || 'as_needed',
      period: period || 'current'
    };

    categories.push(newCategory);
    saveCategories(categories);

    return NextResponse.json({
      success: true,
      data: newCategory
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}