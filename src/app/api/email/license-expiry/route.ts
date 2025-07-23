import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/universal-email-service';

// POST /api/email/license-expiry - Send license expiry email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      restaurant_name,
      restaurant_email,
      license_id,
      expiry_date,
      days_remaining,
      contact_url,
      tenantId
    } = body;

    // Validate required fields
    if (!restaurant_name || !restaurant_email || !license_id || !expiry_date || days_remaining === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields for license expiry email' },
        { status: 400 }
      );
    }

    // Send license expiry email using helper method
    const success = await emailService.sendLicenseExpiryEmail({
      restaurant_name,
      restaurant_email,
      license_id,
      expiry_date,
      days_remaining,
      contact_url: contact_url || `${process.env.NEXT_PUBLIC_APP_URL}/super-admin/settings`
    }, tenantId);

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'License expiry email sent successfully' 
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send license expiry email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('License expiry email API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
