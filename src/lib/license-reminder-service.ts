import db from '@/lib/db';
import nodemailer from 'nodemailer';

// Simple logger utility
const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  },
  
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
  }
};

interface ReminderSettings {
  daysBeforeExpiry: number[];
  emailTemplate: {
    subject: string;
    body: string;
  };
}

export class LicenseReminderService {
  private defaultReminderDays = [7, 3, 1]; // Days before expiry

  async setupReminders(licenseId: string, expiresAt: Date) {
    try {
      // Clear existing reminders
      await db.query(
        'DELETE FROM license_reminders WHERE license_id = ?',
        [licenseId]
      );

      // Set up new reminders
      const reminderPromises = this.defaultReminderDays.map(async (days) => {
        const reminderDate = new Date(expiresAt);
        reminderDate.setDate(reminderDate.getDate() - days);

        // Only set reminder if it's in the future
        if (reminderDate > new Date()) {
          await db.query(
            `INSERT INTO license_reminders (license_id, reminder_date, days_before_expiry, status)
             VALUES (?, ?, ?, 'pending')`,
            [licenseId, reminderDate, days]
          );
        }
      });

      await Promise.all(reminderPromises);
      
      logger.info(`Set up reminders for license ${licenseId}`);
    } catch (error) {
      logger.error('Failed to setup reminders:', error);
      throw error;
    }
  }

  async checkAndSendReminders() {
    try {
      // Get pending reminders that are due
      const [reminders] = await db.query(`
        SELECT 
          lr.*,
          lk.key_code,
          tl.expires_at,
          tl.tenant_id,
          t.name as tenant_name,
          t.email as tenant_email
        FROM license_reminders lr
        JOIN license_keys lk ON lr.license_id = lk.id
        JOIN tenant_licenses tl ON lk.id = tl.license_key_id
        JOIN tenants t ON tl.tenant_id = t.id
        WHERE lr.status = 'pending'
        AND lr.reminder_date <= NOW()
        AND tl.status = 'active'
      `) as any[];

      const sentReminders = [];

      for (const reminder of reminders) {
        try {
          await this.sendReminderEmail(reminder);
          
          // Mark reminder as sent
          await db.query(
            'UPDATE license_reminders SET status = ?, sent_at = NOW() WHERE id = ?',
            ['sent', reminder.id]
          );

          sentReminders.push(reminder);

          logger.info(`Sent reminder for license ${reminder.key_code} to ${reminder.tenant_email}`);
        } catch (error) {
          logger.error(`Failed to send reminder for license ${reminder.key_code}:`, error);
          
          // Mark as failed
          await db.query(
            'UPDATE license_reminders SET status = ?, error_message = ? WHERE id = ?',
            ['failed', error instanceof Error ? error.message : 'Unknown error', reminder.id]
          );
        }
      }

      return {
        totalChecked: reminders.length,
        sent: sentReminders.length,
        failed: reminders.length - sentReminders.length
      };

    } catch (error) {
      logger.error('Failed to check and send reminders:', error);
      throw error;
    }
  }

