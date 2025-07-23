import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import Handlebars from 'handlebars';
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
  tenant_id?: string;
  template_type: string;
  subject: string;
  html_content: string;
  variables?: Record<string, any>;
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// Universal Email Service for Super Admin, Tenant, and Restaurant Admin
export class UniversalEmailService {
  private static instance: UniversalEmailService;
  private systemEmailConfig: EmailConfig;
  private transporter: nodemailer.Transporter | null = null;
  
  private constructor() {
    this.systemEmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true' || true, // Enable SSL/TLS for port 465
      auth: {
        user: process.env.SMTP_USER || 'noreply@ordertest.co.uk',
        pass: process.env.SMTP_PASSWORD || 'Galib54321@@',
      },
      from: process.env.SMTP_FROM || 'OrderWeb System <noreply@ordertest.co.uk>'
    };
    
    this.initializeTransporter();
  }

  public static getInstance(): UniversalEmailService {
    if (!UniversalEmailService.instance) {
      UniversalEmailService.instance = new UniversalEmailService();
    }
    return UniversalEmailService.instance;
  }

  private async initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.systemEmailConfig.host,
        port: this.systemEmailConfig.port,
        secure: this.systemEmailConfig.secure,
        auth: this.systemEmailConfig.auth,
      });

      // Verify connection
      if (this.transporter) {
        await this.transporter.verify();
        console.log('✅ Email service initialized successfully');
      }
    } catch (error) {
      console.error('❌ Email service initialization failed:', error);
      this.transporter = null;
    }
  }

  // Get tenant-specific email configuration
  private async getTenantEmailConfig(tenantId: string): Promise<EmailConfig | null> {
    try {
      const [rows] = await db.execute(`
        SELECT smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password, smtp_from, name
        FROM tenants 
        WHERE id = ? AND smtp_host IS NOT NULL
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
        from: tenant.smtp_from || `${tenant.name} <noreply@${tenant.smtp_host}>`
      };
    } catch (error) {
      console.error('Error getting tenant email config:', error);
      return null;
    }
  }

  // Create tenant-specific transporter
  private async createTenantTransporter(tenantId: string): Promise<nodemailer.Transporter | null> {
    const tenantConfig = await this.getTenantEmailConfig(tenantId);
    
    if (!tenantConfig) {
      return this.transporter; // Fallback to system transporter
    }

    try {
      const tenantTransporter = nodemailer.createTransport({
        host: tenantConfig.host,
        port: tenantConfig.port,
        secure: tenantConfig.secure,
        auth: tenantConfig.auth,
      });

      await tenantTransporter.verify();
      return tenantTransporter;
    } catch (error) {
      console.error('Tenant transporter creation failed:', error);
      return this.transporter; // Fallback to system transporter
    }
  }

  // Send email with context (system, tenant, or restaurant)
  public async sendEmail(emailData: EmailData, context?: {
    type: 'system' | 'tenant' | 'restaurant';
    tenantId?: string;
    userId?: string;
  }): Promise<boolean> {
    try {
      let transporter = this.transporter;
      let fromAddress = this.systemEmailConfig.from;

      // Use tenant-specific configuration if available
      if (context?.tenantId) {
        const tenantTransporter = await this.createTenantTransporter(context.tenantId);
        if (tenantTransporter) {
          transporter = tenantTransporter;
          const tenantConfig = await this.getTenantEmailConfig(context.tenantId);
          if (tenantConfig) {
            fromAddress = tenantConfig.from;
          }
        }
      }

      if (!transporter) {
        console.error('No email transporter available');
        return false;
      }

      const mailOptions = {
        from: emailData.from || fromAddress,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        cc: emailData.cc,
        bcc: emailData.bcc,
        attachments: emailData.attachments,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);

      // Log email activity
      await this.logEmailActivity(emailData, context, 'sent', result.messageId);
      
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      await this.logEmailActivity(emailData, context, 'failed', null, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  // Log email activity for tracking
  private async logEmailActivity(
    emailData: EmailData,
    context?: { type: 'system' | 'tenant' | 'restaurant'; tenantId?: string; userId?: string },
    status: 'sent' | 'failed' = 'sent',
    messageId?: string | null,
    errorMessage?: string
  ) {
    try {
      await db.execute(`
        INSERT INTO email_logs (
          id, tenant_id, user_id, recipient_email, subject, 
          status, message_id, error_message, context_type, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        uuidv4(),
        context?.tenantId || null,
        context?.userId || null,
        emailData.to,
        emailData.subject,
        status,
        messageId || null,
        errorMessage || null,
        context?.type || 'system'
      ]);
    } catch (error) {
      console.error('Failed to log email activity:', error);
    }
  }

  // Get email template with variable substitution
  public async getEmailTemplate(
    templateType: string,
    variables: Record<string, any> = {},
    tenantId?: string
  ): Promise<{ subject: string; html: string } | null> {
    try {
      let template: EmailTemplate | null = null;

      // Try to get tenant-specific template first
      if (tenantId) {
        const [rows] = await db.execute(`
          SELECT * FROM email_templates 
          WHERE tenant_id = ? AND template_type = ? AND active = 1
          ORDER BY updated_at DESC LIMIT 1
        `, [tenantId, templateType]);
        
        template = (rows as any[])[0];
      }

      // Fallback to system template
      if (!template) {
        const [rows] = await db.execute(`
          SELECT * FROM email_templates 
          WHERE tenant_id IS NULL AND template_type = ? AND active = 1
          ORDER BY updated_at DESC LIMIT 1
        `, [templateType]);
        
        template = (rows as any[])[0];
      }

      // Use default template if none found
      if (!template) {
        template = this.getDefaultTemplate(templateType);
      }

      if (!template) {
        return null;
      }

      // Compile templates with Handlebars
      const subjectTemplate = Handlebars.compile(template.subject);
      const htmlTemplate = Handlebars.compile(template.html_content);

      return {
        subject: subjectTemplate(variables),
        html: htmlTemplate(variables)
      };
    } catch (error) {
      console.error('Error getting email template:', error);
      return null;
    }
  }

  // Default email templates
  private getDefaultTemplate(templateType: string): EmailTemplate | null {
    const defaultTemplates: Record<string, EmailTemplate> = {
      // Super Admin Templates
      'super_admin_invoice_generated': {
        id: 'default-super-admin-invoice',
        template_type: 'super_admin_invoice_generated',
        subject: 'New Invoice Generated - {{restaurant_name}}',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1e40af; margin: 0; font-size: 28px;">OrderWeb</h1>
                <p style="color: #6b7280; margin: 5px 0 0 0;">Restaurant Management System</p>
              </div>
              
              <h2 style="color: #333; margin-bottom: 20px;">Invoice Generated</h2>
              <p>A new invoice has been generated for <strong>{{restaurant_name}}</strong>.</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #374151;">Invoice Details</h3>
                <p><strong>Invoice ID:</strong> {{invoice_id}}</p>
                <p><strong>Amount:</strong> {{amount}}</p>
                <p><strong>Plan:</strong> {{plan_name}}</p>
                <p><strong>Period:</strong> {{billing_period}}</p>
                <p><strong>Due Date:</strong> {{due_date}}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{invoice_url}}" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Invoice</a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
                This is an automated message from OrderWeb System.
              </p>
            </div>
          </div>
        `
      },

      // Restaurant Admin Templates
      'restaurant_license_expiry': {
        id: 'default-license-expiry',
        template_type: 'restaurant_license_expiry',
        subject: 'License Expiry Reminder - {{restaurant_name}}',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1e40af; margin: 0; font-size: 28px;">OrderWeb</h1>
                <p style="color: #6b7280; margin: 5px 0 0 0;">Restaurant Management System</p>
              </div>
              
              <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                <h2 style="color: #92400e; margin-top: 0;">⚠️ License Expiry Reminder</h2>
                <p style="color: #92400e; margin-bottom: 0;">Your OrderWeb license is expiring soon!</p>
              </div>
              
              <p>Dear {{restaurant_name}} Team,</p>
              <p>This is a reminder that your OrderWeb license will expire in <strong>{{days_remaining}} days</strong>.</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #374151;">License Details</h3>
                <p><strong>License ID:</strong> {{license_id}}</p>
                <p><strong>Expiry Date:</strong> {{expiry_date}}</p>
                <p><strong>Days Remaining:</strong> {{days_remaining}}</p>
              </div>
              
              <p>To avoid any service interruption, please contact our support team to renew your license.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{contact_url}}" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Contact Support</a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
                Need help? Contact us at support@orderweb.com
              </p>
            </div>
          </div>
        `
      },

      // Order Templates
      'order_confirmation': {
        id: 'default-order-confirmation',
        template_type: 'order_confirmation',
        subject: 'Order Confirmation - {{restaurant_name}}',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              {{#if restaurant_logo}}
                <div style="text-align: center; margin-bottom: 20px;">
                  <img src="{{restaurant_logo}}" alt="{{restaurant_name}}" style="max-height: 80px;">
                </div>
              {{/if}}
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: {{primary_color}}; margin: 0;">{{restaurant_name}}</h1>
                {{#if restaurant_address}}<p style="color: #6b7280; margin: 5px 0;">{{restaurant_address}}</p>{{/if}}
              </div>
              
              <div style="background: #10b981; color: white; padding: 20px; border-radius: 6px; text-align: center; margin-bottom: 30px;">
                <h2 style="margin: 0; font-size: 24px;">✅ Order Confirmed!</h2>
                <p style="margin: 10px 0 0 0;">Thank you for your order, {{customer_name}}!</p>
              </div>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #374151;">Order Details</h3>
                <p><strong>Order ID:</strong> {{order_id}}</p>
                <p><strong>Order Type:</strong> {{order_type}}</p>
                {{#if table_number}}<p><strong>Table:</strong> {{table_number}}</p>{{/if}}
                {{#if delivery_address}}<p><strong>Delivery Address:</strong> {{delivery_address}}</p>{{/if}}
                <p><strong>Phone:</strong> {{customer_phone}}</p>
              </div>
              
              <h3 style="color: #374151;">Order Items</h3>
              <div style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                {{#each items}}
                <div style="padding: 15px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong>{{name}}</strong>
                    <span style="color: #6b7280;"> x{{quantity}}</span>
                  </div>
                  <span style="font-weight: bold;">£{{price}}</span>
                </div>
                {{/each}}
                <div style="padding: 15px; background: #f9fafb; font-weight: bold; display: flex; justify-content: space-between;">
                  <span>Total:</span>
                  <span>£{{total}}</span>
                </div>
              </div>
              
              {{#if special_instructions}}
              <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #92400e;">Special Instructions</h4>
                <p style="margin-bottom: 0; color: #92400e;">{{special_instructions}}</p>
              </div>
              {{/if}}
              
              <div style="background: #dbeafe; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #1e40af;">What's Next?</h4>
                <p style="margin-bottom: 0; color: #1e40af;">We're preparing your order now. You'll receive another email when it's ready!</p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
                Questions? Contact us at {{restaurant_email}} or {{restaurant_phone}}
              </p>
            </div>
          </div>
        `
      },

      // Welcome Email
      'welcome_restaurant': {
        id: 'default-welcome-restaurant',
        template_type: 'welcome_restaurant',
        subject: 'Welcome to OrderWeb - {{restaurant_name}}',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1e40af; margin: 0; font-size: 32px;">🎉 Welcome to OrderWeb!</h1>
                <p style="color: #6b7280; margin: 15px 0 0 0; font-size: 18px;">Your restaurant management journey starts here</p>
              </div>
              
              <p>Dear {{admin_name}},</p>
              <p>Welcome to OrderWeb! We're excited to have <strong>{{restaurant_name}}</strong> as part of our platform.</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #374151;">Your Account Details</h3>
                <p><strong>Restaurant:</strong> {{restaurant_name}}</p>
                <p><strong>Email:</strong> {{admin_email}}</p>
                <p><strong>Plan:</strong> {{plan_name}}</p>
                <p><strong>Trial Period:</strong> {{trial_days}} days</p>
              </div>
              
              <h3 style="color: #374151;">Getting Started</h3>
              <div style="margin: 20px 0;">
                <div style="padding: 15px; border-left: 4px solid #10b981; background: #f0fdf4; margin-bottom: 10px;">
                  <strong>Step 1:</strong> Set up your restaurant profile and menu
                </div>
                <div style="padding: 15px; border-left: 4px solid #3b82f6; background: #eff6ff; margin-bottom: 10px;">
                  <strong>Step 2:</strong> Configure your payment and delivery settings
                </div>
                <div style="padding: 15px; border-left: 4px solid #f59e0b; background: #fffbeb;">
                  <strong>Step 3:</strong> Start receiving orders!
                </div>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{admin_panel_url}}" style="background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Access Your Admin Panel</a>
              </div>
              
              <div style="background: #dbeafe; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #1e40af;">Need Help?</h4>
                <p style="margin-bottom: 0; color: #1e40af;">Our support team is here to help you get started. Contact us anytime!</p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
                Support: support@orderweb.com | Phone: +44 20 1234 5678
              </p>
            </div>
          </div>
        `
      }
    };

    return defaultTemplates[templateType] || null;
  }

  // Bulk email sending for marketing/notifications
  public async sendBulkEmails(
    emails: Array<{
      to: string;
      subject: string;
      html: string;
      variables?: Record<string, any>;
    }>,
    context?: { type: 'system' | 'tenant'; tenantId?: string }
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      const success = await this.sendEmail({
        to: email.to,
        subject: email.subject,
        html: email.html
      }, context);

      if (success) {
        sent++;
      } else {
        failed++;
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { sent, failed };
  }

  // Test email configuration
  public async testEmailConfig(tenantId?: string): Promise<boolean> {
    try {
      const testEmail: EmailData = {
        to: this.systemEmailConfig.auth.user,
        subject: 'OrderWeb Email Test',
        html: '<h2>✅ Email configuration is working!</h2><p>This is a test email from OrderWeb system.</p>'
      };

      return await this.sendEmail(testEmail, tenantId ? { type: 'tenant', tenantId } : { type: 'system' });
    } catch (error) {
      console.error('Email test failed:', error);
      return false;
    }
  }

  // Helper methods for common email types
  public async sendInvoiceEmail(invoiceData: {
    restaurant_name: string;
    restaurant_email: string;
    invoice_id: string;
    amount: string;
    plan_name: string;
    billing_period: string;
    due_date: string;
    invoice_url?: string;
  }, tenantId?: string): Promise<boolean> {
    const template = await this.getEmailTemplate('super_admin_invoice_generated', invoiceData, tenantId);
    if (!template) return false;

    return this.sendEmail({
      to: invoiceData.restaurant_email,
      subject: template.subject,
      html: template.html
    }, { type: 'system' });
  }

  public async sendLicenseExpiryEmail(licenseData: {
    restaurant_name: string;
    restaurant_email: string;
    license_id: string;
    expiry_date: string;
    days_remaining: number;
    contact_url?: string;
  }, tenantId?: string): Promise<boolean> {
    const template = await this.getEmailTemplate('restaurant_license_expiry', licenseData, tenantId);
    if (!template) return false;

    return this.sendEmail({
      to: licenseData.restaurant_email,
      subject: template.subject,
      html: template.html
    }, tenantId ? { type: 'tenant', tenantId } : { type: 'system' });
  }

  public async sendWelcomeEmail(welcomeData: {
    restaurant_name: string;
    admin_email: string;
    admin_name: string;
    plan_name: string;
    trial_days: number;
    admin_panel_url?: string;
  }, tenantId?: string): Promise<boolean> {
    const template = await this.getEmailTemplate('welcome_restaurant', welcomeData, tenantId);
    if (!template) return false;

    return this.sendEmail({
      to: welcomeData.admin_email,
      subject: template.subject,
      html: template.html
    }, { type: 'system' });
  }
}

// Export singleton instance
export const emailService = UniversalEmailService.getInstance();
export default emailService;
