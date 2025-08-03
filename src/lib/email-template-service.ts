import { getTenantBySlug } from "@/lib/tenant-service";
import pool from "@/lib/db";

// Rotating email greeting messages
const EMAIL_GREETING_MESSAGES = [
  "Great choice!",
  "Good choice!",
  "Yummy Order!",
  "Perfect Order!",
  "Mouth-watering choice!"
];

interface OrderDetails {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  subtotal?: number;
  deliveryFee?: number;
  orderType: string;
  deliveryAddress?: string;
  specialInstructions?: string;
  restaurantName: string;
  // Timing information
  scheduledTime?: string; // Primary field for customer-selected scheduled time (from frontend)
  scheduledFor?: string; // For advance orders - when customer wants it
  scheduledDate?: string; // Alternative field name for scheduled date
  estimatedReadyTime?: string; // Calculated ready time for collection
  estimatedDeliveryTime?: string; // Calculated delivery time
  orderDate?: string; // When the order was placed
  isAdvanceOrder?: boolean; // Whether this is an advance order
  // Voucher/Discount information
  voucherCode?: string; // Voucher code used
  voucherDiscount?: number; // Discount amount from voucher
  discount?: number; // Total discount amount
}

interface TenantData {
  id?: string; // Tenant UUID
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  settings?: {
    logo?: string;
    primaryColor?: string;
    currency?: string;
    // Timing settings
    collectionTimeMinutes?: number;
    deliveryTimeMinutes?: number;
    collectionTimeSettings?: {
      collectionTimeMinutes: number;
      enabled: boolean;
      displayMessage: string;
    };
    deliveryTimeSettings?: {
      deliveryTimeMinutes: number;
      enabled: boolean;
      displayMessage: string;
    };
    [key: string]: any;
  };
}

interface EmailTemplateCustomization {
  logo: string;
  logoLink: string;
  logoPosition: 'left' | 'center' | 'right';
  footerMessage: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
    tiktok: string;
    website: string;
  };
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

export class EmailTemplateService {
  
  /**
   * Get rotating greeting message for email templates
   * Each tenant has its own counter that cycles through predefined messages
   * Uses database for persistence with fallback to random selection
   */
  private async getRotatingGreetingMessage(tenantId: string): Promise<string> {
    try {
      console.log('🎯 Getting rotating greeting message for tenant:', tenantId);
      
      // Atomic operation: increment counter and get new value
      const [updateResult] = await pool.execute(`
        INSERT INTO tenant_email_message_counter (tenant_id, message_counter) 
        VALUES (?, 1)
        ON DUPLICATE KEY UPDATE 
        message_counter = message_counter + 1
      `, [tenantId]);

      // Get the current counter value
      const [rows] = await pool.execute(`
        SELECT message_counter FROM tenant_email_message_counter 
        WHERE tenant_id = ?
      `, [tenantId]);

      let messageIndex = 0;
      if (rows && (rows as any[]).length > 0) {
        const counter = (rows as any[])[0].message_counter;
        // Use modulo to cycle through messages (0-4)
        messageIndex = (counter - 1) % EMAIL_GREETING_MESSAGES.length;
        console.log('✅ Counter value:', counter, 'Message index:', messageIndex);
      } else {
        console.log('⚠️ No counter found, using first message');
      }

      const selectedMessage = EMAIL_GREETING_MESSAGES[messageIndex];
      console.log('🎉 Selected greeting message:', selectedMessage);
      
      return selectedMessage;
      
    } catch (error) {
      console.error('❌ Error getting rotating greeting message:', error);
      // Fallback: use random message if database fails
      const randomIndex = Math.floor(Math.random() * EMAIL_GREETING_MESSAGES.length);
      const fallbackMessage = EMAIL_GREETING_MESSAGES[randomIndex];
      console.log('🔄 Using fallback random message:', fallbackMessage);
      return fallbackMessage;
    }
  }

