import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get JWT token from cookie
    const token = request.cookies.get('customer_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    const customerId = decoded.customerId;

    // Get customer addresses
    const query = `
      SELECT * FROM customer_addresses 
      WHERE customer_id = ? 
      ORDER BY is_default DESC, created_at DESC
    `;

    const addresses = await db.query(query, [customerId]);

    return NextResponse.json({ addresses });

  } catch (error) {
    console.error('Addresses fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    // If this is being set as default, update all other addresses to not be default
    if (isDefault) {
      await db.query(
        'UPDATE customer_addresses SET is_default = FALSE WHERE customer_id = ?',
        [customerId]
      );
    }

    // Insert new address
    const insertQuery = `
      INSERT INTO customer_addresses 
      (customer_id, type, is_default, address_line_1, address_line_2, city, postcode, county, country, delivery_instructions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(insertQuery, [
      customerId,
      type,
      isDefault,
      addressLine1,
      addressLine2 || null,
      city,
      postcode,
      county || null,
      country,
      deliveryInstructions || null
    ]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Address creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
