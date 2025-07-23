import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/universal-email-service';

// POST /api/email/invoice - Send invoice email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      restaurant_name,
      restaurant_email,
      invoice_id,
      amount,
      plan_name,
      billing_period,
      due_date,
      invoice_url,
      tenantId
    } = body;

    // Validate required fields
    if (!restaurant_name || !restaurant_email || !invoice_id || !amount || !plan_name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields for invoice email' },
        { status: 400 }
      );
    }

    // Send invoice email using helper method
    const success = await emailService.sendInvoiceEmail({
      restaurant_name,
      restaurant_email,
      invoice_id,
      amount,
      plan_name,
      billing_period: billing_period || 'Monthly',
      due_date: due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      invoice_url
    }, tenantId);

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Invoice email sent successfully' 
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send invoice email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Invoice email API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
