/**
 * Production-Level Enhanced Email Service
 * Comprehensive email service with improved error handling, validation, and monitoring
 */

import nodemailer from 'nodemailer';
import pool from './db';
import { logger } from './email-logger';
import { z } from 'zod';
import { 
  validateAndSanitizeInput,
  validateEnvironment,
  TenantEmailSettingsSchema,
  EmailQueueSchema,
  EmailValidationError,
  EmailConfigurationError,
  EmailServiceError,
  RateLimiter,
  sanitizeHtmlContent
} from './email-validation';
import { 
  TenantEmailSettings, 
  EmailQueueItem, 
  SmtpFailureLog,
  ApiResponse,
  EmailConfigEnvironment
} from './types/email-types';

export class EnhancedEmailService {
  private static instance: EnhancedEmailService;
  private systemTransporter: nodemailer.Transporter | null = null;
  private tenantTransporters: Map<string, nodemailer.Transporter> = new Map();
  private config: EmailConfigEnvironment;
  private connectionPool: Map<string, nodemailer.Transporter> = new Map();
  private readonly MAX_RETRIES = 3;
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 300000; // 5 minutes
  private circuitBreakers: Map<string, { failures: number; lastFailure: Date; isOpen: boolean }> = new Map();

  private constructor() {
    this.config = validateEnvironment();
    this.initializeSystemTransporter();
  }

  public static getInstance(): EnhancedEmailService {
    if (!EnhancedEmailService.instance) {
      EnhancedEmailService.instance = new EnhancedEmailService();
    }
    return EnhancedEmailService.instance;
  }

