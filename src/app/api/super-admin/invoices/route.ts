import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { emailService } from '@/lib/universal-email-service';
import { v4 as uuidv4 } from 'uuid';

interface InvoiceLineItem {
  id: string;
  description: string;
  amount: string;
}

interface InvoiceData {
  tenantId: string;
  subscriptionPlan: 'starter' | 'professional' | 'enterprise' | 'online-order' | 'online-order-pos';
  amount: number;
  currency: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  description?: string;
  isCustomInvoice?: boolean;
  lineItems?: InvoiceLineItem[];
}

// Subscription plan pricing
const SUBSCRIPTION_PRICING = {
  starter: { monthly: 29.99, yearly: 299.99 },
  professional: { monthly: 79.99, yearly: 799.99 },
  enterprise: { monthly: 159.99, yearly: 1599.99 }
};

export async function POST(request: NextRequest) {
  try {
    const invoiceData: InvoiceData = await request.json();
    
    // Validate required fields
    if (!invoiceData.tenantId || !invoiceData.subscriptionPlan || !invoiceData.amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: tenantId, subscriptionPlan, and amount are required' },
        { status: 400 }
      );
    }

    // For custom invoices, ensure we have line items or description
    if (invoiceData.isCustomInvoice && !invoiceData.lineItems && !invoiceData.description) {
      return NextResponse.json(
        { success: false, error: 'Custom invoices require either lineItems or description' },
        { status: 400 }
      );
    }

    // Get tenant information
    const [tenantRows] = await db.execute(
      'SELECT id, slug, name, email, phone, address FROM tenants WHERE id = ?',
      [invoiceData.tenantId]
    );

    const tenantResult = tenantRows as any[];
    if (!tenantResult || tenantResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const tenant = tenantResult[0];
    const invoiceId = uuidv4();

    // Prepare description for invoice (store in separate field if needed)
    let finalDescription = invoiceData.description || '';
    if (invoiceData.lineItems && invoiceData.lineItems.length > 0) {
      finalDescription = invoiceData.lineItems.map(item => 
        `${item.description}: £${parseFloat(item.amount).toFixed(2)}`
      ).join('; ');
    }

    // Create invoice record in billing table
    await db.execute(
      `INSERT INTO billing (
        id, tenant_id, subscription_plan, amount, currency,
        billing_period_start, billing_period_end, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        invoiceId,
        invoiceData.tenantId,
        invoiceData.subscriptionPlan,
        invoiceData.amount,
        invoiceData.currency || 'GBP',
        invoiceData.billingPeriodStart,
        invoiceData.billingPeriodEnd
      ]
    );

    // Send invoice email using universal email service
    let emailResult = { success: false, error: '' };
    try {
      // Use line items description for email if available
      const planDescription = invoiceData.isCustomInvoice 
        ? 'Custom Invoice'
        : (invoiceData.subscriptionPlan === 'starter' ? 'Online Order' : 
           invoiceData.subscriptionPlan === 'professional' ? 'Online Order + POS' : 
           invoiceData.subscriptionPlan === 'online-order' ? 'Online Order' :
           invoiceData.subscriptionPlan === 'online-order-pos' ? 'Online Order + POS' :
           invoiceData.subscriptionPlan.charAt(0).toUpperCase() + invoiceData.subscriptionPlan.slice(1));

      const success = await emailService.sendInvoiceEmail({
        restaurant_name: tenant.name,
        restaurant_email: tenant.email,
        invoice_id: invoiceId.slice(0, 8),
        amount: `£${invoiceData.amount.toFixed(2)}`,
        plan_name: planDescription,
        billing_period: `${invoiceData.billingPeriodStart} to ${invoiceData.billingPeriodEnd}`,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        invoice_url: `${process.env.NEXT_PUBLIC_APP_URL}/super-admin/billing`
      });

      emailResult.success = success;
      if (!success) {
        emailResult.error = 'Failed to send invoice email via email service';
      }
    } catch (emailError) {
      console.error('Failed to send invoice email:', emailError);
      emailResult.error = emailError instanceof Error ? emailError.message : 'Unknown email error';
    }

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoiceId,
        tenantId: invoiceData.tenantId,
        tenantName: tenant.name,
        tenantEmail: tenant.email,
        subscriptionPlan: invoiceData.subscriptionPlan,
        amount: invoiceData.amount,
        currency: invoiceData.currency || 'GBP',
        status: 'pending',
        description: finalDescription,
        lineItems: invoiceData.lineItems || [],
        emailSent: emailResult.success,
        emailError: emailResult.error || null
      }
    });

  } catch (error) {
    console.error('Invoice generation error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to generate invoice';
    if (error instanceof Error) {
      if (error.message.includes('ER_NO_SUCH_TABLE')) {
        errorMessage = 'Database table not found. Please check database setup.';
      } else if (error.message.includes('ER_ACCESS_DENIED')) {
        errorMessage = 'Database access denied. Please check database credentials.';
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot connect to database. Please check database server.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get('tenantId');
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    let queryStr = `
      SELECT 
        b.id, b.tenant_id, b.subscription_plan, b.amount, b.currency,
        b.billing_period_start, b.billing_period_end, b.status,
        b.payment_method, b.stripe_invoice_id, b.created_at, b.updated_at,
        t.name as tenant_name, t.email as tenant_email, t.slug as tenant_slug
      FROM billing b
      JOIN tenants t ON b.tenant_id = t.id
    `;
    
    const queryParams: any[] = [];
    const conditions: string[] = [];

    if (tenantId) {
      conditions.push('b.tenant_id = ?');
      queryParams.push(tenantId);
    }

    if (status) {
      conditions.push('b.status = ?');
      queryParams.push(status);
    }

    if (conditions.length > 0) {
      queryStr += ' WHERE ' + conditions.join(' AND ');
    }

    queryStr += ' ORDER BY b.created_at DESC LIMIT ?';
    queryParams.push(limit);

    const [invoiceRows] = await db.execute(queryStr, queryParams);
    const invoices = invoiceRows as any[];

    // Ensure amount is properly converted to number
    const processedInvoices = invoices.map(invoice => ({
      ...invoice,
      amount: typeof invoice.amount === 'string' ? parseFloat(invoice.amount) : invoice.amount || 0
    }));

    return NextResponse.json({
      success: true,
      invoices: processedInvoices || []
    });

  } catch (error) {
    console.error('Get invoices error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

function generateInvoiceEmailTemplate(data: {
  invoiceId: string;
  tenant: any;
  subscriptionPlan: string;
  amount: number;
  currency: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  description: string;
  isCustomInvoice?: boolean;
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice #${data.invoiceId.slice(0, 8)}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .invoice-details { background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .row { display: flex; justify-content: space-between; margin: 10px 0; }
        .label { font-weight: 600; color: #374151; }
        .value { color: #1f2937; }
        .amount { font-size: 24px; font-weight: bold; color: #059669; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Invoice #${data.invoiceId.slice(0, 8).toUpperCase()}</h1>
          <p>OrderWeb Restaurant Management System</p>
        </div>
        
        <div class="content">
          <h2>Hello ${data.tenant.name},</h2>
          <p>${data.isCustomInvoice 
            ? 'We have generated a custom invoice for your account. Please find the details below.'
            : 'Thank you for using OrderWeb! Here\'s your subscription invoice for the upcoming billing period.'
          }</p>
          
          <div class="invoice-details">
            <div class="row">
              <span class="label">Restaurant:</span>
              <span class="value">${data.tenant.name}</span>
            </div>
            <div class="row">
              <span class="label">Email:</span>
              <span class="value">${data.tenant.email}</span>
            </div>
            ${!data.isCustomInvoice ? `
            <div class="row">
              <span class="label">Subscription Plan:</span>
              <span class="value">${data.subscriptionPlan.charAt(0).toUpperCase() + data.subscriptionPlan.slice(1)} Plan</span>
            </div>
            <div class="row">
              <span class="label">Billing Period:</span>
              <span class="value">${formatDate(data.billingPeriodStart)} - ${formatDate(data.billingPeriodEnd)}</span>
            </div>
            ` : `
            <div class="row">
              <span class="label">Invoice Type:</span>
              <span class="value" style="color: #F59E0B; font-weight: 600;">Custom Invoice</span>
            </div>
            <div class="row">
              <span class="label">Invoice Date:</span>
              <span class="value">${formatDate(data.billingPeriodStart)}</span>
            </div>
            `}
            <div class="row">
              <span class="label">Description:</span>
              <span class="value">${data.description}</span>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <div class="row">
              <span class="label">Total Amount:</span>
              <span class="value amount">${formatCurrency(data.amount, data.currency)}</span>
            </div>
          </div>
          
          <p><strong>Payment Instructions:</strong></p>
          <p>Please contact our billing team to process your payment. ${data.isCustomInvoice 
            ? 'This is a custom invoice that requires manual payment processing.'
            : 'Once payment is received, your subscription will be updated automatically.'
          }</p>
          
          <div style="text-align: center;">
            <a href="mailto:billing@orderweb.com" class="button">Contact Billing Team</a>
          </div>
          
          <p>If you have any questions about this invoice, please don't hesitate to contact our support team.</p>
        </div>
        
        <div class="footer">
          <p><strong>OrderWeb Ltd</strong><br>
          London, United Kingdom<br>
          Email: support@orderweb.com | Phone: +44 20 1234 5678</p>
          <p>This is an automated invoice. Please keep this email for your records.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
