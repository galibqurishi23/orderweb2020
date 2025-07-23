import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });
    }

    // Get customers with loyalty information
    const query = `
      SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        c.date_of_birth,
        c.address,
        c.city,
        c.postal_code,
        c.customer_segment,
        c.marketing_consent,
        c.last_order_date,
        c.total_orders,
        c.total_spent,
        c.average_order_value,
        c.created_at,
        lp.points_balance,
        lp.tier_level,
        lp.total_points_earned,
        lp.total_points_redeemed
      FROM customers c
      LEFT JOIN customer_loyalty_points lp ON c.id = lp.customer_id AND lp.tenant_id = ?
      WHERE c.tenant_id = ?
      ORDER BY c.last_order_date DESC, c.total_spent DESC
    `;

    const [customers] = await db.execute(query, [tenantId, tenantId]);

    // Ensure we return an array and handle null/undefined values
    const customerList = Array.isArray(customers) ? customers : [];
    
    // Add safety checks for each customer record
    const safeCustomers = customerList.map((customer: any) => ({
      ...customer,
      name: customer.name || 'Unknown Customer',
      email: customer.email || '',
      phone: customer.phone || null,
      customer_segment: customer.customer_segment || 'regular',
      tier_level: customer.tier_level || 'bronze',
      total_orders: Number(customer.total_orders) || 0,
      total_spent: Number(customer.total_spent) || 0,
      average_order_value: Number(customer.average_order_value) || 0,
      points_balance: Number(customer.points_balance) || 0,
      total_points_earned: Number(customer.total_points_earned) || 0,
      total_points_redeemed: Number(customer.total_points_redeemed) || 0
    }));

    return NextResponse.json({
      success: true,
      customers: safeCustomers
    });

  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const body = await request.json();

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });
    }

    const {
      name,
      email,
      phone,
      date_of_birth,
      address,
      city,
      postal_code,
      customer_segment = 'new',
      marketing_consent = false,
      notes
    } = body;

    // Insert new customer
    const insertQuery = `
      INSERT INTO customers (
        tenant_id, name, email, phone, date_of_birth, address, city, 
        postal_code, customer_segment, marketing_consent, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await db.execute(insertQuery, [
      tenantId, name, email, phone, date_of_birth, address, city,
      postal_code, customer_segment, marketing_consent, notes
    ]);

    const customerId = (result as any).insertId;

    // Create loyalty points record
    const loyaltyQuery = `
      INSERT INTO customer_loyalty_points (customer_id, tenant_id, points_balance, tier_level)
      VALUES (?, ?, 100, 'bronze')
    `;
    
    await db.execute(loyaltyQuery, [customerId, tenantId]);

    // Add signup bonus transaction
    const transactionQuery = `
      INSERT INTO loyalty_transactions (customer_id, tenant_id, transaction_type, points_amount, description)
      VALUES (?, ?, 'bonus', 100, 'Welcome signup bonus')
    `;
    
    await db.execute(transactionQuery, [customerId, tenantId]);

    return NextResponse.json({
      success: true,
      message: 'Customer created successfully',
      customerId: customerId
    });

  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const customerId = searchParams.get('customerId');
    const body = await request.json();

    if (!tenantId || !customerId) {
      return NextResponse.json({ success: false, error: 'Tenant ID and Customer ID are required' }, { status: 400 });
    }

    const {
      name,
      email,
      phone,
      date_of_birth,
      address,
      city,
      postal_code,
      customer_segment,
      marketing_consent,
      notes
    } = body;

    const updateQuery = `
      UPDATE customers SET
        name = ?, email = ?, phone = ?, date_of_birth = ?, address = ?, 
        city = ?, postal_code = ?, customer_segment = ?, 
        marketing_consent = ?, notes = ?, updated_at = NOW()
      WHERE id = ? AND tenant_id = ?
    `;

    await db.execute(updateQuery, [
      name, email, phone, date_of_birth, address, city,
      postal_code, customer_segment, marketing_consent, notes,
      customerId, tenantId
    ]);

    return NextResponse.json({
      success: true,
      message: 'Customer updated successfully'
    });

  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}
