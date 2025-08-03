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

    const body = await request.json();
    const {
      type,
      isDefault,
      addressLine1,
      addressLine2,
      city,
      postcode,
      county,
      country,
      deliveryInstructions
    } = body;

    // Verify the address belongs to the customer
    const checkQuery = 'SELECT id FROM addresses WHERE id = ? AND customer_id = ?';
    const existingAddresses = await db.query(checkQuery, [params.id, customerId]);
    
    if (!existingAddresses || (existingAddresses as any[]).length === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // If this is being set as default, update all other addresses to not be default
    if (isDefault) {
      await db.query(
        'UPDATE addresses SET is_default = FALSE WHERE customer_id = ? AND id != ?',
        [customerId, params.id]
      );
    }

    // Update address - mapping to actual database schema
    const addressType = type === 'home' || type === 'work' ? 'delivery' : 'delivery';
    const streetAddress = addressLine2 ? `${addressLine1}, ${addressLine2}` : addressLine1;
    
    const updateQuery = `
      UPDATE addresses 
      SET type = ?, is_default = ?, street_address = ?, city = ?, postal_code = ?, country = ?
      WHERE id = ? AND customer_id = ?
    `;

    await db.query(updateQuery, [
      addressType,
      isDefault ? 1 : 0,
      streetAddress,
      city,
      postcode,
      country,
      params.id,
      customerId
    ]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Address update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
    const checkQuery = 'SELECT id, is_default FROM addresses WHERE id = ? AND customer_id = ?';
    const existingAddresses = await db.query(checkQuery, [params.id, customerId]);
    
    if (!existingAddresses || (existingAddresses as any[]).length === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    const address = (existingAddresses as any[])[0];

    // Don't allow deletion of the default address if it's the only one
    if (address.is_default) {
      const countQuery = 'SELECT COUNT(*) as count FROM addresses WHERE customer_id = ?';
      const countResult = await db.query(countQuery, [customerId]);
      const totalAddresses = (countResult[0] as any).count;

      if (totalAddresses === 1) {
        return NextResponse.json({ 
          error: 'Cannot delete the only address. Add another address first.' 
        }, { status: 400 });
      }

      // If deleting default address and there are others, make the next one default
      await db.query(
        `UPDATE addresses 
         SET is_default = TRUE 
         WHERE customer_id = ? AND id != ? 
         ORDER BY created_at ASC 
         LIMIT 1`,
        [customerId, params.id]
      );
    }

    // Delete the address
    await db.query(
      'DELETE FROM addresses WHERE id = ? AND customer_id = ?',
      [params.id, customerId]
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Address deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
