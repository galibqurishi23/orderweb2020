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
      SELECT * FROM addresses 
      WHERE customer_id = ? 
      ORDER BY is_default DESC, created_at DESC
    `;

    const dbAddresses = await db.query(query, [customerId]);
    
    // Map database fields to frontend format
    const addresses = (dbAddresses as any[]).map(addr => ({
      id: addr.id,
      type: addr.type === 'delivery' ? 'home' : 'work', // Map to frontend type
      isDefault: !!addr.is_default,
      addressLine1: addr.street_address.split(', ')[0] || addr.street_address,
      addressLine2: addr.street_address.split(', ')[1] || '',
      city: addr.city,
      postcode: addr.postal_code,
      country: addr.country,
      createdAt: addr.created_at
    }));

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
        'UPDATE addresses SET is_default = FALSE WHERE customer_id = ?',
        [customerId]
      );
    }

    // Generate ID for the new address
    const addressId = `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert new address - mapping to actual database schema
    const insertQuery = `
      INSERT INTO addresses 
      (id, customer_id, type, street_address, city, postal_code, country, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Map the form data to database schema
    const addressType = type === 'home' || type === 'work' ? 'delivery' : 'delivery'; // addresses table only has delivery/billing
    const streetAddress = addressLine2 ? `${addressLine1}, ${addressLine2}` : addressLine1;

    await db.query(insertQuery, [
      addressId,
      customerId,
      addressType,
      streetAddress,
      city,
      postcode,
      country,
      isDefault ? 1 : 0
    ]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Address creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
