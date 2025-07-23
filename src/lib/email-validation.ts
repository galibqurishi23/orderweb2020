/**
 * Production-Level Email System Validation & Error Handling
 * Comprehensive input validation, error handling, and logging system
 */

import { z } from 'zod';

// Environment Configuration Schema
export const EmailConfigSchema = z.object({
  SYSTEM_EMAIL_HOST: z.string().min(1, "System SMTP host is required"),
  SYSTEM_EMAIL_PORT: z.coerce.number().int().min(1).max(65535),
  SYSTEM_EMAIL_USER: z.string().email("System email must be valid"),
  SYSTEM_EMAIL_PASS: z.string().min(1, "System email password is required"),
  SYSTEM_EMAIL_FROM: z.string().email("System from email must be valid"),
  EMAIL_RATE_LIMIT: z.coerce.number().int().min(1).default(100),
  EMAIL_RETRY_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(3),
  EMAIL_QUEUE_BATCH_SIZE: z.coerce.number().int().min(1).max(100).default(10),
});

// Tenant Email Settings Schema
export const TenantEmailSettingsSchema = z.object({
  tenant_id: z.string().uuid("Tenant ID must be a valid UUID"),
  smtp_host: z.string()
    .min(1, "SMTP host is required")
    .max(255, "SMTP host must be less than 255 characters")
    .refine(
      (host) => /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(host),
      "Invalid SMTP host format"
    ),
  smtp_port: z.coerce.number()
    .int("SMTP port must be an integer")
    .min(1, "SMTP port must be greater than 0")
    .max(65535, "SMTP port must be less than 65536"),
  smtp_username: z.string()
    .min(1, "SMTP username is required")
    .max(255, "SMTP username must be less than 255 characters"),
  smtp_password: z.string()
    .min(1, "SMTP password is required")
    .min(8, "SMTP password must be at least 8 characters for security"),
  from_email: z.string()
    .email("From email must be a valid email address")
    .max(255, "From email must be less than 255 characters"),
  from_name: z.string()
    .min(1, "From name is required")
    .max(255, "From name must be less than 255 characters")
    .refine(
      (name) => /^[a-zA-Z0-9\s\-_.()&]+$/.test(name),
      "From name contains invalid characters"
    ),
  reply_to: z.string()
    .email("Reply-to must be a valid email address")
    .max(255, "Reply-to email must be less than 255 characters")
    .optional(),
  is_ssl: z.boolean().default(true),
  is_active: z.boolean().default(false),
  failure_count: z.number().int().min(0).default(0).optional(),
});

