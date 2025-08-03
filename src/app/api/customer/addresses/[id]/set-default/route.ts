import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import db from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get JWT token from cookie
    const token = request.cookies.get('customer_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    const customerId = decoded.customerId;

    // Verify the address belongs to the customer
    const checkQuery = 'SELECT id FROM addresses WHERE id = ? AND customer_id = ?';
    const existingAddresses = await db.query(checkQuery, [params.id, customerId]);
    
    if (!existingAddresses || (existingAddresses as any[]).length === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // Update all addresses to not be default
    await db.query(
      'UPDATE addresses SET is_default = FALSE WHERE customer_id = ?',
      [customerId]
    );

    // Set the specified address as default
    await db.query(
      'UPDATE addresses SET is_default = TRUE WHERE id = ? AND customer_id = ?',
      [params.id, customerId]
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Set default address error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
