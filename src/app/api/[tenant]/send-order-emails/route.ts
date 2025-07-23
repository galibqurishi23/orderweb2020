import { NextRequest, NextResponse } from 'next/server';
import { orderEmailService, OrderEmailData } from '@/lib/order-email-automation';

export async function POST(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const tenantId = params.tenant;
    const orderData: OrderEmailData = await request.json();
    
    // Validate required fields
    const requiredFields: (keyof OrderEmailData)[] = ['orderId', 'orderNumber', 'customerName', 'customerEmail', 'items', 'totalAmount', 'orderType', 'paymentMethod'];
    const missingFields = requiredFields.filter(field => !orderData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(orderData.customerEmail)) {
      return NextResponse.json(
        { success: false, message: 'Invalid customer email format' },
        { status: 400 }
      );
    }

    // Validate items array
    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    // Validate total amount
    if (typeof orderData.totalAmount !== 'number' || orderData.totalAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid total amount' },
        { status: 400 }
      );
    }

    // Set tenant ID and default values
    const emailData: OrderEmailData = {
      ...orderData,
      tenantId,
      orderTime: orderData.orderTime ? new Date(orderData.orderTime) : new Date()
    };

    // Send emails immediately (for real-time response)
    const result = await orderEmailService.sendOrderEmails(emailData);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Order emails sent successfully',
        details: {
          customerEmail: orderData.customerEmail,
          orderId: orderData.orderId,
          orderNumber: orderData.orderNumber
        }
      });
    } else {
      // Even if some emails failed, return success but include errors
      return NextResponse.json({
        success: true,
        message: 'Order emails processed with some errors',
        errors: result.errors,
        details: {
          customerEmail: orderData.customerEmail,
          orderId: orderData.orderId,
          orderNumber: orderData.orderNumber
        }
      }, { status: 206 }); // 206 = Partial Content
    }

  } catch (error) {
    console.error('Error sending order emails:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to send order emails',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Alternative endpoint for queuing emails (better for high volume)
export async function PUT(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const tenantId = params.tenant;
    const orderData: OrderEmailData = await request.json();
    
    // Basic validation
    if (!orderData.orderId || !orderData.customerEmail) {
      return NextResponse.json(
        { success: false, message: 'Order ID and customer email are required' },
        { status: 400 }
      );
    }

    // Set tenant ID and default values
    const emailData: OrderEmailData = {
      ...orderData,
      tenantId,
      orderTime: orderData.orderTime ? new Date(orderData.orderTime) : new Date()
    };

    // Queue emails for background processing
    const queued = await orderEmailService.queueOrderEmails(emailData);
    
    if (queued) {
      return NextResponse.json({
        success: true,
        message: 'Order emails queued successfully',
        details: {
          customerEmail: orderData.customerEmail,
          orderId: orderData.orderId,
          orderNumber: orderData.orderNumber,
          queuedAt: new Date().toISOString()
        }
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to queue order emails' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error queuing order emails:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to queue order emails',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