// Email Branding Schema
export const EmailBrandingSchema = z.object({
  tenant_id: z.string().uuid("Tenant ID must be a valid UUID"),
  selected_customer_template: z.enum(['A', 'B'], {
    errorMap: () => ({ message: "Template must be either 'A' or 'B'" })
  }),
  restaurant_logo_url: z.string()
    .url("Logo URL must be a valid URL")
    .max(500, "Logo URL must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  social_media_facebook: z.string()
    .max(255, "Facebook URL must be less than 255 characters")
    .refine(
      (url) => !url || url.includes('facebook.com') || url.includes('fb.com'),
      "Must be a valid Facebook URL"
    )
    .optional()
    .or(z.literal("")),
  social_media_instagram: z.string()
    .max(255, "Instagram URL must be less than 255 characters")
    .refine(
      (url) => !url || url.includes('instagram.com'),
      "Must be a valid Instagram URL"
    )
    .optional()
    .or(z.literal("")),
  social_media_twitter: z.string()
    .max(255, "Twitter URL must be less than 255 characters")
    .refine(
      (url) => !url || url.includes('twitter.com') || url.includes('x.com'),
      "Must be a valid Twitter/X URL"
    )
    .optional()
    .or(z.literal("")),
  custom_footer_text: z.string()
    .max(1000, "Footer text must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
  is_active: z.boolean().default(true),
});

// Email Queue Item Schema
export const EmailQueueSchema = z.object({
  tenant_id: z.string().uuid("Tenant ID must be a valid UUID"),
  order_id: z.string().optional(),
  recipient_email: z.string()
    .email("Recipient email must be valid")
    .max(255, "Recipient email must be less than 255 characters"),
  recipient_name: z.string()
    .max(255, "Recipient name must be less than 255 characters")
    .optional(),
  email_type: z.enum(['customer_confirmation', 'restaurant_notification']),
  subject: z.string()
    .min(1, "Email subject is required")
    .max(500, "Email subject must be less than 500 characters"),
  html_body: z.string()
    .min(1, "Email HTML body is required")
    .max(1000000, "Email body too large"), // 1MB limit
  text_body: z.string()
    .max(100000, "Text body too large") // 100KB limit
    .optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  scheduled_at: z.date().optional(),
});

// Analytics Query Schema
export const AnalyticsQuerySchema = z.object({
  tenant_id: z.string().uuid("Tenant ID must be a valid UUID"),
  start_date: z.string()
    .datetime("Start date must be a valid ISO datetime")
    .or(z.date())
    .optional(),
  end_date: z.string()
    .datetime("End date must be a valid ISO datetime")
    .or(z.date())
    .optional(),
  email_type: z.enum(['customer_confirmation', 'restaurant_notification', 'all'])
    .default('all'),
  template: z.enum(['A', 'B', 'all']).default('all'),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

// Test Email Schema
export const TestEmailSchema = z.object({
  tenant_id: z.string().uuid("Tenant ID must be a valid UUID"),
  test_email: z.string()
    .email("Test email must be valid")
    .max(255, "Test email must be less than 255 characters"),
  test_name: z.string()
    .max(255, "Test name must be less than 255 characters")
    .optional(),
});

// Custom Error Classes for Production
export class EmailValidationError extends Error {
  public readonly statusCode: number = 400;
  public readonly code: string = 'VALIDATION_ERROR';
  
  constructor(message: string, public readonly details?: any) {
    super(message);
    this.name = 'EmailValidationError';
  }
}

export class EmailConfigurationError extends Error {
  public readonly statusCode: number = 422;
  public readonly code: string = 'CONFIGURATION_ERROR';
  
  constructor(message: string, public readonly details?: any) {
    super(message);
    this.name = 'EmailConfigurationError';
  }
}

export class EmailServiceError extends Error {
  public readonly statusCode: number = 500;
  public readonly code: string = 'SERVICE_ERROR';
  
  constructor(message: string, public readonly details?: any) {
    super(message);
    this.name = 'EmailServiceError';
  }
}

export class EmailRateLimitError extends Error {
  public readonly statusCode: number = 429;
  public readonly code: string = 'RATE_LIMIT_ERROR';
  
  constructor(message: string, public readonly retryAfter?: number) {
    super(message);
    this.name = 'EmailRateLimitError';
  }
}

// Validation Helper Functions
export function validateAndSanitizeInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      
      throw new EmailValidationError(
        `Validation failed: ${fieldErrors}`,
        { errors: error.errors }
      );
    }
    throw error;
  }
}

// Environment Validation
export function validateEnvironment() {
  const env = {
    SYSTEM_EMAIL_HOST: process.env.SYSTEM_EMAIL_HOST,
    SYSTEM_EMAIL_PORT: process.env.SYSTEM_EMAIL_PORT,
    SYSTEM_EMAIL_USER: process.env.SYSTEM_EMAIL_USER,
    SYSTEM_EMAIL_PASS: process.env.SYSTEM_EMAIL_PASS,
    SYSTEM_EMAIL_FROM: process.env.SYSTEM_EMAIL_FROM,
    EMAIL_RATE_LIMIT: process.env.EMAIL_RATE_LIMIT,
    EMAIL_RETRY_ATTEMPTS: process.env.EMAIL_RETRY_ATTEMPTS,
    EMAIL_QUEUE_BATCH_SIZE: process.env.EMAIL_QUEUE_BATCH_SIZE,
  };

  try {
    return EmailConfigSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.')).join(', ');
      throw new EmailConfigurationError(
        `Missing or invalid environment variables: ${missingVars}`,
        { errors: error.errors }
      );
    }
    throw error;
  }
}

// SQL Injection Protection
export function sanitizeSqlString(input: string): string {
  if (typeof input !== 'string') {
    throw new EmailValidationError('Input must be a string');
  }
  
  // Remove or escape potentially dangerous characters
  return input
    .replace(/'/g, "''")  // Escape single quotes
    .replace(/--/g, '')   // Remove SQL comments
    .replace(/\/\*/g, '') // Remove SQL block comments start
    .replace(/\*\//g, '') // Remove SQL block comments end
    .replace(/;/g, '')    // Remove semicolons
    .trim();
}

// HTML Sanitization for Email Content
export function sanitizeHtmlContent(html: string): string {
  // Basic HTML sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/onload=/gi, 'data-onload=')
    .replace(/onerror=/gi, 'data-onerror=')
    .replace(/onclick=/gi, 'data-onclick=')
    .replace(/onmouseover=/gi, 'data-onmouseover=');
}

// Rate Limiting Helper
export class RateLimiter {
  private static requests: Map<string, number[]> = new Map();
  
  static isAllowed(identifier: string, limit: number, windowMs: number = 60000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const requests = this.requests.get(identifier)!;
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => time > windowStart);
    
    if (validRequests.length >= limit) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
  
  static getRemainingRequests(identifier: string, limit: number, windowMs: number = 60000): number {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(identifier)) {
      return limit;
    }
    
    const requests = this.requests.get(identifier)!;
    const validRequests = requests.filter(time => time > windowStart);
    
    return Math.max(0, limit - validRequests.length);
  }
}

export type {
  TenantEmailSettings,
  EmailQueueItem,
  EmailBranding,
  AnalyticsQuery,
  TestEmailRequest
} from './types/email-types';