  private async initializeSystemTransporter(): Promise<void> {
    try {
      this.systemTransporter = nodemailer.createTransport({
        host: this.config.SYSTEM_EMAIL_HOST,
        port: this.config.SYSTEM_EMAIL_PORT,
        secure: this.config.SYSTEM_EMAIL_PORT === 465,
        auth: {
          user: this.config.SYSTEM_EMAIL_USER,
          pass: this.config.SYSTEM_EMAIL_PASS,
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 5,
      });

      // Verify system transporter
      if (this.systemTransporter) {
        await this.systemTransporter.verify();
      }
      logger.info('System email transporter initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize system email transporter', {}, error as Error);
      throw new EmailConfigurationError('System email configuration is invalid', { error });
    }
  }

  private async getTenantTransporter(tenantId: string): Promise<nodemailer.Transporter | null> {
    try {
      // Check circuit breaker
      if (this.isCircuitBreakerOpen(tenantId)) {
        logger.warn('Circuit breaker is open for tenant', { tenantId });
        return null;
      }

      // Check if transporter is cached
      if (this.tenantTransporters.has(tenantId)) {
        return this.tenantTransporters.get(tenantId)!;
      }

      // Get tenant email settings
      const settings = await this.getTenantEmailSettings(tenantId);
      if (!settings || !settings.is_active) {
        return null;
      }

      // Create transporter
      const transporter = nodemailer.createTransport({
        host: settings.smtp_host,
        port: settings.smtp_port,
        secure: settings.is_ssl,
        auth: {
          user: settings.smtp_username,
          pass: settings.smtp_password,
        },
        pool: true,
        maxConnections: 3,
        maxMessages: 50,
        rateDelta: 1000,
        rateLimit: 10,
      });

      // Verify transporter
      await transporter.verify();
      
      // Cache transporter
      this.tenantTransporters.set(tenantId, transporter);
      this.resetCircuitBreaker(tenantId);
      
      logger.info('Tenant transporter created successfully', { tenantId });
      return transporter;

    } catch (error) {
      logger.error('Failed to create tenant transporter', { tenantId }, error as Error);
      this.recordCircuitBreakerFailure(tenantId);
      return null;
    }
  }

  private isCircuitBreakerOpen(tenantId: string): boolean {
    const breaker = this.circuitBreakers.get(tenantId);
    if (!breaker) return false;

    if (breaker.isOpen) {
      const timeSinceLastFailure = Date.now() - breaker.lastFailure.getTime();
      if (timeSinceLastFailure > this.CIRCUIT_BREAKER_TIMEOUT) {
        // Half-open state - allow one request
        breaker.isOpen = false;
        return false;
      }
      return true;
    }

    return breaker.failures >= this.CIRCUIT_BREAKER_THRESHOLD;
  }

  private recordCircuitBreakerFailure(tenantId: string): void {
    const breaker = this.circuitBreakers.get(tenantId) || { failures: 0, lastFailure: new Date(), isOpen: false };
    breaker.failures++;
    breaker.lastFailure = new Date();
    
    if (breaker.failures >= this.CIRCUIT_BREAKER_THRESHOLD) {
      breaker.isOpen = true;
      logger.warn('Circuit breaker opened for tenant', { tenantId }, {
        failures: breaker.failures,
        threshold: this.CIRCUIT_BREAKER_THRESHOLD
      });
    }

    this.circuitBreakers.set(tenantId, breaker);
  }

  private resetCircuitBreaker(tenantId: string): void {
    this.circuitBreakers.delete(tenantId);
  }

  public async getTenantEmailSettings(tenantId: string): Promise<TenantEmailSettings | null> {
    try {
      validateAndSanitizeInput(z.string().uuid(), tenantId);

      const [rows] = await pool.execute(
        'SELECT * FROM tenant_email_settings WHERE tenant_id = ?',
        [tenantId]
      );

      const settings = Array.isArray(rows) && rows.length > 0 ? rows[0] as any : null;
      
      if (settings) {
        logger.debug('Retrieved tenant email settings', { tenantId });
        return settings;
      }

      return null;
    } catch (error) {
      logger.error('Failed to get tenant email settings', { tenantId }, error as Error);
      throw new EmailServiceError('Failed to retrieve email settings');
    }
  }

  public async saveTenantEmailSettings(settings: Partial<TenantEmailSettings>): Promise<boolean> {
    try {
      const validatedSettings = validateAndSanitizeInput(TenantEmailSettingsSchema, settings);

      // Check rate limit
      if (!RateLimiter.isAllowed(`settings_${validatedSettings.tenant_id}`, 5, 60000)) {
        throw new EmailValidationError('Rate limit exceeded for email settings updates');
      }

      const connection = await pool.getConnection();
      
      try {
        await connection.beginTransaction();

        // Check if settings exist
        const [existing] = await connection.execute(
          'SELECT id FROM tenant_email_settings WHERE tenant_id = ?',
          [validatedSettings.tenant_id]
        );

        if (Array.isArray(existing) && existing.length > 0) {
          // Update existing
          await connection.execute(`
            UPDATE tenant_email_settings 
            SET smtp_host = ?, smtp_port = ?, smtp_username = ?, smtp_password = ?,
                from_email = ?, from_name = ?, reply_to = ?, is_ssl = ?, is_active = ?,
                failure_count = ?, updated_at = CURRENT_TIMESTAMP
            WHERE tenant_id = ?
          `, [
            validatedSettings.smtp_host,
            validatedSettings.smtp_port,
            validatedSettings.smtp_username,
            validatedSettings.smtp_password,
            validatedSettings.from_email,
            validatedSettings.from_name,
            validatedSettings.reply_to || null,
            validatedSettings.is_ssl,
            validatedSettings.is_active,
            validatedSettings.failure_count || 0,
            validatedSettings.tenant_id
          ]);
        } else {
          // Insert new
          await connection.execute(`
            INSERT INTO tenant_email_settings 
            (tenant_id, smtp_host, smtp_port, smtp_username, smtp_password, from_email, from_name, reply_to, is_ssl, is_active, failure_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            validatedSettings.tenant_id,
            validatedSettings.smtp_host,
            validatedSettings.smtp_port,
            validatedSettings.smtp_username,
            validatedSettings.smtp_password,
            validatedSettings.from_email,
            validatedSettings.from_name,
            validatedSettings.reply_to || null,
            validatedSettings.is_ssl,
            validatedSettings.is_active,
            validatedSettings.failure_count || 0
          ]);
        }

        await connection.commit();
        
        // Clear cached transporter
        this.tenantTransporters.delete(validatedSettings.tenant_id);
        
        logger.info('Tenant email settings saved successfully', { tenantId: validatedSettings.tenant_id });
        return true;

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

    } catch (error) {
      logger.error('Failed to save tenant email settings', { tenantId: settings.tenant_id }, error as Error);
      if (error instanceof EmailValidationError) {
        throw error;
      }
      throw new EmailServiceError('Failed to save email settings');
    }
  }

  public async testTenantSmtp(tenantId: string, testEmail?: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      validateAndSanitizeInput(z.string().uuid(), tenantId);

      // Check rate limit
      if (!RateLimiter.isAllowed(`test_${tenantId}`, 3, 300000)) { // 3 tests per 5 minutes
        throw new EmailValidationError('Rate limit exceeded for SMTP testing');
      }

      const settings = await this.getTenantEmailSettings(tenantId);
      if (!settings) {
        return {
          success: false,
          message: 'No email settings found for tenant'
        };
      }

      // Create test transporter
      const transporter = nodemailer.createTransport({
        host: settings.smtp_host,
        port: settings.smtp_port,
        secure: settings.is_ssl,
        auth: {
          user: settings.smtp_username,
          pass: settings.smtp_password,
        }
      });

      // Test connection
      await transporter.verify();

      // Send test email if email provided
      if (testEmail) {
        validateAndSanitizeInput(z.string().email(), testEmail);

        await transporter.sendMail({
          from: `${settings.from_name} <${settings.from_email}>`,
          to: testEmail,
          subject: 'SMTP Configuration Test',
          html: `
            <h2>SMTP Test Successful</h2>
            <p>Your email configuration is working correctly.</p>
            <p>Tested on: ${new Date().toISOString()}</p>
          `,
          text: `SMTP Test Successful\n\nYour email configuration is working correctly.\nTested on: ${new Date().toISOString()}`
        });
      }

      // Update last test success
      await pool.execute(
        'UPDATE tenant_email_settings SET last_test_success = CURRENT_TIMESTAMP, failure_count = 0 WHERE tenant_id = ?',
        [tenantId]
      );

      this.resetCircuitBreaker(tenantId);
      logger.info('SMTP test successful', { tenantId, testEmail });

      return {
        success: true,
        data: {
          success: true,
          message: testEmail ? 'Test email sent successfully' : 'SMTP connection verified successfully'
        }
      };

    } catch (error) {
      await this.recordSmtpFailure(tenantId, error as Error);
      logger.error('SMTP test failed', { tenantId, testEmail }, error as Error);

      return {
        success: false,
        message: `SMTP test failed: ${(error as Error).message}`,
        error: (error as Error).message
      };
    }
  }

  private async recordSmtpFailure(tenantId: string, error: Error): Promise<void> {
    try {
      const settings = await this.getTenantEmailSettings(tenantId);
      
      await pool.execute(`
        INSERT INTO smtp_failure_logs 
        (tenant_id, error_message, smtp_host, used_system_fallback, notified_super_admin)
        VALUES (?, ?, ?, ?, ?)
      `, [
        tenantId,
        error.message,
        settings?.smtp_host || 'unknown',
        false,
        false
      ]);

      // Increment failure count
      if (settings) {
        await pool.execute(
          'UPDATE tenant_email_settings SET failure_count = failure_count + 1 WHERE tenant_id = ?',
          [tenantId]
        );
      }

    } catch (dbError) {
      logger.error('Failed to record SMTP failure', { tenantId }, dbError as Error);
    }
  }

  public async sendEmail(emailData: Partial<EmailQueueItem>): Promise<ApiResponse<{ messageId: string }>> {
    const requestId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const validatedEmail = validateAndSanitizeInput(EmailQueueSchema, emailData);

      // Check rate limit
      if (!RateLimiter.isAllowed(`send_${validatedEmail.tenant_id}`, this.config.EMAIL_RATE_LIMIT, 60000)) {
        throw new EmailValidationError('Rate limit exceeded for email sending');
      }

      // Sanitize HTML content
      validatedEmail.html_body = sanitizeHtmlContent(validatedEmail.html_body);

      // Try tenant SMTP first
      let transporter = await this.getTenantTransporter(validatedEmail.tenant_id);
      let usedFallback = false;

      // Fallback to system SMTP if tenant SMTP fails
      if (!transporter) {
        transporter = this.systemTransporter;
        usedFallback = true;
        
        if (!transporter) {
          throw new EmailServiceError('No email transporter available');
        }
      }

      const settings = await this.getTenantEmailSettings(validatedEmail.tenant_id);
      const fromEmail = usedFallback ? this.config.SYSTEM_EMAIL_FROM : settings?.from_email || this.config.SYSTEM_EMAIL_FROM;
      const fromName = usedFallback ? 'System Notification' : settings?.from_name || 'Restaurant';

      const mailOptions: nodemailer.SendMailOptions = {
        from: `${fromName} <${fromEmail}>`,
        to: validatedEmail.recipient_email,
        subject: validatedEmail.subject,
        html: validatedEmail.html_body,
        text: validatedEmail.text_body,
        replyTo: settings?.reply_to || undefined,
        headers: {
          'X-Tenant-ID': validatedEmail.tenant_id,
          'X-Request-ID': requestId,
          'X-Email-Type': validatedEmail.email_type
        }
      };

      if (validatedEmail.recipient_name) {
        mailOptions.to = `${validatedEmail.recipient_name} <${validatedEmail.recipient_email}>`;
      }

      const result = await transporter.sendMail(mailOptions);

      // Create queue item for logging
      const queueItem: EmailQueueItem = {
        ...validatedEmail,
        status: 'sent',
        attempts: 1,
        max_attempts: 3,
        priority: validatedEmail.priority || 'normal'
      };

      // Log successful send
      await this.logEmailSent(queueItem, result.messageId, usedFallback);
      
      if (usedFallback) {
        logger.systemFallbackUsed(validatedEmail.tenant_id, 'Tenant SMTP unavailable');
      }

      logger.emailSent(result.messageId, validatedEmail.tenant_id, validatedEmail.recipient_email);

      return {
        success: true,
        data: { messageId: result.messageId },
        metadata: {
          timestamp: new Date(),
          version: '1.0',
          requestId
        }
      };

    } catch (error) {
      logger.emailFailed(requestId, emailData.tenant_id || 'unknown', emailData.recipient_email || 'unknown', error as Error);
      
      if (error instanceof EmailValidationError) {
        return {
          success: false,
          message: error.message,
          error: error.message
        };
      }

      return {
        success: false,
        message: 'Failed to send email',
        error: (error as Error).message
      };
    }
  }

  private async logEmailSent(emailData: EmailQueueItem, messageId: string, usedFallback: boolean): Promise<void> {
    try {
      await pool.execute(`
        INSERT INTO email_logs 
        (id, tenant_id, recipient_email, subject, status, message_id, context_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        emailData.tenant_id,
        emailData.recipient_email,
        emailData.subject,
        'sent',
        messageId,
        usedFallback ? 'system' : 'tenant'
      ]);
    } catch (error) {
      logger.error('Failed to log email sent', { tenantId: emailData.tenant_id }, error as Error);
    }
  }

  public async queueEmail(emailData: Partial<EmailQueueItem>): Promise<ApiResponse<{ queueId: number }>> {
    try {
      const validatedEmail = validateAndSanitizeInput(EmailQueueSchema, emailData);

      const [result] = await pool.execute(`
        INSERT INTO email_queue 
        (tenant_id, order_id, recipient_email, recipient_name, email_type, subject, html_body, text_body, priority, scheduled_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        validatedEmail.tenant_id,
        validatedEmail.order_id || null,
        validatedEmail.recipient_email,
        validatedEmail.recipient_name || null,
        validatedEmail.email_type,
        validatedEmail.subject,
        sanitizeHtmlContent(validatedEmail.html_body),
        validatedEmail.text_body || null,
        validatedEmail.priority,
        validatedEmail.scheduled_at || new Date()
      ]);

      const insertResult = result as any;
      const queueId = insertResult.insertId;

      logger.info('Email queued successfully', { tenantId: validatedEmail.tenant_id }, { queueId });

      return {
        success: true,
        data: { queueId }
      };

    } catch (error) {
      logger.error('Failed to queue email', { tenantId: emailData.tenant_id }, error as Error);
      
      return {
        success: false,
        message: 'Failed to queue email',
        error: (error as Error).message
      };
    }
  }

  public async processEmailQueue(batchSize: number = this.config.EMAIL_QUEUE_BATCH_SIZE): Promise<void> {
    try {
      const [pendingEmails] = await pool.execute(`
        SELECT * FROM email_queue 
        WHERE status = 'pending' AND scheduled_at <= NOW()
        ORDER BY priority DESC, created_at ASC
        LIMIT ?
      `, [batchSize]);

      const emails = Array.isArray(pendingEmails) ? pendingEmails as EmailQueueItem[] : [];

      for (const email of emails) {
        await this.processSingleQueuedEmail(email);
      }

      if (emails.length > 0) {
        logger.info('Processed email queue batch', {}, { processed: emails.length, batchSize });
      }

    } catch (error) {
      logger.error('Failed to process email queue', {}, error as Error);
    }
  }

  private async processSingleQueuedEmail(email: EmailQueueItem): Promise<void> {
    try {
      // Update status to processing
      await pool.execute(
        'UPDATE email_queue SET status = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['processing', email.id]
      );

      // Send email
      const result = await this.sendEmail(email);

      if (result.success) {
        // Mark as sent
        await pool.execute(
          'UPDATE email_queue SET status = ?, sent_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['sent', email.id]
        );
      } else {
        throw new Error(result.error || 'Unknown error');
      }

    } catch (error) {
      const attempts = (email.attempts || 0) + 1;
      const maxAttempts = email.max_attempts || this.config.EMAIL_RETRY_ATTEMPTS;

      if (attempts >= maxAttempts) {
        // Mark as failed
        await pool.execute(
          'UPDATE email_queue SET status = ?, attempts = ?, error_message = ? WHERE id = ?',
          ['failed', attempts, (error as Error).message, email.id]
        );
      } else {
        // Mark for retry
        await pool.execute(
          'UPDATE email_queue SET status = ?, attempts = ?, error_message = ?, scheduled_at = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?',
          ['retry', attempts, (error as Error).message, Math.pow(2, attempts), email.id] // Exponential backoff
        );
      }

      logger.error('Failed to process queued email', { emailId: email.id?.toString(), tenantId: email.tenant_id }, error as Error);
    }
  }

  // Cleanup methods
  public async cleanup(): Promise<void> {
    try {
      // Close all tenant transporters
      for (const [tenantId, transporter] of this.tenantTransporters) {
        transporter.close();
      }
      this.tenantTransporters.clear();

      // Close system transporter
      if (this.systemTransporter) {
        this.systemTransporter.close();
      }

      logger.info('Email service cleanup completed');
    } catch (error) {
      logger.error('Failed to cleanup email service', {}, error as Error);
    }
  }
}

// Export singleton instance
export const enhancedEmailService = EnhancedEmailService.getInstance();

// Export for backward compatibility
export const tenantEmailService = enhancedEmailService;
