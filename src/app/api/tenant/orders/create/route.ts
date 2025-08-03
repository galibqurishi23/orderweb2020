import { NextRequest, NextResponse } from 'next/server';
import { createTenantOrder } from '@/lib/tenant-order-service';
import { getTenantSettings } from '@/lib/tenant-service';
import { checkOrderCapacity } from '@/lib/order-capacity-service';
import { tenantEmailService } from '@/lib/tenant-email-service';
import { emailTemplateService } from '@/lib/email-template-service';
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
    
    // Transform orderData to fetch menu item details
    console.log('🔍 Fetching menu item details for order items...');
    const enrichedItems = await Promise.all(
      orderData.items.map(async (item: any) => {
        // Check if item already has menuItem object (from web interface)
        if (item.menuItem && item.menuItem.id) {
          console.log('📋 Item already has menuItem object:', item.menuItem.name);
          return item;
        }
        
        // If not, fetch menu item details using menuItemId (from API calls)
        const menuItemId = item.menuItemId || item.id;
        if (!menuItemId) {
          throw new Error('Menu item ID is required');
        }
        
        const [menuItemRows] = await db.execute(
          'SELECT id, name, price FROM menu_items WHERE id = ? AND tenant_id = ?',
          [menuItemId, tenantId]
        );
        
        const menuItem = (menuItemRows as any[])[0];
        if (!menuItem) {
          throw new Error(`Menu item not found: ${menuItemId}`);
        }
        
        return {
          ...item,
          menuItem: menuItem
        };
      })
    );
    
    // Update orderData with enriched items and default values
    const enrichedOrderData = {
      ...orderData,
      items: enrichedItems,
      isAdvanceOrder: orderData.isAdvanceOrder || false,
      subtotal: orderData.subtotal || (orderData.total - (orderData.deliveryFee || 0)),
      deliveryFee: orderData.deliveryFee || 0,
      discount: orderData.discount || 0,
      // No tax - application is tax-free
      address: orderData.address || 'Collection',
      scheduledDate: orderData.scheduledDate, // Ensure scheduled date is preserved
      scheduledFor: orderData.scheduledFor, // Ensure scheduled for is preserved
      voucherCode: orderData.voucherCode, // Preserve voucher code
      voucherDiscount: orderData.voucherDiscount || orderData.discount // Preserve voucher discount
    };
    
    console.log('✅ Menu items fetched successfully');
    console.log('🔍 About to create order with enriched data:', JSON.stringify({
      orderType: enrichedOrderData.orderType,
      isAdvanceOrder: enrichedOrderData.isAdvanceOrder,
      scheduledTime: enrichedOrderData.scheduledTime,
      customerName: enrichedOrderData.customerName,
      total: enrichedOrderData.total
    }, null, 2));
    
    let orderResult;
    try {
      orderResult = await createTenantOrder(tenantId, enrichedOrderData);
      console.log('🎉 Order created successfully:', orderResult.id);
    } catch (createOrderError: any) {
      console.error('❌ Error creating order:', createOrderError);
      console.error('📄 Failed order data:', JSON.stringify(enrichedOrderData, null, 2));
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create order',
          details: createOrderError?.message || 'Unknown error' 
        },
        { status: 500 }
      );
    }
    
    // Send email notifications
    try {
      // Get tenant data for email templates  
      const [tenantRows] = await db.execute(`
        SELECT t.id, t.slug, t.name, t.email, t.phone, t.address, ts.settings_json
        FROM tenants t
        LEFT JOIN tenant_settings ts ON t.id = ts.tenant_id
        WHERE t.id = ?
      `, [tenantId]);
      
      const tenantData = (tenantRows as any[])[0];
      
      // Parse settings if available
      if (tenantData && tenantData.settings_json) {
        try {
          tenantData.settings = JSON.parse(tenantData.settings_json);
        } catch (e) {
          console.error('Failed to parse tenant settings:', e);
          tenantData.settings = {};
        }
      } else {
        tenantData.settings = {};
      }
      
      console.log('🏢 Tenant data retrieved:', {
        id: tenantData?.id,
        slug: tenantData?.slug,
        name: tenantData?.name,
        email: tenantData?.email,
        hasEmail: !!tenantData?.email,
        hasSettings: !!tenantData?.settings,
        hasLogo: !!tenantData?.settings?.logo
      });
      
      if (tenantData && enrichedOrderData.customerEmail) {
        console.log('📧 Email conditions met - proceeding with email notifications');
        console.log('📧 Customer email:', enrichedOrderData.customerEmail);
        console.log('📧 Restaurant email:', tenantData.email);
        const tenantSlug = tenantData.slug;
        
        // Format order items for email
        const emailItems = enrichedOrderData.items.map((item: any) => {
          const itemTotal = (item.menuItem?.price || 0) * item.quantity;
          return {
            name: item.menuItem?.name || 'Unknown Item',
            quantity: item.quantity,
            price: itemTotal
          };
        });

        // Prepare order details for email
        const orderDetails = {
          orderNumber: orderResult.orderNumber,
          customerName: enrichedOrderData.customerName,
          customerEmail: enrichedOrderData.customerEmail,
          customerPhone: enrichedOrderData.customerPhone,
          subtotal: enrichedOrderData.subtotal,
          deliveryFee: enrichedOrderData.deliveryFee,
          discount: enrichedOrderData.discount,
          // No tax field - application is tax-free
          total: enrichedOrderData.total,
          items: emailItems,
          orderType: enrichedOrderData.orderType,
          deliveryAddress: enrichedOrderData.address !== 'Collection' ? enrichedOrderData.address : undefined,
          specialInstructions: enrichedOrderData.specialInstructions || enrichedOrderData.items.find((item: any) => item.specialInstructions)?.specialInstructions,
          restaurantName: tenantData.name || 'Restaurant',
          scheduledTime: orderData.scheduledTime, // Use original scheduledTime from frontend
          scheduledDate: enrichedOrderData.scheduledDate, // Pass scheduled date to email template
          scheduledFor: enrichedOrderData.scheduledFor, // Pass scheduled for to email template  
          isAdvanceOrder: enrichedOrderData.isAdvanceOrder, // Pass advance order flag
          voucherCode: enrichedOrderData.voucherCode, // Pass voucher code
          voucherDiscount: enrichedOrderData.voucherDiscount || enrichedOrderData.discount // Pass voucher discount
        };

        // Generate custom email template for customer confirmation
        console.log('📧 Generating custom email template for customer confirmation...');
        const customerEmailHtml = await emailTemplateService.generateOrderConfirmationEmail(
          tenantSlug,
          orderDetails,
          tenantData
        );
        console.log('📧 Custom email template generated successfully');

        const customerEmailResult = await tenantEmailService.sendEmailForTenant(tenantSlug, {
          to: orderDetails.customerEmail,
          subject: `Order Confirmation #${orderDetails.orderNumber} - ${orderDetails.restaurantName}`,
          html: customerEmailHtml
        });

        if (customerEmailResult.success) {
          console.log('✅ Customer confirmation email sent successfully');
        } else {
          console.error('❌ Failed to send customer confirmation email:', customerEmailResult.error);
        }

        // Send restaurant notification email
        console.log('🍽️ Checking restaurant email notification...', { hasEmail: !!tenantData.email, email: tenantData.email });
        if (tenantData.email) {
          console.log('📧 Sending restaurant notification email to:', tenantData.email);
          const restaurantEmailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #333;">New Order Received!</h1>
                <p style="font-size: 18px; color: #666;">Order #${orderDetails.orderNumber}</p>
              </div>
              
              <div style="background: #f0f8ff; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
                <h3 style="color: #333; margin-top: 0;">Customer Details:</h3>
                <p><strong>Name:</strong> ${orderDetails.customerName}</p>
                <p><strong>Phone:</strong> ${orderDetails.customerPhone}</p>
                <p><strong>Email:</strong> ${orderDetails.customerEmail}</p>
              </div>
              
              <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
                <h3 style="color: #333; margin-top: 0;">Order Details:</h3>
                <ul style="list-style: none; padding: 0;">
                  ${orderDetails.items.map((item: any) => `
                    <li style="padding: 8px 0; border-bottom: 1px solid #eee;">
                      <span style="font-weight: bold;">${item.name}</span> 
                      <span style="float: right;">x${item.quantity} - £${item.price.toFixed(2)}</span>
                    </li>
                  `).join('')}
                </ul>
                <div style="text-align: right; margin-top: 15px; padding-top: 15px; border-top: 2px solid #333;">
                  <strong style="font-size: 18px;">Total: £${orderDetails.total.toFixed(2)}</strong>
                </div>
              </div>
              
              <div style="margin-bottom: 20px;">
                <p><strong>Order Type:</strong> ${orderDetails.orderType}</p>
                ${orderDetails.deliveryAddress ? `<p><strong>Delivery Address:</strong> ${orderDetails.deliveryAddress}</p>` : ''}
                ${orderDetails.specialInstructions ? `<p><strong>Special Instructions:</strong> ${orderDetails.specialInstructions}</p>` : ''}
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="color: #666;">This order was placed at ${new Date().toLocaleString()}</p>
              </div>
            </div>
          `;

          console.log('📧 About to send restaurant email...');
          console.log('📧 Restaurant email recipient:', tenantData.email);
          console.log('📧 Restaurant email subject:', `New Order #${orderDetails.orderNumber} - ${orderDetails.restaurantName}`);
          
          const restaurantEmailResult = await tenantEmailService.sendEmailForTenant(tenantSlug, {
            to: tenantData.email,
            subject: `New Order #${orderDetails.orderNumber} - ${orderDetails.restaurantName}`,
            html: restaurantEmailHtml
          });

          console.log('📧 Restaurant email result:', restaurantEmailResult);
          if (restaurantEmailResult.success) {
            console.log('✅ Restaurant notification email sent successfully');
          } else {
            console.error('❌ Failed to send restaurant notification email:', restaurantEmailResult.error);
          }
        } else {
          console.log('⚠️ No restaurant email address configured, skipping restaurant notification');
        }
        
        console.log('✅ Email notifications processing completed');
      } else {
        console.log('⚠️ Skipping emails - no tenant data or customer email provided', { 
          hasTenantData: !!tenantData, 
          hasCustomerEmail: !!enrichedOrderData.customerEmail,
          tenantEmail: tenantData?.email 
        });
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
      { success: false, error: 'Failed to create order', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
