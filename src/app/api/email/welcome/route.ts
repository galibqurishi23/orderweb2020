import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/universal-email-service';

// POST /api/email/welcome - Send welcome email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      restaurant_name,
      admin_email,
      admin_name,
      plan_name,
      trial_days,
      admin_panel_url,
      tenantId
    } = body;

    // Validate required fields
    if (!restaurant_name || !admin_email || !admin_name || !plan_name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields for welcome email' },
        { status: 400 }
      );
    }

    // Send welcome email using helper method
    const success = await emailService.sendWelcomeEmail({
      restaurant_name,
      admin_email,
      admin_name,
      plan_name,
      trial_days: trial_days || 3,
      admin_panel_url: admin_panel_url || `${process.env.NEXT_PUBLIC_APP_URL}/admin`
    }, tenantId);

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Welcome email sent successfully' 
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send welcome email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Welcome email API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
