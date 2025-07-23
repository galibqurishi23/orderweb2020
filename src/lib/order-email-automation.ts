import { tenantEmailService } from './tenant-email-service';
import { generateRestaurantNotificationTemplate } from './email-templates/restaurant-notification-template';
import { 
  generateCustomerConfirmationTemplateA, 
  generateCustomerConfirmationTemplateB,
  CustomerOrderData,
  RestaurantBranding 
} from './email-templates/customer-confirmation-templates';
import pool from './db';

export interface OrderEmailData {
  orderId: string;
  orderNumber: string;
  tenantId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    addons?: string[];
  }>;
  totalAmount: number;
  orderType: string;
  paymentMethod: string;
  deliveryAddress?: string;
  specialInstructions?: string;
  estimatedTime?: string;
  orderTime: Date;
}

class OrderEmailAutomationService {
  
  /**
   * Send both customer confirmation and restaurant notification emails for a new order
   */
  async sendOrderEmails(orderData: OrderEmailData): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      // Get tenant/restaurant information
      const [tenantInfo] = await pool.execute(
        'SELECT * FROM tenants WHERE id = ?',
        [orderData.tenantId]
      ) as [any[], any];

      if (!tenantInfo || tenantInfo.length === 0) {
        errors.push('Restaurant information not found');
        return { success: false, errors };
      }

      const tenant = tenantInfo[0];

      // Get email branding settings
      const [brandingInfo] = await pool.execute(
        'SELECT * FROM tenant_email_branding WHERE tenant_id = ?',
        [orderData.tenantId]
      ) as [any[], any];

      const branding = brandingInfo.length > 0 ? brandingInfo[0] : null;

