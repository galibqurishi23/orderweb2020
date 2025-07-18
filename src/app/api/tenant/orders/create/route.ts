import { NextRequest, NextResponse } from 'next/server';
import { createTenantOrder } from '@/lib/tenant-order-service';
import { getTenantSettings } from '@/lib/tenant-service';
import { checkOrderCapacity } from '@/lib/order-capacity-service';
import { EmailService } from '@/lib/email-service';
import db from '@/lib/db';

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
    
    // Send email notifications
    try {
      // Get tenant data for email templates
      const [tenantRows] = await db.execute(`
        SELECT id, business_name, email, phone, address, logo_url, primary_color
        FROM tenants WHERE id = ?
      `, [tenantId]);
      
      const tenantData = (tenantRows as any[])[0];
      
      if (tenantData && orderData.customerEmail) {
        const emailService = new EmailService();
        
        // Prepare order data for email
        const emailOrderData = {
          id: orderResult.id,
          customer_name: orderData.customerName,
          customer_email: orderData.customerEmail,
          phone: orderData.customerPhone,
          total: orderData.total,
          items: orderData.items.map((item: any) => ({
            name: item.menuItem.name,
            quantity: item.quantity,
            price: item.menuItem.price * item.quantity
          })),
          delivery_address: orderData.address !== 'Collection' ? orderData.address : undefined,
          order_type: orderData.orderType as 'dine_in' | 'takeaway' | 'delivery',
          table_number: undefined,
          special_instructions: orderData.items.find((item: any) => item.specialInstructions)?.specialInstructions,
          created_at: new Date()
        };
        
        // Prepare tenant data for email
        const emailTenantData = {
          id: tenantData.id,
          business_name: tenantData.business_name,
          email: tenantData.email,
          phone: tenantData.phone,
          address: tenantData.address,
          logo_url: tenantData.logo_url,
          primary_color: tenantData.primary_color
        };
        
        // Send order confirmation and restaurant notification emails
        await emailService.sendAllOrderEmails(tenantId, emailOrderData, emailTenantData);
        
        console.log('✅ Email notifications sent successfully');
      }
    } catch (emailError) {
      console.error('❌ Error sending email notifications:', emailError);
      // Don't fail the order if email fails
    }
    
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