  private calculateOrderTiming(orderDetails: OrderDetails, tenantData: TenantData) {
    const now = new Date();
    const isDelivery = orderDetails.orderType?.toLowerCase() === 'delivery';
    const isCollection = orderDetails.orderType?.toLowerCase() === 'collection' || orderDetails.orderType?.toLowerCase() === 'pickup';
    
    // Get timing settings from tenant data with better fallback logic
    const collectionMinutes = tenantData.settings?.collectionTimeSettings?.collectionTimeMinutes || 
                              tenantData.settings?.collectionTimeMinutes || 30;
    const deliveryMinutes = tenantData.settings?.deliveryTimeSettings?.deliveryTimeMinutes || 
                           tenantData.settings?.deliveryTimeMinutes || 45;
    
    // Enhanced advance order detection - must have valid scheduled date/time
    let isAdvanceOrder = false;
    let validScheduledDateTime = null;
    
    console.log('🔍 Advance Order Detection Debug:', {
      isAdvanceOrderFlag: orderDetails.isAdvanceOrder,
      scheduledTime: orderDetails.scheduledTime, // NEW PRIMARY FIELD
      scheduledFor: orderDetails.scheduledFor,
      scheduledDate: orderDetails.scheduledDate,
      orderType: orderDetails.orderType,
      currentTime: now.toISOString(),
      // Check all possible fields that might contain the scheduled date/time
      allOrderDetails: orderDetails
    });
    
    // Check if this is an advance order with valid scheduled date
    // Look for scheduled date/time in multiple possible fields
    const possibleScheduledFields = [
      orderDetails.scheduledFor,
      orderDetails.scheduledDate,
      (orderDetails as any).scheduledTime, // THIS IS THE KEY FIELD - passed from API
      (orderDetails as any).scheduled_for,
      (orderDetails as any).scheduled_date,
      (orderDetails as any).scheduled_time,
      (orderDetails as any).advance_order_date,
      (orderDetails as any).advance_order_time,
      (orderDetails as any).delivery_date,
      (orderDetails as any).collection_date,
      (orderDetails as any).order_date_time,
      (orderDetails as any).scheduledDateTime,
      (orderDetails as any).advanceOrderDate,
      (orderDetails as any).advanceOrderTime
    ];
    
    console.log('🔎 Checking all possible scheduled date fields:', possibleScheduledFields);
    
    if (orderDetails.isAdvanceOrder || orderDetails.scheduledTime || orderDetails.scheduledFor || orderDetails.scheduledDate || possibleScheduledFields.some(field => field)) {
      // Try to find the first valid scheduled date/time from all possible fields
      // Prioritize scheduledTime (from API) first, then other fields
      const scheduledDateTime = orderDetails.scheduledTime || possibleScheduledFields.find(field => field && field.trim() !== '') || orderDetails.scheduledFor || orderDetails.scheduledDate;
      console.log('📅 Found scheduled date/time:', scheduledDateTime, 'from scheduledTime field:', orderDetails.scheduledTime);
      
      if (scheduledDateTime) {
        try {
          const testDate = new Date(scheduledDateTime);
          console.log('📅 Parsed date:', testDate.toISOString(), 'Valid:', !isNaN(testDate.getTime()), 'Future:', testDate > now);
          
          if (!isNaN(testDate.getTime()) && testDate > now) {
            isAdvanceOrder = true;
            validScheduledDateTime = scheduledDateTime;
            console.log('✅ Valid advance order detected with scheduled date:', testDate.toISOString());
          } else {
            console.log('⚠️ Invalid or past scheduled date, treating as immediate order');
          }
        } catch (error) {
          console.log('⚠️ Invalid date format, treating as immediate order:', error);
        }
      }
    } else {
      console.log('❌ No advance order indicators found - treating as immediate order');
    }
    
    // Additional fallback: if isAdvanceOrder is explicitly set to true, force advance order handling
    if (orderDetails.isAdvanceOrder === true && !isAdvanceOrder) {
      console.log('🔄 Forcing advance order due to explicit isAdvanceOrder flag');
      isAdvanceOrder = true;
      
      // Try to construct the scheduled time from separate date and time fields if available
      const advanceOrderDate = (orderDetails as any).advance_order_date || (orderDetails as any).advanceOrderDate;
      const advanceOrderTime = (orderDetails as any).advance_order_time || (orderDetails as any).advanceOrderTime;
      
      if (advanceOrderDate && advanceOrderTime) {
        // Try to combine date and time
        try {
          const combinedDateTime = `${advanceOrderDate} ${advanceOrderTime}`;
          const testCombined = new Date(combinedDateTime);
          if (!isNaN(testCombined.getTime())) {
            validScheduledDateTime = testCombined.toISOString();
            console.log('✅ Successfully combined advance order date and time:', combinedDateTime);
          }
        } catch (error) {
          console.log('⚠️ Could not combine advance order date and time:', error);
        }
      }
      
      // Use current time + 4 hours as fallback if no valid scheduled time found
      validScheduledDateTime = validScheduledDateTime || new Date(now.getTime() + 14400000).toISOString(); // 4 hours
    }
    
    console.log('🕐 Order Timing Debug:', {
      now: now.toISOString(),
      isAdvanceOrder,
      isDelivery,
      isCollection,
      scheduledFor: orderDetails.scheduledFor,
      scheduledDate: orderDetails.scheduledDate,
      validScheduledDateTime,
      collectionMinutes,
      deliveryMinutes,
      orderType: orderDetails.orderType
    });
    
    let readyTime: Date;
    let displayTime: string;
    let timeMessage: string;
    
    if (isAdvanceOrder && validScheduledDateTime) {
      // For advance orders with valid scheduled time
      readyTime = new Date(validScheduledDateTime);
      
      displayTime = readyTime.toLocaleString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Europe/London'
      });
      
