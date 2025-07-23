import nodemailer from 'nodemailer';
import pool from './db';

export interface TenantEmailSettings {
  id?: number;
  tenant_id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  reply_to?: string;
  is_ssl: boolean;
  is_active: boolean;
  last_test_success?: Date;
  failure_count: number;
}

export interface EmailQueueItem {
  id?: number;
  tenant_id: string;
  order_id?: string;
  recipient_email: string;
  recipient_name?: string;
  email_type: 'customer_confirmation' | 'restaurant_notification';
  subject: string;
  html_body: string;
  text_body?: string;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'retry';
  priority: 'low' | 'normal' | 'high';
  attempts: number;
  max_attempts: number;
  error_message?: string;
  scheduled_at?: Date;
}

export interface SmtpFailureLog {
  tenant_id: string;
  order_id?: string;
  email_type: 'customer_confirmation' | 'restaurant_notification';
  error_message: string;
  smtp_host: string;
  used_system_fallback: boolean;
  notified_super_admin: boolean;
}

class TenantEmailService {
  private systemTransporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeSystemSMTP();
  }

  /**
   * Initialize system SMTP for fallback
   */
  private async initializeSystemSMTP() {
    try {
      // Get system SMTP settings from super admin configuration
      const [systemSmtp] = await pool.execute(
        'SELECT * FROM super_admin_smtp_settings LIMIT 1'
      ) as [any[], any];

      if (systemSmtp.length > 0) {
        const settings = systemSmtp[0];
        this.systemTransporter = nodemailer.createTransport({
          host: settings.host,
          port: settings.port,
          secure: settings.port === 465,
          auth: {
            user: settings.user,
            pass: settings.password,
          },
        });
      }
    } catch (error) {
      console.error('Failed to initialize system SMTP:', error);
    }
  }

  /**
   * Get restaurant's email settings
   */
  async getTenantEmailSettings(tenantId: string): Promise<TenantEmailSettings | null> {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM tenant_email_settings WHERE tenant_id = ? AND is_active = TRUE',
        [tenantId]
      ) as [any[], any];

      return rows.length > 0 ? rows[0] as TenantEmailSettings : null;
    } catch (error) {
      console.error('Error getting tenant email settings:', error);
      return null;
    }
  }

  /**
   * Save or update restaurant email settings
   */
  async saveTenantEmailSettings(settings: TenantEmailSettings): Promise<boolean> {
    try {
      const existingSettings = await this.getTenantEmailSettings(settings.tenant_id);

      if (existingSettings) {
        // Update existing settings
        await pool.execute(
          `UPDATE tenant_email_settings 
           SET smtp_host = ?, smtp_port = ?, smtp_username = ?, smtp_password = ?, 
               from_email = ?, from_name = ?, reply_to = ?, is_ssl = ?, is_active = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE tenant_id = ?`,
          [
            settings.smtp_host,
            settings.smtp_port,
            settings.smtp_username,
            settings.smtp_password,
            settings.from_email,
            settings.from_name,
            settings.reply_to || null,
            settings.is_ssl,
            settings.is_active,
            settings.tenant_id
          ]
        );
      } else {
        // Insert new settings
        await pool.execute(
          `INSERT INTO tenant_email_settings 
           (tenant_id, smtp_host, smtp_port, smtp_username, smtp_password, 
            from_email, from_name, reply_to, is_ssl, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            settings.tenant_id,
            settings.smtp_host,
            settings.smtp_port,
            settings.smtp_username,
            settings.smtp_password,
            settings.from_email,
            settings.from_name,
            settings.reply_to || null,
            settings.is_ssl,
            settings.is_active
          ]
        );
      }

      return true;
    } catch (error) {
      console.error('Error saving tenant email settings:', error);
      return false;
    }
  }

  /**
   * Test restaurant SMTP settings
   */
  async testTenantSMTP(settings: TenantEmailSettings): Promise<{ success: boolean; error?: string }> {
    try {
      const transporter = nodemailer.createTransport({
        host: settings.smtp_host,
        port: settings.smtp_port,
        secure: settings.smtp_port === 465,
        auth: {
          user: settings.smtp_username,
          pass: settings.smtp_password,
        },
      });

      // Verify connection
      await transporter.verify();

      // Update last test success
      await pool.execute(
        'UPDATE tenant_email_settings SET last_test_success = CURRENT_TIMESTAMP, failure_count = 0 WHERE tenant_id = ?',
        [settings.tenant_id]
      );

      return { success: true };
    } catch (error: any) {
      console.error('SMTP test failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create transporter for restaurant SMTP
   */
  private createTenantTransporter(settings: TenantEmailSettings): nodemailer.Transporter {
    return nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.smtp_port === 465,
      auth: {
        user: settings.smtp_username,
        pass: settings.smtp_password,
      },
    });
  }

  /**
   * Send email using restaurant SMTP with system fallback
   */
  async sendEmail(
    tenantId: string,
    to: string,
    subject: string,
    htmlBody: string,
    textBody?: string,
    emailType: 'customer_confirmation' | 'restaurant_notification' = 'customer_confirmation',
    orderId?: string
  ): Promise<{ success: boolean; usedFallback: boolean; error?: string }> {
    const tenantSettings = await this.getTenantEmailSettings(tenantId);
    
    if (!tenantSettings) {
      return await this.sendViaSystemSMTP(
        tenantId, to, subject, htmlBody, textBody, emailType, orderId, 
        'No restaurant SMTP configured'
      );
    }

    try {
      const transporter = this.createTenantTransporter(tenantSettings);
      
      const mailOptions = {
        from: `${tenantSettings.from_name} <${tenantSettings.from_email}>`,
        to: to,
        subject: subject,
        html: htmlBody,
        text: textBody,
        replyTo: tenantSettings.reply_to || tenantSettings.from_email,
      };

      await transporter.sendMail(mailOptions);
      
      // Reset failure count on success
      await pool.execute(
        'UPDATE tenant_email_settings SET failure_count = 0 WHERE tenant_id = ?',
        [tenantId]
      );

      return { success: true, usedFallback: false };
    } catch (error: any) {
      console.error('Restaurant SMTP failed:', error);
      
      // Log failure and increment count
      await this.logSmtpFailure({
        tenant_id: tenantId,
        order_id: orderId,
        email_type: emailType,
        error_message: error.message,
        smtp_host: tenantSettings.smtp_host,
        used_system_fallback: true,
        notified_super_admin: false
      });

      await pool.execute(
        'UPDATE tenant_email_settings SET failure_count = failure_count + 1 WHERE tenant_id = ?',
        [tenantId]
      );

      // Try system fallback
      return await this.sendViaSystemSMTP(
        tenantId, to, subject, htmlBody, textBody, emailType, orderId, error.message
      );
    }
  }

  /**
   * Send email via system SMTP (fallback)
   */
  private async sendViaSystemSMTP(
    tenantId: string,
    to: string,
    subject: string,
    htmlBody: string,
    textBody?: string,
    emailType: 'customer_confirmation' | 'restaurant_notification' = 'customer_confirmation',
    orderId?: string,
    originalError?: string
  ): Promise<{ success: boolean; usedFallback: boolean; error?: string }> {
    if (!this.systemTransporter) {
      return { success: false, usedFallback: false, error: 'No system SMTP available' };
    }

    try {
      // Get tenant info for branding
      const [tenantInfo] = await pool.execute(
        'SELECT name, email FROM tenants WHERE id = ?',
        [tenantId]
      ) as [any[], any];

      const tenant = tenantInfo[0];
      const fromName = tenant ? tenant.name : 'OrderWeb Restaurant';
      const replyTo = tenant ? tenant.email : 'noreply@orderweb.com';

      const mailOptions = {
        from: `${fromName} <noreply@orderweb.com>`,
        to: to,
        subject: `[System] ${subject}`,
        html: htmlBody,
        text: textBody,
        replyTo: replyTo,
      };

      await this.systemTransporter.sendMail(mailOptions);

      // Create Super Admin notification
      await this.createSuperAdminNotification(
        tenantId,
        'smtp_failure',
        'Restaurant SMTP Failed - Using System Backup',
        `Restaurant SMTP failed for ${tenant?.name || tenantId}. Original error: ${originalError}. Email sent via system backup.`,
        'medium'
      );

      return { success: true, usedFallback: true };
    } catch (error: any) {
      console.error('System SMTP also failed:', error);
      return { success: false, usedFallback: false, error: error.message };
    }
  }

  /**
   * Log SMTP failure for monitoring
   */
  private async logSmtpFailure(failure: SmtpFailureLog): Promise<void> {
    try {
      await pool.execute(
        `INSERT INTO smtp_failure_logs 
         (tenant_id, order_id, email_type, error_message, smtp_host, used_system_fallback, notified_super_admin)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          failure.tenant_id,
          failure.order_id || null,
          failure.email_type,
          failure.error_message,
          failure.smtp_host,
          failure.used_system_fallback,
          failure.notified_super_admin
        ]
      );
    } catch (error) {
      console.error('Error logging SMTP failure:', error);
    }
  }

  /**
   * Create Super Admin notification
   */
  private async createSuperAdminNotification(
    tenantId: string,
    type: 'smtp_failure' | 'email_health' | 'system_alert',
    title: string,
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    try {
      await pool.execute(
        `INSERT INTO super_admin_notifications 
         (type, tenant_id, title, message, severity, action_required)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [type, tenantId, title, message, severity, type === 'smtp_failure']
      );
    } catch (error) {
      console.error('Error creating super admin notification:', error);
    }
  }

  /**
   * Queue email for background processing
   */
  async queueEmail(emailData: Partial<EmailQueueItem>): Promise<boolean> {
    try {
      await pool.execute(
        `INSERT INTO email_queue 
         (tenant_id, order_id, recipient_email, recipient_name, email_type, 
          subject, html_body, text_body, priority)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          emailData.tenant_id,
          emailData.order_id || null,
          emailData.recipient_email,
          emailData.recipient_name || null,
          emailData.email_type,
          emailData.subject,
          emailData.html_body,
          emailData.text_body || null,
          emailData.priority || 'normal'
        ]
      );

      return true;
    } catch (error) {
      console.error('Error queuing email:', error);
      return false;
    }
  }

  /**
   * Process email queue (background job)
   */
  async processEmailQueue(limit: number = 10): Promise<void> {
    try {
      const [queueItems] = await pool.execute(
        `SELECT * FROM email_queue 
         WHERE status = 'pending' AND scheduled_at <= NOW() 
         ORDER BY priority DESC, scheduled_at ASC 
         LIMIT ?`,
        [limit]
      ) as [any[], any];

      for (const item of queueItems) {
        await this.processQueueItem(item as EmailQueueItem);
      }
    } catch (error) {
      console.error('Error processing email queue:', error);
    }
  }

  /**
   * Process individual queue item
   */
  private async processQueueItem(item: EmailQueueItem): Promise<void> {
    try {
      // Mark as processing
      await pool.execute(
        'UPDATE email_queue SET status = "processing", attempts = attempts + 1 WHERE id = ?',
        [item.id]
      );

      const result = await this.sendEmail(
        item.tenant_id,
        item.recipient_email,
        item.subject,
        item.html_body,
        item.text_body,
        item.email_type,
        item.order_id
      );

      if (result.success) {
        // Mark as sent
        await pool.execute(
          'UPDATE email_queue SET status = "sent", processed_at = NOW(), sent_at = NOW() WHERE id = ?',
          [item.id]
        );
      } else {
        // Handle failure
        const shouldRetry = (item.attempts || 0) < (item.max_attempts || 3);
        const newStatus = shouldRetry ? 'retry' : 'failed';
        
        await pool.execute(
          'UPDATE email_queue SET status = ?, error_message = ?, processed_at = NOW() WHERE id = ?',
          [newStatus, result.error, item.id]
        );

        if (shouldRetry) {
          // Schedule retry (exponential backoff)
          const retryDelay = Math.pow(2, item.attempts || 0) * 5; // 5, 10, 20 minutes
          await pool.execute(
            'UPDATE email_queue SET scheduled_at = DATE_ADD(NOW(), INTERVAL ? MINUTE), status = "pending" WHERE id = ?',
            [retryDelay, item.id]
          );
        }
      }
    } catch (error) {
      console.error('Error processing queue item:', error);
      await pool.execute(
        'UPDATE email_queue SET status = "failed", error_message = ?, processed_at = NOW() WHERE id = ?',
        [error instanceof Error ? error.message : 'Unknown error', item.id]
      );
    }
  }
}

export const tenantEmailService = new TenantEmailService();
