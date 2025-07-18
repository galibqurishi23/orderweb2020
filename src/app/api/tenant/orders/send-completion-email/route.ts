import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email-service';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { tenantId, orderId } = await request.json();
    
    if (!tenantId || !orderId) {
      return NextResponse.json(
        { error: 'Tenant ID and Order ID are required' },
        { status: 400 }
      );
    }

    // Get order details
    const [orderRows] = await db.execute(`
      SELECT o.*, t.business_name, t.email, t.phone, t.address, t.logo_url, t.primary_color
      FROM orders o
      JOIN tenants t ON t.id = o.tenant_id
      WHERE o.id = ? AND o.tenant_id = ?
    `, [orderId, tenantId]);

    if (!Array.isArray(orderRows) || orderRows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = (orderRows as any[])[0];

    // Get order items
    const [itemRows] = await db.execute(`
      SELECT oi.*, mi.name as menuItemName, mi.price as menuItemPrice
      FROM order_items oi
      JOIN menu_items mi ON mi.id = oi.menuItemId
      WHERE oi.orderId = ?
    `, [orderId]);

    const items = (itemRows as any[]).map(item => ({
      name: item.menuItemName,
      quantity: item.quantity,
      price: item.menuItemPrice * item.quantity
    }));

    // Send order completion email
    const emailService = new EmailService();
    
    const emailOrderData = {
      id: orderData.id,
      customer_name: orderData.customerName,
      customer_email: orderData.customerEmail,
      phone: orderData.customerPhone,
      total: parseFloat(orderData.total),
      items,
      delivery_address: orderData.address !== 'Collection' ? orderData.address : undefined,
      order_type: orderData.orderType as 'dine_in' | 'takeaway' | 'delivery',
      table_number: undefined,
      special_instructions: undefined,
      created_at: new Date(orderData.createdAt)
    };

    const emailTenantData = {
      id: orderData.tenant_id,
      business_name: orderData.business_name,
      email: orderData.email,
      phone: orderData.phone,
      address: orderData.address,
      logo_url: orderData.logo_url,
      primary_color: orderData.primary_color
    };

    await emailService.sendOrderComplete(tenantId, emailOrderData, emailTenantData);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error sending order completion email:', error);
    return NextResponse.json(
      { error: 'Failed to send completion email' },
      { status: 500 }
    );
  }
}