  private async sendReminderEmail(reminder: any) {
    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    });
    
    const subject = `OrderWeb License Expiring Soon - ${reminder.days_before_expiry} Day${reminder.days_before_expiry > 1 ? 's' : ''} Remaining`;
    
    const emailBody = this.generateReminderEmailBody(reminder);

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@orderwebonline.com',
      to: reminder.tenant_email,
      subject,
      html: emailBody
    });
  }

  private generateReminderEmailBody(reminder: any): string {
    const expiryDate = new Date(reminder.expires_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const urgencyClass = reminder.days_before_expiry <= 1 ? 'urgent' : 
                        reminder.days_before_expiry <= 3 ? 'warning' : 'info';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f8f9fa; }
            .license-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #667eea; }
            .urgent { border-left-color: #dc3545; }
            .warning { border-left-color: #ffc107; }
            .info { border-left-color: #17a2b8; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔑 OrderWeb License Reminder</h1>
                <p>Your license is expiring soon</p>
            </div>
            
            <div class="content">
                <h2>Hello ${reminder.tenant_name},</h2>
                
                <p>This is a friendly reminder that your OrderWeb license is expiring soon.</p>
                
                <div class="license-info ${urgencyClass}">
                    <h3>License Information</h3>
                    <p><strong>License Key:</strong> ${reminder.key_code}</p>
                    <p><strong>Expires On:</strong> ${expiryDate}</p>
                    <p><strong>Days Remaining:</strong> ${reminder.days_before_expiry}</p>
                    <p><strong>Restaurant:</strong> ${reminder.tenant_name}</p>
                </div>

                ${reminder.days_before_expiry <= 1 ? `
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h4 style="color: #856404; margin: 0 0 10px 0;">⚠️ Urgent Action Required</h4>
                    <p style="color: #856404; margin: 0;">Your license expires in ${reminder.days_before_expiry} day${reminder.days_before_expiry > 1 ? 's' : ''}! Please renew immediately to avoid service interruption.</p>
                </div>
                ` : ''}

                <h3>What happens next?</h3>
                <ul>
                    <li>Your current license will expire on ${expiryDate}</li>
                    <li>You have a 7-day grace period after expiration</li>
                    <li>During the grace period, your service will continue but with limitations</li>
                    <li>After the grace period, your service will be suspended</li>
                </ul>

                <h3>How to renew:</h3>
                <ol>
                    <li>Contact your OrderWeb administrator to get a new license key</li>
                    <li>Log into your restaurant dashboard</li>
                    <li>Go to the License section</li>
                    <li>Enter your new license key to activate</li>
                </ol>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/${reminder.tenant_id}/license" class="button">
                        Manage License
                    </a>
                </div>

                <p>If you have any questions or need assistance, please contact your OrderWeb administrator.</p>
            </div>
            
            <div class="footer">
                <p>This is an automated message from OrderWeb License Management System.</p>
                <p>© 2024 OrderWeb. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  async getDashboardReminders() {
    try {
      const [reminders] = await db.query(`
        SELECT 
          lr.*,
          lk.key_code,
          tl.expires_at,
          t.name as tenant_name,
          t.email as tenant_email,
          DATEDIFF(tl.expires_at, NOW()) as days_until_expiry
        FROM license_reminders lr
        JOIN license_keys lk ON lr.license_id = lk.id
        JOIN tenant_licenses tl ON lk.id = tl.license_key_id
        JOIN tenants t ON tl.tenant_id = t.id
        WHERE lr.status = 'pending'
        AND tl.status = 'active'
        AND DATEDIFF(tl.expires_at, NOW()) <= 7
        ORDER BY tl.expires_at ASC
        LIMIT 10
      `) as any[];

      return reminders;
    } catch (error) {
      logger.error('Failed to get dashboard reminders:', error);
      return [];
    }
  }

  async getExpiringLicenses(days: number = 30) {
    try {
      const [licenses] = await db.query(`
        SELECT 
          lk.*,
          tl.expires_at,
          t.name as tenant_name,
          t.email as tenant_email,
          DATEDIFF(tl.expires_at, NOW()) as days_until_expiry
        FROM license_keys lk
        JOIN tenant_licenses tl ON lk.id = tl.license_key_id
        JOIN tenants t ON tl.tenant_id = t.id
        WHERE tl.status = 'active'
        AND DATEDIFF(tl.expires_at, NOW()) <= ?
        AND DATEDIFF(tl.expires_at, NOW()) >= 0
        ORDER BY tl.expires_at ASC
      `, [days]) as any[];

      return licenses;
    } catch (error) {
      logger.error('Failed to get expiring licenses:', error);
      return [];
    }
  }

  async cleanupOldReminders() {
    try {
      // Remove reminders for expired licenses (older than 30 days)
      await db.query(`
        DELETE lr FROM license_reminders lr
        JOIN license_keys lk ON lr.license_id = lk.id
        JOIN tenant_licenses tl ON lk.id = tl.license_key_id
        WHERE tl.expires_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);

      logger.info('Cleaned up old reminders');
    } catch (error) {
      logger.error('Failed to cleanup old reminders:', error);
    }
  }
}
