import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * DELETE /api/admin/customers/[id]
 * Delete a customer
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id;
    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tenant ID is required' 
      }, { status: 400 });
    }

    // Check if customer exists and belongs to tenant
    const [customerCheck] = await db.execute(
      'SELECT id FROM customers WHERE id = ? AND tenant_id = ?',
      [customerId, tenantId]
    );

    if ((customerCheck as any[]).length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Customer not found' 
      }, { status: 404 });
    }

    console.log('🗑️ Starting customer deletion process for:', customerId);

    // Delete customer loyalty data first (foreign key constraint)
    await db.execute(
      'DELETE FROM customer_loyalty_points WHERE customer_id = ?',
      [customerId]
    );
    console.log('✅ Deleted customer loyalty points');

    // Delete loyalty transactions
    await db.execute(
      'DELETE FROM loyalty_transactions WHERE customer_id = ?',
      [customerId]
    );
    console.log('✅ Deleted loyalty transactions');

    // Delete customer addresses - using correct column name
    await db.execute(
      'DELETE FROM addresses WHERE customerId = ?',
      [customerId]
    );
    console.log('✅ Deleted customer addresses');

    // Delete order items for orders belonging to this customer
    await db.execute(
      'DELETE oi FROM order_items oi INNER JOIN orders o ON oi.orderId = o.id WHERE o.customerId = ?',
      [customerId]
    );
    console.log('✅ Deleted order items');

    // Delete orders belonging to this customer (complete removal)
    await db.execute(
      'DELETE FROM orders WHERE customerId = ?',
      [customerId]
    );
    console.log('✅ Deleted customer orders');

    // Finally delete the customer
    await db.execute(
      'DELETE FROM customers WHERE id = ? AND tenant_id = ?',
      [customerId, tenantId]
    );
    console.log('✅ Deleted customer record');

    console.log('🎉 Customer deletion completed successfully');
    return NextResponse.json({
      success: true,
      message: 'Customer and all associated data deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete customer'
    }, { status: 500 });
  }
}