      // For advance orders, show full details with scheduled date and time
      const timeOnly = readyTime.toLocaleString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Europe/London'
      });
      
      const dateOnly = readyTime.toLocaleString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Europe/London'
      });
      
      if (isDelivery) {
        timeMessage = `Advance Order|${dateOnly} at ${timeOnly}`;
      } else {
        timeMessage = `Advance Order|${dateOnly} at ${timeOnly}`;
      }
      console.log('📅 Advance order display:', timeMessage);
    } else if (isAdvanceOrder) {
      // For advance orders without valid scheduled time, show generic advance order message
      console.log('🔄 Advance order detected but no valid scheduled time - using generic message');
      readyTime = new Date(now.getTime() + 14400000); // 4 hours from now as placeholder
      
      displayTime = 'Advance Order - Date and time as specified by customer';
      timeMessage = `Advance Order|Your advance order will be prepared at your requested date and time`;
      console.log('📅 Advance order generic display:', timeMessage);
    } else {
      // For immediate orders, calculate based on current time + preparation time
      const minutesToAdd = isDelivery ? deliveryMinutes : collectionMinutes;
      readyTime = new Date(now.getTime() + (minutesToAdd * 60000));
      
      console.log('⏱️ Immediate order calculation:', {
        minutesToAdd,
        currentTime: now.toISOString(),
        readyTime: readyTime.toISOString()
      });
      
      displayTime = readyTime.toLocaleString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Europe/London'
      });
      
      // For immediate orders, show "approximately X minutes" text
      if (isDelivery) {
        timeMessage = `Your order will be delivered by ${displayTime} (approximately ${deliveryMinutes} minutes)`;
      } else {
        timeMessage = `Your order will be ready for collection by ${displayTime} (approximately ${collectionMinutes} minutes)`;
      }
      console.log('⏰ Immediate order display:', timeMessage);
    }
    
    const result = {
      readyTime,
      displayTime,
      timeMessage,
      isAdvanceOrder,
      isDelivery,
      isCollection,
      minutesToReady: isAdvanceOrder ? 
        Math.max(0, Math.floor((readyTime.getTime() - now.getTime()) / 60000)) : 
        (isDelivery ? deliveryMinutes : collectionMinutes)
    };
    
    console.log('📋 Final timing result:', result);
    return result;
  }

  async getCustomTemplate(tenantSlug: string): Promise<EmailTemplateCustomization | null> {
    try {
      const tenant = await getTenantBySlug(tenantSlug);
      if (!tenant) return null;

      const connection = await pool.getConnection();
      const [customizationResult] = await connection.execute(
        `SELECT customization_data FROM email_template_customization WHERE tenant_id = ?`,
        [tenant.id]
      );
      connection.release();

      if (Array.isArray(customizationResult) && customizationResult.length > 0) {
        try {
          return JSON.parse((customizationResult[0] as any).customization_data);
        } catch (e) {
          console.error("Failed to parse customization data:", e);
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error("Error fetching custom template:", error);
      return null;
    }
  }

  async generateOrderConfirmationEmail(
    tenantSlug: string,
    orderDetails: OrderDetails,
    tenantData: TenantData
  ): Promise<string> {
    // Get rotating greeting message for this tenant
    const greetingMessage = tenantData.id ? 
      await this.getRotatingGreetingMessage(tenantData.id) : 
      EMAIL_GREETING_MESSAGES[0]; // Fallback to first message if no tenant ID
    
    console.log('🎉 Using greeting message for email:', greetingMessage);
    
    // Get custom template
    const customTemplate = await this.getCustomTemplate(tenantSlug);
    
    // If no custom template, use default
    if (!customTemplate) {
      return this.generateDefaultTemplate(orderDetails, tenantData, greetingMessage);
    }

    // Generate custom template
    return this.generateCustomTemplate(orderDetails, tenantData, customTemplate, greetingMessage);
  }

  private generateDefaultTemplate(orderDetails: OrderDetails, tenantData: TenantData, greetingMessage: string): string {
    // Calculate timing information for default template too
    const timing = this.calculateOrderTiming(orderDetails, tenantData);
    
    console.log('📧 Email Template Generation - Timing Object:', {
      isAdvanceOrder: timing.isAdvanceOrder,
      timeMessage: timing.timeMessage,
      displayTime: timing.displayTime,
      isDelivery: timing.isDelivery,
      isCollection: timing.isCollection
    });
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333;">Order Confirmation</h1>
          <p style="font-size: 18px; color: #666;">Order ${orderDetails.orderNumber}</p>
          
          <!-- Timing Information -->
          <div style="background: ${timing.isAdvanceOrder ? '#fef3e2' : '#f0f9ff'}; padding: 18px; border-radius: 8px; margin-top: 20px; border-left: 4px solid ${timing.isAdvanceOrder ? '#f59e0b' : '#0ea5e9'};">
            ${timing.isAdvanceOrder ? `
            <div style="font-weight: 700; color: #92400e; margin-bottom: 8px; font-size: 16px;">
              Advance Order
            </div>
            <div style="color: #78350f; font-size: 15px; font-weight: 500; line-height: 1.4;">
              ${timing.timeMessage.split('|')[1] || timing.timeMessage}
            </div>
            ` : `
            <div style="font-weight: 700; color: #0c4a6e; margin-bottom: 8px; font-size: 16px;">
              Order Timing
            </div>
            <div style="color: #075985; font-size: 15px; font-weight: 500; line-height: 1.4;">
              ${timing.timeMessage}
            </div>
            `}
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h2 style="color: #333;">Dear ${orderDetails.customerName},</h2>
          <p>${greetingMessage} We have received your order and it is being processed.</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h3 style="color: #333; margin-top: 0;">Order Details:</h3>
          <ul style="list-style: none; padding: 0;">
            ${orderDetails.items.map((item: any) => `
              <li style="padding: 8px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                  <span style="font-weight: bold;">${item.name}</span>
                  <span style="color: #666; margin-left: 10px;">x${item.quantity}</span>
                </div>
                <span style="font-weight: bold; color: #333;">£${(item.price || 0).toFixed(2)}</span>
              </li>
            `).join('')}
          </ul>
          <div style="text-align: right; margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
            ${orderDetails.voucherCode ? `
            <div style="margin-bottom: 8px;">
              <span style="font-weight: bold;">Bill</span>
              <span style="float: right;">£${(orderDetails.total + (orderDetails.voucherDiscount || orderDetails.discount || 0)).toFixed(2)}</span>
            </div>
            <div style="margin-bottom: 8px; color: #059669;">
              <span style="font-weight: bold;">Voucher</span>
              <span style="float: right;">-£${(orderDetails.voucherDiscount || orderDetails.discount || 0).toFixed(2)}</span>
            </div>
            ` : ''}
            <strong style="font-size: 18px;">Total: £${orderDetails.total.toFixed(2)}</strong>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p><strong>Order Type:</strong> ${orderDetails.orderType}</p>
          ${orderDetails.deliveryAddress ? `<p><strong>Delivery Address:</strong> ${orderDetails.deliveryAddress}</p>` : ''}
          ${orderDetails.specialInstructions ? `<p><strong>Special Instructions:</strong> ${orderDetails.specialInstructions}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p>Best regards,<br><strong>${orderDetails.restaurantName}</strong></p>
          ${tenantData.phone ? `<p>Phone: ${tenantData.phone}</p>` : ''}
          ${tenantData.address ? `<p>Address: ${tenantData.address}</p>` : ''}
        </div>
      </div>
    `;
  }

  private generateCustomTemplate(
    orderDetails: OrderDetails,
    tenantData: TenantData,
    template: EmailTemplateCustomization,
    greetingMessage: string
  ): string {
    // Calculate timing information
    const timing = this.calculateOrderTiming(orderDetails, tenantData);
    
    console.log('📧 Custom Email Template Generation - Timing Object:', {
      isAdvanceOrder: timing.isAdvanceOrder,
      timeMessage: timing.timeMessage,
      displayTime: timing.displayTime,
      isDelivery: timing.isDelivery,
      isCollection: timing.isCollection
    });
    
    // Enhanced logo URL handling with fallbacks - prioritize logoLink if available, then template.logo, then tenant settings
    const logoUrl = template.logoLink || template.logo || (tenantData as any).settings?.logo || '';
    const logoAlign = template.logoPosition === 'left' ? 'flex-start' : template.logoPosition === 'right' ? 'flex-end' : 'center';
    
    // Ensure we have restaurant name
    const restaurantName = tenantData.name || 'Restaurant';
    
    console.log('Email Template Debug:', {
      logoUrl,
      restaurantName,
      logoLink: template.logoLink,
      templateLogo: template.logo,
      tenantSettings: (tenantData as any).settings,
      tenantSettingsLogo: (tenantData as any).settings?.logo,
      tenantName: tenantData.name,
      logoFallbackChain: [
        { source: 'template.logoLink', value: template.logoLink },
        { source: 'template.logo', value: template.logo },
        { source: 'tenantData.settings.logo', value: (tenantData as any).settings?.logo },
        { source: 'final logoUrl', value: logoUrl }
      ]
    });
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - ${tenantData.name}</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossorigin="anonymous" referrerpolicy="no-referrer" />
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 0; }
          .card { border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); overflow: hidden; }
          .gradient-bg { background: linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.accent} 100%); }
          .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: rgba(34, 197, 94, 0.1); color: #059669; border-radius: 20px; font-weight: 600; font-size: 14px; }
          .section-divider { height: 1px; background: linear-gradient(90deg, transparent, #e5e7eb, transparent); margin: 24px 0; }
          
          /* Desktop styles */
          @media (min-width: 601px) { 
            .main-container { max-width: 650px; margin: 24px auto; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); }
            .container-padding { padding: 32px; }
            .header-padding { padding: 40px 32px; }
          }
          
          /* Mobile styles - Full screen with tiny spacing */
          @media (max-width: 600px) { 
            body { padding: 8px !important; background: #ffffff !important; }
            .main-container { margin: 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
            .container-padding { padding: 16px; }
            .header-padding { padding: 24px 16px; }
            .mobile-text-sm { font-size: 14px; }
            .mobile-spacing { margin-bottom: 16px; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 24px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); font-family: ${template.fonts.body}, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
        
        <!-- Main Container -->
        <div style="background: #ffffff;" class="main-container">
          
          <!-- Header Section -->
          <div style="text-align: center; position: relative;" class="gradient-bg header-padding">
            
            <!-- Logo -->
            ${logoUrl ? `
            <div style="display: flex; justify-content: ${logoAlign}; align-items: center; margin-bottom: 24px;">
              <div style="background: rgba(255,255,255,0.95); padding: 16px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
                <img src="${logoUrl}" alt="${restaurantName}" style="height: auto; width: auto; max-height: 80px; max-width: 200px; object-fit: contain; display: block;" onerror="this.style.display='none';">
              </div>
            </div>
            ` : ''}
            
            <!-- Main Welcome Message -->
            <h1 style="font-family: ${template.fonts.heading}, 'Segoe UI', sans-serif; font-size: 32px; font-weight: 700; color: white; margin: 0 0 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              ${greetingMessage}
            </h1>
            
            <!-- Customer Name on Second Line -->
            <h2 style="font-family: ${template.fonts.heading}, 'Segoe UI', sans-serif; font-size: 28px; font-weight: 600; color: rgba(255, 255, 255, 0.95); margin: 0 0 8px; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
              ${orderDetails.customerName || 'Valued Customer'}
            </h2>
            
            <!-- Thank You Message (Smaller) -->
            <h3 style="font-family: ${template.fonts.heading}, 'Segoe UI', sans-serif; font-size: 22px; font-weight: 500; color: rgba(255, 255, 255, 0.9); margin: 0 0 20px; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
              Thank you for your order
            </h3>
            
            <!-- Status Badge -->
            <div style="margin-bottom: 20px;">
              <span class="status-badge" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3);">
                ✓ Confirmed • ${timing.isDelivery ? 'Delivery Order' : 'Collection Order'}${timing.isAdvanceOrder ? ' • Pre-Scheduled' : ''}
              </span>
            </div>
            
            <!-- Timing Information -->
            <div style="background: ${timing.isAdvanceOrder ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.15)'}; backdrop-filter: blur(10px); border: 1px solid ${timing.isAdvanceOrder ? 'rgba(251, 191, 36, 0.4)' : 'rgba(255,255,255,0.2)'}; padding: 24px; border-radius: 12px; font-size: 15px; color: white;">
              ${timing.isAdvanceOrder ? `
              <div style="font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 17px;">
                Advance Order
              </div>
              <div style="font-size: 15px; opacity: 0.95; font-weight: 600; text-align: center; line-height: 1.4;">
                ${timing.timeMessage.split('|')[1] || timing.timeMessage}
              </div>
              ` : `
              <div style="font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 17px;">
                Order Timing
              </div>
              <div style="font-size: 15px; opacity: 0.95; font-weight: 600; text-align: center; line-height: 1.4;">
                ${timing.timeMessage}
              </div>
              `}
            </div>
          </div>
          
          <!-- Content Section -->
          <div class="container-padding">
            
            <!-- Order Summary Card -->
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid #e2e8f0;">
              <h2 style="font-family: ${template.fonts.heading}, 'Segoe UI', sans-serif; font-size: 22px; font-weight: 700; color: ${template.colors.primary}; margin: 0 0 20px;">
                Order Summary
              </h2>
              
              <!-- Order Info -->
              <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
                <div style="font-size: 12px; font-weight: 600; color: ${template.colors.accent}; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px;">Order Number</div>
                <div style="font-size: 18px; font-weight: 700; color: ${template.colors.primary};">${orderDetails.orderNumber || 'N/A'}</div>
              </div>
              
              <!-- Delivery Address -->
              ${timing.isDelivery && orderDetails.deliveryAddress ? `
              <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <div style="font-size: 12px; font-weight: 600; color: ${template.colors.accent}; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;">
                  Delivery Address
                </div>
                <div style="font-size: 15px; color: ${template.colors.text}; line-height: 1.5; font-weight: 500;">${orderDetails.deliveryAddress}</div>
              </div>
              ` : ''}
            </div>
            
            <!-- Order Items Section -->
            <div class="mobile-spacing" style="margin-bottom: 32px;">
              <h3 style="font-family: ${template.fonts.heading}, 'Segoe UI', sans-serif; font-size: 22px; font-weight: 700; color: ${template.colors.primary}; margin: 0 0 20px; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 8px;">
                Order Items
              </h3>
              
              ${orderDetails.items.map((item: any) => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                  <div style="flex: 1;">
                    <div style="font-size: 16px; font-weight: 600; color: ${template.colors.text}; margin-bottom: 4px;">${item.name || 'Item'}</div>
                    <div style="font-size: 14px; color: #6b7280;">Quantity: ${item.quantity || 1}</div>
                  </div>
                  <div style="text-align: right; margin-left: 16px;">
                    <div style="font-size: 16px; font-weight: 700; color: ${template.colors.primary};">
                      £${(item.price || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
            
            <!-- Price Breakdown -->
            <div class="mobile-spacing" style="background: ${template.colors.secondary}20; border-radius: 8px; padding: 24px; margin-bottom: 32px; border: 1px solid ${template.colors.secondary}40;">
              <h3 style="font-family: ${template.fonts.heading}, 'Segoe UI', sans-serif; font-size: 20px; font-weight: 700; color: ${template.colors.primary}; margin: 0 0 20px;">
                Payment Summary
              </h3>
              
              ${orderDetails.voucherCode ? `
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 16px; padding: 8px 0;">
                <span style="font-weight: 500; color: ${template.colors.text};">Subtotal</span>
                <span style="font-weight: 600; color: ${template.colors.text};">£${(orderDetails.total + (orderDetails.voucherDiscount || orderDetails.discount || 0)).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-size: 16px; padding: 8px 0;">
                <span style="font-weight: 600; color: #059669;">Voucher Discount</span>
                <span style="font-weight: 700; color: #059669;">-£${(orderDetails.voucherDiscount || orderDetails.discount || 0).toFixed(2)}</span>
              </div>
              ` : ''}
              
              ${timing.isDelivery ? `
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-size: 16px; padding: 8px 0;">
                <span style="font-weight: 500; color: ${template.colors.text};">Delivery Fee</span>
                <span style="font-weight: 600; color: ${template.colors.text};">£${orderDetails.deliveryFee !== undefined && orderDetails.deliveryFee !== null ? orderDetails.deliveryFee.toFixed(2) : '2.50'}</span>
              </div>
              ` : ''}
              
              <div style="height: 1px; background: ${template.colors.secondary}60; margin: 16px 0;"></div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 22px; font-weight: 800; padding: 12px 0; color: ${template.colors.primary};">
                <span>Total Amount</span>
                <span>£${orderDetails.total.toFixed(2)}</span>
              </div>
            </div>
            
            <!-- Special Instructions -->
            ${orderDetails.specialInstructions ? `
            <div style="background: #fef7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <div style="font-size: 14px; font-weight: 600; color: #ea580c; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                Special Instructions
              </div>
              <div style="font-size: 14px; color: #9a3412; line-height: 1.5;">${orderDetails.specialInstructions}</div>
            </div>
            ` : ''}
          </div>
          
          <!-- Footer Section -->
          <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); text-align: center; border-top: 1px solid #e2e8f0;" class="container-padding">
            
            <!-- Thank You Message -->
            <div style="margin-bottom: 24px;">
              <h3 style="font-family: ${template.fonts.heading}, 'Segoe UI', sans-serif; font-size: 20px; font-weight: 700; color: ${template.colors.primary}; margin: 0 0 8px;">Thank You!</h3>
              <p style="font-size: 16px; color: ${template.colors.text}; margin: 0; font-weight: 500;">
                ${template.footerMessage || 'We appreciate your business and look forward to serving you!'}
              </p>
            </div>
            
            <!-- Social Links -->
            ${(template.socialLinks.facebook || template.socialLinks.twitter || template.socialLinks.instagram || template.socialLinks.tiktok || template.socialLinks.website) ? `
            <div style="display: flex; justify-content: center; gap: 16px; margin-bottom: 24px;">
              ${template.socialLinks.facebook ? `<a href="${template.socialLinks.facebook}" style="color: #1877f2; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.1); font-size: 18px; transition: all 0.3s ease; border: 1px solid #e5e7eb;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)';"><i class="fab fa-facebook-f"></i></a>` : ''}
              ${template.socialLinks.twitter ? `<a href="${template.socialLinks.twitter}" style="color: #000000; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.1); font-size: 18px; transition: all 0.3s ease; border: 1px solid #e5e7eb;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)';"><i class="fab fa-x-twitter"></i></a>` : ''}
              ${template.socialLinks.instagram ? `<a href="${template.socialLinks.instagram}" style="color: #e4405f; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.1); font-size: 18px; transition: all 0.3s ease; border: 1px solid #e5e7eb;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)';"><i class="fab fa-instagram"></i></a>` : ''}
              ${template.socialLinks.tiktok ? `<a href="${template.socialLinks.tiktok}" style="color: #000000; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.1); font-size: 18px; transition: all 0.3s ease; border: 1px solid #e5e7eb;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)';"><i class="fab fa-tiktok"></i></a>` : ''}
              ${template.socialLinks.website ? `<a href="${template.socialLinks.website}" style="color: #4b5563; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.1); font-size: 18px; transition: all 0.3s ease; border: 1px solid #e5e7eb;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)';"><i class="fas fa-globe"></i></a>` : ''}
            </div>
            ` : ''}
            
            <!-- Contact Information -->
            <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb;">
              <h4 style="font-family: ${template.fonts.heading}, 'Segoe UI', sans-serif; font-size: 16px; font-weight: 700; color: ${template.colors.primary}; margin: 0 0 12px;">${restaurantName}</h4>
              <div style="font-size: 14px; color: ${template.colors.text}; line-height: 1.6;">
                ${tenantData.address ? `<div style="margin-bottom: 4px; display: flex; align-items: center; justify-content: center; gap: 6px;"><span style="font-size: 12px;">📍</span> ${tenantData.address}</div>` : ''}
                ${tenantData.phone ? `<div style="margin-bottom: 4px; display: flex; align-items: center; justify-content: center; gap: 6px;"><span style="font-size: 12px;">📞</span> ${tenantData.phone}</div>` : ''}
                ${tenantData.email ? `<div style="margin-bottom: 4px; display: flex; align-items: center; justify-content: center; gap: 6px;"><span style="font-size: 12px;">✉️</span> ${tenantData.email}</div>` : ''}
              </div>
              
              <!-- Important Note -->
              <div style="margin-top: 16px; padding: 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.4;">
                  ${timing.isDelivery ? 'Your order will be delivered to your specified address.' : 'Please bring this confirmation when collecting your order.'}
                  <br>
                  Need help? Contact us using the information above.
                </p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateSocialLinks(socialLinks: any): string {
    const links = [];
    
    if (socialLinks.twitter) {
      links.push(`<a href="${socialLinks.twitter}" style="color: white; text-decoration: none; margin: 0 10px; display: inline-block; width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 50%; line-height: 40px; text-align: center; transition: all 0.3s ease;">𝕏</a>`);
    }
    
    if (socialLinks.instagram) {
      links.push(`<a href="${socialLinks.instagram}" style="color: white; text-decoration: none; margin: 0 10px; display: inline-block; width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 50%; line-height: 40px; text-align: center; transition: all 0.3s ease;">📷</a>`);
    }
    
    if (socialLinks.tiktok) {
      links.push(`<a href="${socialLinks.tiktok}" style="color: white; text-decoration: none; margin: 0 10px; display: inline-block; width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 50%; line-height: 40px; text-align: center; transition: all 0.3s ease;">🎵</a>`);
    }
    
    if (socialLinks.website) {
      links.push(`<a href="${socialLinks.website}" style="color: white; text-decoration: none; margin: 0 10px; display: inline-block; width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 50%; line-height: 40px; text-align: center; transition: all 0.3s ease;">🌐</a>`);
    }
    
    if (links.length > 0) {
      return `
        <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
          <p style="margin: 0 0 15px; font-size: 14px; opacity: 0.8;">Follow us:</p>
          <div style="text-align: center;">
            ${links.join('')}
          </div>
        </div>
      `;
    }
    
    return '';
  }
}

export const emailTemplateService = new EmailTemplateService();
