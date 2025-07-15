import { NextRequest, NextResponse } from 'next/server';
import { getTenantMenuWithCategories, saveTenantMenuItem, deleteTenantMenuItem, saveTenantCategory, deleteTenantCategory } from '@/lib/tenant-menu-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const menuData = await getTenantMenuWithCategories(tenantId);
    
    return NextResponse.json({
      success: true,
      data: menuData
    });
  } catch (error) {
    console.error('Error fetching tenant menu:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch menu' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const { type, data } = await request.json();
    
    if (type === 'menuItem') {
      await saveTenantMenuItem(tenantId, data);
      return NextResponse.json({
        success: true,
        message: 'Menu item saved successfully'
      });
    } else if (type === 'category') {
      await saveTenantCategory(tenantId, data);
      return NextResponse.json({
        success: true,
        message: 'Category saved successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid type specified' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error saving menu data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save menu data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    
    if (!tenantId || !type || !id) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID, type, and ID are required' },
        { status: 400 }
      );
    }

    if (type === 'menuItem') {
      await deleteTenantMenuItem(tenantId, id);
      return NextResponse.json({
        success: true,
        message: 'Menu item deleted successfully'
      });
    } else if (type === 'category') {
      await deleteTenantCategory(tenantId, id);
      return NextResponse.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid type specified' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error deleting menu data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete menu data' },
      { status: 500 }
    );
  }
}
