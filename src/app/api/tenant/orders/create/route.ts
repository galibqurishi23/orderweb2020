import { NextRequest, NextResponse } from 'next/server';
import { createTenantOrder } from '@/lib/tenant-order-service';
import { getTenantSettings } from '@/lib/tenant-service';
import { checkOrderCapacity } from '@/lib/order-capacity-service';

export async function POST(request: NextRequest) {
  try {
    console.log('📦 Order creation request received');
    
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const orderData = await request.json();
    console.log('📄 Order data received:', {
      customerName: orderData.customerName,
      orderType: orderData.orderType,
      total: orderData.total,
      itemCount: orderData.items?.length || 0
    });
    
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

    // Get tenant settings to check throttling configuration
    const tenantSettings = await getTenantSettings(tenantId);
    let restaurantSettings = tenantSettings;
    let capacityCheck = null;
    
    if (typeof tenantSettings === 'string') {
      restaurantSettings = JSON.parse(tenantSettings);
    }

    // Check order capacity based on throttling settings (skip if no settings)
    if (restaurantSettings && restaurantSettings.orderThrottling) {
      const orderTime = orderData.scheduledTime ? new Date(orderData.scheduledTime) : new Date();
      capacityCheck = await checkOrderCapacity(tenantId, restaurantSettings.orderThrottling, orderTime);
      
      console.log('🔍 Capacity check result:', capacityCheck);
      
      if (!capacityCheck.allowed) {
        console.log('❌ Order rejected due to capacity limits');
        return NextResponse.json(
          { 
            success: false, 
            error: capacityCheck.error || 'Order capacity exceeded',
            details: {
              currentCount: capacityCheck.currentCount,
              maxCapacity: capacityCheck.maxCapacity,
              timeSlot: capacityCheck.timeSlot
            }
          },
          { status: 429 } // Too Many Requests
        );
      }
      
      console.log('✅ Capacity check passed - creating order');
    } else {
      console.log('⚠️ No throttling settings found - proceeding without capacity check');
    }
    const orderResult = await createTenantOrder(tenantId, orderData);
    
    console.log('🎉 Order created successfully:', orderResult.id);
    
    return NextResponse.json({
      success: true,
      data: { 
        orderId: orderResult.id,
        orderNumber: orderResult.orderNumber,
        total: orderResult.total,
        customerName: orderResult.customerName,
        orderType: orderResult.orderType,
        scheduledTime: orderResult.scheduledTime
      },
      message: 'Order created successfully',
      capacityInfo: capacityCheck ? {
        currentCount: capacityCheck.currentCount + 1,
        maxCapacity: capacityCheck.maxCapacity,
        timeSlot: capacityCheck.timeSlot
      } : null
    });
  } catch (error) {
    console.error('❌ Error creating tenant order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
