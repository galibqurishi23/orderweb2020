import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const tenantId = searchParams.get('tenantId');
    const limit = searchParams.get('limit') || '20';
    const offset = searchParams.get('offset') || '0';

    if (!customerId || !tenantId) {
      return NextResponse.json({
        success: false,
        error: 'Customer ID and Tenant ID are required'
      }, { status: 400 });
    }

    // Get orders from last 3 months only
    const [orders] = await db.execute(`
      SELECT 
        o.id,
        o.total,
        o.status,
        o.created_at,
        o.delivery_address,
        o.special_instructions,
        COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_id = ? 
      AND o.tenant_id = ? 
      AND o.created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [customerId, tenantId, parseInt(limit), parseInt(offset)]);

    // Get total count for pagination
    const [countResult] = await db.execute(`
      SELECT COUNT(*) as total
      FROM orders
      WHERE customer_id = ? 
      AND tenant_id = ? 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
    `, [customerId, tenantId]);

    const totalOrders = (countResult as any[])[0]?.total || 0;

    return NextResponse.json({
      success: true,
      orders: orders,
      pagination: {
        total: totalOrders,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < totalOrders
      }
    });

  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch orders'
    }, { status: 500 });
  }
}
