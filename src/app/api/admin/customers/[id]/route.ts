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

    // Delete customer loyalty data first (foreign key constraint)
    await db.execute(
      'DELETE FROM customer_loyalty_points WHERE customer_id = ?',
      [customerId]
    );

    // Delete loyalty transactions
    await db.execute(
      'DELETE FROM loyalty_transactions WHERE customer_id = ?',
      [customerId]
    );

    // Delete customer addresses
    await db.execute(
      'DELETE FROM addresses WHERE customer_id = ?',
      [customerId]
    );

    // Update orders to remove customer reference (don't delete orders for record keeping)
    await db.execute(
      'UPDATE orders SET customer_id = NULL WHERE customer_id = ?',
      [customerId]
    );

    // Finally delete the customer
    await db.execute(
      'DELETE FROM customers WHERE id = ? AND tenant_id = ?',
      [customerId, tenantId]
    );

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete customer'
    }, { status: 500 });
  }
}
