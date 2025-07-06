import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/lib/tenant-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const orders = await OrderService.getTenantOrders(tenantId, limit);
    
    return NextResponse.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching tenant orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