      // Send customer confirmation email
      try {
        await this.sendCustomerConfirmationEmail(orderData, tenant, branding);
      } catch (error) {
        console.error('Customer email failed:', error);
        errors.push(`Customer email failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Send restaurant notification email
      try {
        await this.sendRestaurantNotificationEmail(orderData, tenant);
      } catch (error) {
        console.error('Restaurant email failed:', error);
        errors.push(`Restaurant email failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      return { success: errors.length === 0, errors };
    } catch (error) {
      console.error('Order email automation failed:', error);
      errors.push(`Email automation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  /**
   * Send customer order confirmation email
   */
  private async sendCustomerConfirmationEmail(
    orderData: OrderEmailData, 
    tenant: any, 
    branding: any
  ): Promise<void> {
    const customerOrderData: CustomerOrderData = {
      orderId: orderData.orderId,
      orderNumber: orderData.orderNumber,
      customerName: orderData.customerName,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      orderType: orderData.orderType,
      paymentMethod: orderData.paymentMethod,
      deliveryAddress: orderData.deliveryAddress,
      estimatedTime: orderData.estimatedTime,
      specialInstructions: orderData.specialInstructions,
      orderTime: orderData.orderTime.toLocaleString()
    };

    const restaurantBranding: RestaurantBranding = {
      restaurantName: tenant.name || tenant.business_name,
      restaurantLogo: branding?.restaurant_logo_url || tenant.logo_url,
      socialMedia: {
        facebook: branding?.social_media_facebook,
        instagram: branding?.social_media_instagram,
        twitter: branding?.social_media_twitter
      },
      customFooter: branding?.custom_footer_text,
      contactInfo: {
        phone: tenant.phone,
        email: tenant.email,
        address: tenant.address
      }
    };

    // Choose template based on restaurant's preference (A or B)
    const selectedTemplate = branding?.selected_customer_template || 'A';
    const emailTemplate = selectedTemplate === 'B' 
      ? generateCustomerConfirmationTemplateB(customerOrderData, restaurantBranding)
      : generateCustomerConfirmationTemplateA(customerOrderData, restaurantBranding);

    // Send via restaurant's SMTP with system fallback
    await tenantEmailService.sendEmail(
      orderData.tenantId,
      orderData.customerEmail,
      emailTemplate.subject,
      emailTemplate.html,
      emailTemplate.text,
      'customer_confirmation',
      orderData.orderId
    );
  }

  /**
   * Send restaurant order notification email
   */
  private async sendRestaurantNotificationEmail(
    orderData: OrderEmailData, 
    tenant: any
  ): Promise<void> {
    const restaurantEmailTemplate = generateRestaurantNotificationTemplate(
      tenant.name || tenant.business_name,
      {
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        customerEmail: orderData.customerEmail,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        orderType: orderData.orderType,
        paymentMethod: orderData.paymentMethod,
        deliveryAddress: orderData.deliveryAddress,
        specialInstructions: orderData.specialInstructions,
        orderTime: orderData.orderTime.toLocaleString()
      },
      tenant.logo_url
    );

    // Send to restaurant's email address
    await tenantEmailService.sendEmail(
      orderData.tenantId,
      tenant.email,
      restaurantEmailTemplate.subject,
      restaurantEmailTemplate.html,
      restaurantEmailTemplate.text,
      'restaurant_notification',
      orderData.orderId
    );
  }

  /**
   * Queue order emails for background processing (recommended for high volume)
   */
  async queueOrderEmails(orderData: OrderEmailData): Promise<boolean> {
    try {
      // Get tenant information for email addresses
      const [tenantInfo] = await pool.execute(
        'SELECT * FROM tenants WHERE id = ?',
        [orderData.tenantId]
      ) as [any[], any];

      if (!tenantInfo || tenantInfo.length === 0) {
        console.error('Restaurant information not found for queuing emails');
        return false;
      }

      const tenant = tenantInfo[0];

      // Get branding settings for customer email template selection
      const [brandingInfo] = await pool.execute(
        'SELECT * FROM tenant_email_branding WHERE tenant_id = ?',
        [orderData.tenantId]
      ) as [any[], any];

      const branding = brandingInfo.length > 0 ? brandingInfo[0] : null;

      // Generate email templates
      const customerOrderData: CustomerOrderData = {
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        customerName: orderData.customerName,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        orderType: orderData.orderType,
        paymentMethod: orderData.paymentMethod,
        deliveryAddress: orderData.deliveryAddress,
        estimatedTime: orderData.estimatedTime,
        specialInstructions: orderData.specialInstructions,
        orderTime: orderData.orderTime.toLocaleString()
      };

      const restaurantBranding: RestaurantBranding = {
        restaurantName: tenant.name || tenant.business_name,
        restaurantLogo: branding?.restaurant_logo_url || tenant.logo_url,
        socialMedia: {
          facebook: branding?.social_media_facebook,
          instagram: branding?.social_media_instagram,
          twitter: branding?.social_media_twitter
        },
        customFooter: branding?.custom_footer_text,
        contactInfo: {
          phone: tenant.phone,
          email: tenant.email,
          address: tenant.address
        }
      };

      // Generate customer email template
      const selectedTemplate = branding?.selected_customer_template || 'A';
      const customerEmailTemplate = selectedTemplate === 'B' 
        ? generateCustomerConfirmationTemplateB(customerOrderData, restaurantBranding)
        : generateCustomerConfirmationTemplateA(customerOrderData, restaurantBranding);

      // Generate restaurant email template
      const restaurantEmailTemplate = generateRestaurantNotificationTemplate(
        tenant.name || tenant.business_name,
        {
          orderId: orderData.orderId,
          orderNumber: orderData.orderNumber,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          customerEmail: orderData.customerEmail,
          items: orderData.items,
          totalAmount: orderData.totalAmount,
          orderType: orderData.orderType,
          paymentMethod: orderData.paymentMethod,
          deliveryAddress: orderData.deliveryAddress,
          specialInstructions: orderData.specialInstructions,
          orderTime: orderData.orderTime.toLocaleString()
        },
        tenant.logo_url
      );

      // Queue customer confirmation email
      const customerQueued = await tenantEmailService.queueEmail({
        tenant_id: orderData.tenantId,
        order_id: orderData.orderId,
        recipient_email: orderData.customerEmail,
        recipient_name: orderData.customerName,
        email_type: 'customer_confirmation',
        subject: customerEmailTemplate.subject,
        html_body: customerEmailTemplate.html,
        text_body: customerEmailTemplate.text,
        priority: 'high'
      });

      // Queue restaurant notification email
      const restaurantQueued = await tenantEmailService.queueEmail({
        tenant_id: orderData.tenantId,
        order_id: orderData.orderId,
        recipient_email: tenant.email,
        recipient_name: tenant.name || tenant.business_name,
        email_type: 'restaurant_notification',
        subject: restaurantEmailTemplate.subject,
        html_body: restaurantEmailTemplate.html,
        text_body: restaurantEmailTemplate.text,
        priority: 'high'
      });

      return customerQueued && restaurantQueued;
    } catch (error) {
      console.error('Error queuing order emails:', error);
      return false;
    }
  }
}

export const orderEmailService = new OrderEmailAutomationService();
