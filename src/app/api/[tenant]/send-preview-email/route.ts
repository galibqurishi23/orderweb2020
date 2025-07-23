import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { tenantEmailService } from '@/lib/tenant-email-service';
import { generateCustomerConfirmationTemplateA, generateCustomerConfirmationTemplateB } from '@/lib/email-templates/customer-confirmation-templates';

export async function POST(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const tenantId = params.tenant;
    const { template, branding, testEmail } = await request.json();

    if (!testEmail || !template || !['A', 'B'].includes(template)) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields or invalid template' },
        { status: 400 }
      );
    }

    // Get tenant info for the restaurant name
    const [tenantRows] = await db.execute(
      'SELECT name, email FROM tenants WHERE id = ?',
      [tenantId]
    );

    const tenant = (tenantRows as any[])[0];
    if (!tenant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Create sample order data for preview
    const sampleOrderData = {
      orderId: 'PREVIEW-12345',
      customerName: 'John Doe',
      customerEmail: testEmail,
      orderItems: [
        {
          name: 'Margherita Pizza',
          quantity: 1,
          price: 12.99,
          total: 12.99
        },
        {
          name: 'Caesar Salad',
          quantity: 1,
          price: 8.50,
          total: 8.50
        }
      ],
      subtotal: 21.49,
      deliveryFee: 2.50,
      total: 23.99,
      deliveryAddress: '123 Sample Street, City, Postcode',
      estimatedDeliveryTime: '45-60 minutes',
      paymentMethod: 'Card ending in 4242',
      orderTime: new Date().toISOString(),
      restaurantName: tenant.name,
      restaurantEmail: tenant.email
    };

    // Initialize email service
    const emailService = tenantEmailService;

    // Generate email template based on selection
    const customerOrderData = {
      orderId: sampleOrderData.orderId,
      orderNumber: sampleOrderData.orderId,
      customerName: sampleOrderData.customerName,
      items: sampleOrderData.orderItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        addons: []
      })),
      totalAmount: sampleOrderData.total,
      orderType: 'Delivery',
      paymentMethod: sampleOrderData.paymentMethod,
      deliveryAddress: sampleOrderData.deliveryAddress,
      estimatedTime: sampleOrderData.estimatedDeliveryTime,
      specialInstructions: 'This is a preview email',
      orderTime: sampleOrderData.orderTime
    };

    const restaurantBranding = {
      restaurantName: tenant.name,
      restaurantLogo: branding.restaurant_logo_url,
      socialMedia: {
        facebook: branding.social_media_facebook,
        instagram: branding.social_media_instagram,
        twitter: branding.social_media_twitter
      },
      customFooter: branding.custom_footer_text,
      contactInfo: {
        email: tenant.email
      }
    };

    const emailTemplate = template === 'B' 
      ? generateCustomerConfirmationTemplateB(customerOrderData, restaurantBranding)
      : generateCustomerConfirmationTemplateA(customerOrderData, restaurantBranding);

    // Send preview email using tenant email service
    const result = await emailService.sendEmail(
      tenantId,
      testEmail,
      `[PREVIEW] Order Confirmation - ${sampleOrderData.orderId}`,
      emailTemplate.html,
      emailTemplate.text,
      'customer_confirmation',
      sampleOrderData.orderId
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Preview email sent successfully to ${testEmail}`,
        template: template,
        sentAt: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { success: false, message: result.error || 'Failed to send preview email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error sending preview email:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send preview email' },
      { status: 500 }
    );
  }
}
