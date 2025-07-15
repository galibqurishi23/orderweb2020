import { NextRequest, NextResponse } from 'next/server';
import { createTenantOrder } from '@/lib/tenant-order-service';

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

    const orderData = await request.json();
    
    // Validate required fields
    if (!orderData.customerName || !orderData.customerPhone || !orderData.items || orderData.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required order information' },
        { status: 400 }
      );
    }

    // Validate order total
    if (!orderData.total || orderData.total <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid order total' },
        { status: 400 }
      );
    }

    const orderId = await createTenantOrder(tenantId, orderData);
    
    return NextResponse.json({
      success: true,
      data: { orderId },
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating tenant order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
