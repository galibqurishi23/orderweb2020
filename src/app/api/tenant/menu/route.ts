import { NextRequest, NextResponse } from 'next/server';
import { getTenantMenuWithCategories } from '@/lib/tenant-menu-service';

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
