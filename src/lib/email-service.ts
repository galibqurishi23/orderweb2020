import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { Connection } from 'mysql2/promise';
import db from './db';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export interface EmailTemplate {
  id: string;
  tenant_id: string;
  template_type: 'order_confirmation' | 'order_complete' | 'restaurant_notification';
  subject: string;
  html_content: string;
  variables: Record<string, string>;
}

export interface OrderData {
  id: string;
  customer_name: string;
  customer_email: string;
  phone: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  delivery_address?: string;
  order_type: 'dine_in' | 'takeaway' | 'delivery';
  table_number?: string;
  special_instructions?: string;
  created_at: Date;
}

export interface TenantData {
  id: string;
  business_name: string;
  email: string;
  phone: string;
  address: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
}

export class EmailService {
  private systemEmailConfig: EmailConfig;
  
  constructor() {
    this.systemEmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || '',
      },
      from: process.env.SMTP_FROM || 'noreply@orderweb.com'
    };
  }

  private async getDbConnection(): Promise<any> {
    return db;
  }

  private async getTenantEmailConfig(tenantId: string): Promise<EmailConfig | null> {
    const db = await this.getDbConnection();
    const [rows] = await db.execute(`
      SELECT smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password, smtp_from
      FROM tenants 
      WHERE id = ?
    `, [tenantId]);
    
    const tenant = (rows as any[])[0];
    
    if (!tenant || !tenant.smtp_host) {
      return null;
    }
    
    return {
      host: tenant.smtp_host,
      port: tenant.smtp_port || 587,
      secure: tenant.smtp_secure === 1,
      auth: {
        user: tenant.smtp_user,
        pass: tenant.smtp_password,
      },
      from: tenant.smtp_from || `noreply@${tenant.smtp_host}`
    };
  }

  private async getEmailTemplate(tenantId: string, templateType: string): Promise<EmailTemplate | null> {
    const db = await this.getDbConnection();
    const [rows] = await db.execute(`
      SELECT * FROM email_templates 
      WHERE tenant_id = ? AND template_type = ? AND active = 1
    `, [tenantId, templateType]);
    
    const template = (rows as any[])[0];
    
    if (!template) {
      return this.getDefaultTemplate(templateType);
    }
    
    return {
      id: template.id,
      tenant_id: template.tenant_id,
      template_type: template.template_type,
      subject: template.subject,
      html_content: template.html_content,
      variables: template.variables ? JSON.parse(template.variables) : {}
    };
  }

  private getDefaultTemplate(templateType: string): EmailTemplate {
    const templates = {
      order_confirmation: {
        id: 'default-confirmation',
        tenant_id: 'default',
        template_type: 'order_confirmation' as const,
        subject: 'Order Confirmation - {{restaurant_name}}',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              {{#if logo_url}}
                <img src="{{logo_url}}" alt="{{restaurant_name}}" style="max-height: 80px; margin-bottom: 20px;">
              {{/if}}
              <h1 style="color: {{primary_color}}; margin: 0;">{{restaurant_name}}</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">Order Confirmation</h2>
              <p>Dear {{customer_name}},</p>
              <p>Thank you for your order! We have received your order and it is being prepared.</p>
              
              <div style="margin: 20px 0;">
                <strong>Order Details:</strong><br>
                Order ID: {{order_id}}<br>
                Order Type: {{order_type}}<br>
                {{#if table_number}}Table: {{table_number}}<br>{{/if}}
                {{#if delivery_address}}Delivery Address: {{delivery_address}}<br>{{/if}}
                Total: $\{{\{total\}\}}
              </div>
              
              <div style="margin: 20px 0;">
                <strong>Items:</strong>
                <ul>
                  {{#each items}}
                  <li>\{{\{quantity\}\}}x \{{\{name\}\}} - $\{{\{price\}\}}</li>
                  {{/each}}
                </ul>
              </div>
              
              {{#if special_instructions}}
              <div style="margin: 20px 0;">
                <strong>Special Instructions:</strong><br>
                {{special_instructions}}
              </div>
              {{/if}}
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666;">{{restaurant_name}}<br>
              {{restaurant_address}}<br>
              {{restaurant_phone}}</p>
            </div>
          </div>
        `,
        variables: {}
      },
      
      order_complete: {
        id: 'default-complete',
        tenant_id: 'default',
        template_type: 'order_complete' as const,
        subject: 'Order Ready - {{restaurant_name}}',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              {{#if logo_url}}
                <img src="{{logo_url}}" alt="{{restaurant_name}}" style="max-height: 80px; margin-bottom: 20px;">
              {{/if}}
              <h1 style="color: {{primary_color}}; margin: 0;">{{restaurant_name}}</h1>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #2d5a3d; margin-top: 0;">🎉 Your Order is Ready!</h2>
              <p>Dear {{customer_name}},</p>
              <p>Great news! Your order is now ready for {{order_type}}.</p>
              
              <div style="margin: 20px 0;">
                <strong>Order ID:</strong> {{order_id}}<br>
                {{#if table_number}}<strong>Table:</strong> {{table_number}}<br>{{/if}}
                <strong>Total:</strong> $\{{\{total\}\}}
              </div>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <h3 style="color: #333;">How was your experience?</h3>
              <p style="margin-bottom: 20px;">We'd love to hear your feedback!</p>
              <a href="{{feedback_url}}" style="display: inline-block; background: {{primary_color}}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Leave Feedback</a>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666;">{{restaurant_name}}<br>
              {{restaurant_address}}<br>
              {{restaurant_phone}}</p>
            </div>
          </div>
        `,
        variables: {}
      },
      
      restaurant_notification: {
        id: 'default-restaurant',
        tenant_id: 'default',
        template_type: 'restaurant_notification' as const,
        subject: 'New Order Received - {{order_id}}',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #d32f2f; margin-bottom: 20px;">🔔 New Order Received</h1>
            
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
              <h2 style="color: #856404; margin-top: 0;">Order Details</h2>
              <p><strong>Order ID:</strong> {{order_id}}</p>
              <p><strong>Customer:</strong> {{customer_name}}</p>
              <p><strong>Phone:</strong> {{customer_phone}}</p>
              <p><strong>Email:</strong> {{customer_email}}</p>
              <p><strong>Order Type:</strong> {{order_type}}</p>
              {{#if table_number}}<p><strong>Table:</strong> {{table_number}}</p>{{/if}}
              {{#if delivery_address}}<p><strong>Delivery Address:</strong> {{delivery_address}}</p>{{/if}}
              <p><strong>Total:</strong> $\{{\{total\}\}}</p>
              <p><strong>Order Time:</strong> {{order_time}}</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-top: 0;">Items Ordered:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                {{#each items}}
                <li style="margin-bottom: 8px;">\{{\{quantity\}\}}x \{{\{name\}\}} - $\{{\{price\}\}}</li>
                {{/each}}
              </ul>
            </div>
            
            {{#if special_instructions}}
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1976d2; margin-top: 0;">Special Instructions:</h3>
              <p style="margin: 0;">{{special_instructions}}</p>
            </div>
            {{/if}}
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; font-size: 12px;">This is an automated notification from OrderWeb System</p>
            </div>
          </div>
        `,
        variables: {}
      }
    };
    
    return templates[templateType as keyof typeof templates];
  }

  private compileTemplate(template: string, variables: Record<string, any>): string {
    let compiled = template;
    
    // Replace simple variables \{\{variable\}\}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      compiled = compiled.replace(regex, String(value || ''));
    });
    
    // Handle conditional blocks \{\{#if variable\}\}...\{\{/if\}\}
    const ifRegex = new RegExp('\\{\\{#if\\s+(\\w+)\\}\\}([\\s\\S]*?)\\{\\{/if\\}\\}', 'g');
    compiled = compiled.replace(ifRegex, (match, varName, content) => {
      return variables[varName] ? content : '';
    });
    
    // Handle each loops \{\{#each items\}\}...\{\{/each\}\}
    const eachRegex = new RegExp('\\{\\{#each\\s+(\\w+)\\}\\}([\\s\\S]*?)\\{\\{/each\\}\\}', 'g');
    compiled = compiled.replace(eachRegex, (match, varName, content) => {
      const items = variables[varName];
      if (!Array.isArray(items)) return '';
      
      return items.map(item => {
        let itemContent = content;
        Object.entries(item).forEach(([key, value]) => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          itemContent = itemContent.replace(regex, String(value || ''));
        });
        return itemContent;
      }).join('');
    });
    
    return compiled;
  }

  private async logEmail(
    tenantId: string,
    orderId: string | null,
    emailType: string,
    recipientEmail: string,
    subject: string,
    status: 'sent' | 'failed' | 'pending',
    errorMessage?: string
  ): Promise<void> {
    const db = await this.getDbConnection();
    const logId = uuidv4();
    
    await db.execute(`
      INSERT INTO email_logs (id, tenant_id, order_id, email_type, recipient_email, subject, status, sent_at, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      logId,
      tenantId,
      orderId,
      emailType,
      recipientEmail,
      subject,
      status,
      status === 'sent' ? new Date() : null,
      errorMessage
    ]);
  }

  private async createFeedbackToken(orderId: string, tenantId: string): Promise<string> {
    const db = await this.getDbConnection();
    const feedbackToken = uuidv4();
    
    await db.execute(`
      INSERT INTO order_feedback (id, order_id, tenant_id, customer_email, feedback_token)
      VALUES (?, ?, ?, '', ?)
      ON DUPLICATE KEY UPDATE feedback_token = VALUES(feedback_token)
    `, [uuidv4(), orderId, tenantId, feedbackToken]);
    
    return feedbackToken;
  }

  private async sendEmail(
    emailConfig: EmailConfig,
    to: string,
    subject: string,
    htmlContent: string
  ): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth
    });

    await transporter.sendMail({
      from: emailConfig.from,
      to,
      subject,
      html: htmlContent
    });
  }

  public async sendOrderConfirmation(
    tenantId: string,
    orderData: OrderData,
    tenantData: TenantData
  ): Promise<void> {
    try {
      // Get email config (tenant-specific or system default)
      const emailConfig = await this.getTenantEmailConfig(tenantId) || this.systemEmailConfig;
      
      // Get email template
      const template = await this.getEmailTemplate(tenantId, 'order_confirmation');
      if (!template) return;

      // Prepare template variables
      const variables = {
        restaurant_name: tenantData.business_name,
        restaurant_address: tenantData.address,
        restaurant_phone: tenantData.phone,
        logo_url: tenantData.logo_url,
        primary_color: tenantData.primary_color || '#2563eb',
        customer_name: orderData.customer_name,
        order_id: orderData.id,
        order_type: orderData.order_type,
        table_number: orderData.table_number,
        delivery_address: orderData.delivery_address,
        total: orderData.total.toFixed(2),
        special_instructions: orderData.special_instructions,
        items: orderData.items.map(item => ({
          ...item,
          price: item.price.toFixed(2)
        }))
      };

      // Compile template
      const subject = this.compileTemplate(template.subject, variables);
      const htmlContent = this.compileTemplate(template.html_content, variables);

      // Send email
      await this.sendEmail(emailConfig, orderData.customer_email, subject, htmlContent);
      
      // Log success
      await this.logEmail(tenantId, orderData.id, 'order_confirmation', orderData.customer_email, subject, 'sent');
      
    } catch (error) {
      console.error('Error sending order confirmation:', error);
      await this.logEmail(tenantId, orderData.id, 'order_confirmation', orderData.customer_email, 'Order Confirmation', 'failed', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  public async sendOrderComplete(
    tenantId: string,
    orderData: OrderData,
    tenantData: TenantData
  ): Promise<void> {
    try {
      // Get email config
      const emailConfig = await this.getTenantEmailConfig(tenantId) || this.systemEmailConfig;
      
      // Get email template
      const template = await this.getEmailTemplate(tenantId, 'order_complete');
      if (!template) return;

      // Create feedback token
      const feedbackToken = await this.createFeedbackToken(orderData.id, tenantId);
      const feedbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/feedback/${feedbackToken}`;

      // Prepare template variables
      const variables = {
        restaurant_name: tenantData.business_name,
        restaurant_address: tenantData.address,
        restaurant_phone: tenantData.phone,
        logo_url: tenantData.logo_url,
        primary_color: tenantData.primary_color || '#2563eb',
        customer_name: orderData.customer_name,
        order_id: orderData.id,
        order_type: orderData.order_type,
        table_number: orderData.table_number,
        total: orderData.total.toFixed(2),
        feedback_url: feedbackUrl
      };

      // Compile template
      const subject = this.compileTemplate(template.subject, variables);
      const htmlContent = this.compileTemplate(template.html_content, variables);

      // Send email
      await this.sendEmail(emailConfig, orderData.customer_email, subject, htmlContent);
      
      // Log success
      await this.logEmail(tenantId, orderData.id, 'order_complete', orderData.customer_email, subject, 'sent');
      
    } catch (error) {
      console.error('Error sending order complete notification:', error);
      await this.logEmail(tenantId, orderData.id, 'order_complete', orderData.customer_email, 'Order Complete', 'failed', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  public async sendRestaurantNotification(
    tenantId: string,
    orderData: OrderData,
    tenantData: TenantData
  ): Promise<void> {
    try {
      // Get email config
      const emailConfig = await this.getTenantEmailConfig(tenantId) || this.systemEmailConfig;
      
      // Get email template
      const template = await this.getEmailTemplate(tenantId, 'restaurant_notification');
      if (!template) return;

      // Prepare template variables
      const variables = {
        order_id: orderData.id,
        customer_name: orderData.customer_name,
        customer_phone: orderData.phone,
        customer_email: orderData.customer_email,
        order_type: orderData.order_type,
        table_number: orderData.table_number,
        delivery_address: orderData.delivery_address,
        total: orderData.total.toFixed(2),
        order_time: orderData.created_at.toLocaleString(),
        special_instructions: orderData.special_instructions,
        items: orderData.items.map(item => ({
          ...item,
          price: item.price.toFixed(2)
        }))
      };

      // Compile template
      const subject = this.compileTemplate(template.subject, variables);
      const htmlContent = this.compileTemplate(template.html_content, variables);

      // Send email to restaurant
      await this.sendEmail(emailConfig, tenantData.email, subject, htmlContent);
      
      // Log success
      await this.logEmail(tenantId, orderData.id, 'restaurant_notification', tenantData.email, subject, 'sent');
      
    } catch (error) {
      console.error('Error sending restaurant notification:', error);
      await this.logEmail(tenantId, orderData.id, 'restaurant_notification', tenantData.email, 'Restaurant Notification', 'failed', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  public async sendAllOrderEmails(
    tenantId: string,
    orderData: OrderData,
    tenantData: TenantData
  ): Promise<void> {
    // Send all emails in parallel
    await Promise.all([
      this.sendOrderConfirmation(tenantId, orderData, tenantData),
      this.sendRestaurantNotification(tenantId, orderData, tenantData)
    ]);
  }
}
