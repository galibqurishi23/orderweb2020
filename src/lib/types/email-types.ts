/**
 * Production-Level Email System Type Definitions
 * Comprehensive type definitions for email system
 */

export interface TenantEmailSettings {
  id?: number;
  tenant_id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  reply_to?: string | null;
  is_ssl: boolean;
  is_active: boolean;
  last_test_success?: Date | null;
  failure_count: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface EmailBranding {
  id?: number;
  tenant_id: string;
  selected_customer_template: 'A' | 'B';
  restaurant_logo_url?: string | null;
  social_media_facebook?: string | null;
  social_media_instagram?: string | null;
  social_media_twitter?: string | null;
  custom_footer_text?: string | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface EmailQueueItem {
  id?: number;
  tenant_id: string;
  order_id?: string | null;
  recipient_email: string;
  recipient_name?: string | null;
  email_type: 'customer_confirmation' | 'restaurant_notification';
  subject: string;
  html_body: string;
  text_body?: string | null;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'retry';
  priority: 'low' | 'normal' | 'high';
  attempts: number;
  max_attempts: number;
  error_message?: string | null;
  scheduled_at?: Date;
  processed_at?: Date | null;
  sent_at?: Date | null;
  created_at?: Date;
}

export interface SmtpFailureLog {
  id?: number;
  tenant_id: string;
  order_id?: string | null;
  email_type: 'customer_confirmation' | 'restaurant_notification';
  failure_time?: Date;
  error_message?: string | null;
  smtp_host?: string | null;
  used_system_fallback: boolean;
  notified_super_admin: boolean;
  resolved_at?: Date | null;
}

export interface SuperAdminNotification {
  id?: number;
  type: 'smtp_failure' | 'email_health' | 'system_alert';
  tenant_id?: string | null;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_read: boolean;
  action_required: boolean;
  action_url?: string | null;
  created_at?: Date;
  read_at?: Date | null;
}

export interface EmailLog {
  id: string;
  tenant_id?: string | null;
  user_id?: string | null;
  recipient_email: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  message_id?: string | null;
  error_message?: string | null;
  context_type: 'system' | 'tenant' | 'restaurant';
  created_at?: Date;
}

export interface AnalyticsQuery {
  tenant_id: string;
  start_date?: Date | string;
  end_date?: Date | string;
  email_type?: 'customer_confirmation' | 'restaurant_notification' | 'all';
  template?: 'A' | 'B' | 'all';
  limit?: number;
  offset?: number;
}

export interface TestEmailRequest {
  tenant_id: string;
  test_email: string;
  test_name?: string;
}

export interface EmailAnalytics {
  overview: {
    total_sent: number;
    total_delivered: number;
    total_failed: number;
    delivery_rate: number;
    avg_response_time: number;
    smtp_uptime: number;
  };
  trends: {
    date: string;
    sent: number;
    delivered: number;
    failed: number;
  }[];
  template_performance: {
    template: 'A' | 'B';
    sent: number;
    delivered: number;
    delivery_rate: number;
  }[];
  failure_analysis: {
    error_type: string;
    count: number;
    percentage: number;
  }[];
  recent_activity: {
    timestamp: Date;
    type: string;
    status: string;
    recipient: string;
  }[];
}

export interface HealthMetrics {
  smtp_connectivity: {
    status: 'healthy' | 'degraded' | 'down';
    last_test: Date;
    response_time_ms: number;
  };
  queue_status: {
    pending_count: number;
    processing_count: number;
    failed_count: number;
    retry_count: number;
  };
  error_rates: {
    last_24h: number;
    last_7d: number;
    current_trend: 'improving' | 'stable' | 'degrading';
  };
  performance: {
    avg_processing_time: number;
    emails_per_hour: number;
    success_rate: number;
  };
}

export interface EmailTemplate {
  id: string;
  name: string;
  type: 'customer_confirmation' | 'restaurant_notification';
  template: 'A' | 'B';
  subject_template: string;
  html_template: string;
  text_template?: string;
  variables: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface EmailConfigEnvironment {
  SYSTEM_EMAIL_HOST: string;
  SYSTEM_EMAIL_PORT: number;
  SYSTEM_EMAIL_USER: string;
  SYSTEM_EMAIL_PASS: string;
  SYSTEM_EMAIL_FROM: string;
  EMAIL_RATE_LIMIT: number;
  EMAIL_RETRY_ATTEMPTS: number;
  EMAIL_QUEUE_BATCH_SIZE: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  metadata?: {
    timestamp: Date;
    version: string;
    requestId?: string;
  };
}

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
  acquireTimeout: number;
  timeout: number;
  reconnect: boolean;
}

// Event types for email system
export interface EmailEvent {
  id: string;
  type: 'sent' | 'delivered' | 'failed' | 'bounced' | 'complained' | 'opened' | 'clicked';
  email_id: string;
  tenant_id: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Webhook types for external integrations
export interface EmailWebhook {
  id: string;
  tenant_id: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Audit log types
export interface EmailAuditLog {
  id: string;
  tenant_id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}
