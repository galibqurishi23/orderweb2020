import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/universal-email-service';
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

    await emailService.sendEmail({
      to: emailOrderData.customer_email,
      subject: `Order Complete #${emailOrderData.id} - ${emailTenantData.business_name}`,
      html: `
        <h2>Order Complete!</h2>
        <p>Dear ${emailOrderData.customer_name},</p>
        <p>Your order is now complete and ready for collection/delivery!</p>
        <h3>Order Details:</h3>
        <ul>
          ${emailOrderData.items.map((item: any) => `
            <li>${item.name} x ${item.quantity} - £${item.price.toFixed(2)}</li>
          `).join('')}
        </ul>
        <p><strong>Total: £${emailOrderData.total.toFixed(2)}</strong></p>
        <p>Order Type: ${emailOrderData.order_type}</p>
        ${emailOrderData.delivery_address ? `<p>Delivery Address: ${emailOrderData.delivery_address}</p>` : ''}
        <p>Thank you for choosing ${emailTenantData.business_name}!</p>
      `
    }, { type: 'tenant', tenantId, userId: emailOrderData.id });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error sending order completion email:', error);
    return NextResponse.json(
      { error: 'Failed to send completion email' },
      { status: 500 }
    );
  }
}
