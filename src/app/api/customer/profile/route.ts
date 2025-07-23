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

    // Get customer profile with preferences
    const customerQuery = `
      SELECT 
        c.*,
        cp.email_notifications,
        cp.sms_notifications,
        cp.promotional_emails,
        cp.order_updates,
        cp.dietary_restrictions
      FROM customers c
      LEFT JOIN customer_preferences cp ON c.id = cp.customer_id
      WHERE c.id = ?
    `;

    const customers = await db.query(customerQuery, [customerId]);
    
    if (!customers || (customers as any[]).length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const customer = (customers as any[])[0];

    // Format response
    const profile = {
      id: customer.id,
      firstName: customer.first_name,
      lastName: customer.last_name,
      email: customer.email,
      phone: customer.phone || '',
      dateOfBirth: customer.date_of_birth || '',
      loyaltyTier: customer.loyalty_tier || 'bronze',
      totalPoints: customer.loyalty_points || 0,
      totalOrders: customer.total_orders || 0,
      memberSince: customer.created_at,
      preferences: {
        emailNotifications: customer.email_notifications || true,
        smsNotifications: customer.sms_notifications || false,
        promotionalEmails: customer.promotional_emails || true,
        orderUpdates: customer.order_updates || true,
        dietaryRestrictions: customer.dietary_restrictions || '',
        favoriteItems: []
      }
    };

    return NextResponse.json({ profile });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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
    const { firstName, lastName, email, phone, dateOfBirth, preferences } = body;

    // Update customer basic info
    const updateCustomerQuery = `
      UPDATE customers 
      SET first_name = ?, last_name = ?, email = ?, phone = ?, date_of_birth = ?
      WHERE id = ?
    `;

    await db.query(updateCustomerQuery, [
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth || null,
      customerId
    ]);

    // Update or insert preferences
    const updatePreferencesQuery = `
      INSERT INTO customer_preferences 
      (customer_id, email_notifications, sms_notifications, promotional_emails, order_updates, dietary_restrictions)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      email_notifications = VALUES(email_notifications),
      sms_notifications = VALUES(sms_notifications),
      promotional_emails = VALUES(promotional_emails),
      order_updates = VALUES(order_updates),
      dietary_restrictions = VALUES(dietary_restrictions)
    `;

    await db.query(updatePreferencesQuery, [
      customerId,
      preferences.emailNotifications,
      preferences.smsNotifications,
      preferences.promotionalEmails,
      preferences.orderUpdates,
      preferences.dietaryRestrictions
    ]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
