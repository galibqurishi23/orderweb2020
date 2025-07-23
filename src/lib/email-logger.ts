/**
 * Production-Level Logging System for Email Service
 * Structured logging with different levels and contexts
 */

import { EmailEvent, EmailAuditLog } from './types/email-types';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LogContext {
  requestId?: string;
  tenantId?: string;
  userId?: string;
  action?: string;
  duration?: number;
  timestamp?: Date;
  // Allow additional properties for flexible logging
  [key: string]: any;
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  metadata?: Record<string, any>;
}

export class ProductionLogger {
  private static instance: ProductionLogger;
  private logLevel: LogLevel;
  private auditLogs: EmailAuditLog[] = [];

  private constructor() {
    this.logLevel = this.getLogLevelFromEnv();
  }

  public static getInstance(): ProductionLogger {
    if (!ProductionLogger.instance) {
      ProductionLogger.instance = new ProductionLogger();
    }
    return ProductionLogger.instance;
  }

  private getLogLevelFromEnv(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'ERROR': return LogLevel.ERROR;
      case 'WARN': return LogLevel.WARN;
      case 'INFO': return LogLevel.INFO;
      case 'DEBUG': return LogLevel.DEBUG;
      case 'TRACE': return LogLevel.TRACE;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevel[entry.level];
    const context = entry.context ? this.formatContext(entry.context) : '';
    const metadata = entry.metadata ? JSON.stringify(entry.metadata) : '';
    const error = entry.error ? this.formatError(entry.error) : '';

    return `[${timestamp}] ${level}: ${entry.message}${context}${metadata}${error}`;
  }

  private formatContext(context: LogContext): string {
    const parts = [];
    if (context.requestId) parts.push(`req:${context.requestId}`);
    if (context.tenantId) parts.push(`tenant:${context.tenantId}`);
    if (context.userId) parts.push(`user:${context.userId}`);
    if (context.emailId) parts.push(`email:${context.emailId}`);
    if (context.orderId) parts.push(`order:${context.orderId}`);
    
    return parts.length > 0 ? ` [${parts.join('|')}]` : '';
  }

  private formatError(error: Error): string {
    return ` ERROR: ${error.name}: ${error.message}\nStack: ${error.stack}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error, metadata?: Record<string, any>) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      error,
      metadata
    };

    const formattedLog = this.formatLogEntry(entry);

    // Output to appropriate stream
    if (level <= LogLevel.ERROR) {
      console.error(formattedLog);
    } else if (level <= LogLevel.WARN) {
      console.warn(formattedLog);
    } else {
      console.log(formattedLog);
    }

    // In production, you might want to send logs to external services
    this.sendToExternalLogger(entry);
  }

  private async sendToExternalLogger(entry: LogEntry) {
    // In production, implement integration with logging services like:
    // - Winston with transports (file, database, external services)
    // - DataDog, New Relic, CloudWatch, etc.
    // For now, we'll just store critical errors
    
    if (entry.level <= LogLevel.ERROR && entry.context?.tenantId) {
      try {
        // Store critical errors for later analysis
        await this.storeCriticalError(entry);
      } catch (error) {
        console.error('Failed to store critical error:', error);
      }
    }
  }

  private async storeCriticalError(entry: LogEntry) {
    // Implementation would store to database or external service
    // This is a placeholder for production implementation
  }

  // Public logging methods
  public error(message: string, context?: LogContext, error?: Error, metadata?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, context, error, metadata);
  }

  public warn(message: string, context?: LogContext, metadata?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context, undefined, metadata);
  }

  public info(message: string, context?: LogContext, metadata?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context, undefined, metadata);
  }

  public debug(message: string, context?: LogContext, metadata?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context, undefined, metadata);
  }

  public trace(message: string, context?: LogContext, metadata?: Record<string, any>) {
    this.log(LogLevel.TRACE, message, context, undefined, metadata);
  }

  // Email-specific logging methods
  public emailSent(emailId: string, tenantId: string, recipient: string, context?: LogContext) {
    this.info('Email sent successfully', {
      ...context,
      emailId,
      tenantId
    }, {
      recipient,
      action: 'email_sent'
    });
  }

  public emailFailed(emailId: string, tenantId: string, recipient: string, error: Error, context?: LogContext) {
    this.error('Email sending failed', {
      ...context,
      emailId,
      tenantId
    }, error, {
      recipient,
      action: 'email_failed'
    });
  }

  public smtpConnectionFailed(tenantId: string, smtpHost: string, error: Error, context?: LogContext) {
    this.error('SMTP connection failed', {
      ...context,
      tenantId
    }, error, {
      smtpHost,
      action: 'smtp_connection_failed'
    });
  }

  public healthCheckFailed(tenantId: string, checkType: string, error: Error, context?: LogContext) {
    this.error('Health check failed', {
      ...context,
      tenantId
    }, error, {
      checkType,
      action: 'health_check_failed'
    });
  }

  public configurationChanged(tenantId: string, userId: string, changes: Record<string, any>, context?: LogContext) {
    this.info('Email configuration changed', {
      ...context,
      tenantId,
      userId
    }, {
      changes,
      action: 'configuration_changed'
    });
  }

  public rateLimitExceeded(identifier: string, limit: number, context?: LogContext) {
    this.warn('Rate limit exceeded', context, {
      identifier,
      limit,
      action: 'rate_limit_exceeded'
    });
  }

  public systemFallbackUsed(tenantId: string, reason: string, context?: LogContext) {
    this.warn('System fallback email used', {
      ...context,
      tenantId
    }, {
      reason,
      action: 'system_fallback_used'
    });
  }

  // Audit logging for compliance
  public async auditLog(action: string, resourceType: string, resourceId: string, userId?: string, tenantId?: string, oldValues?: Record<string, any>, newValues?: Record<string, any>, context?: LogContext) {
    const auditEntry: EmailAuditLog = {
      id: this.generateId(),
      tenant_id: tenantId || '',
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      old_values: oldValues,
      new_values: newValues,
      ip_address: context?.ipAddress,
      user_agent: context?.userAgent,
      created_at: new Date()
    };

    this.auditLogs.push(auditEntry);
    
    this.info('Audit event recorded', context, {
      action,
      resourceType,
      resourceId,
      audit: true
    });

    // In production, store to secure audit database
    await this.storeAuditLog(auditEntry);
  }

  private async storeAuditLog(auditEntry: EmailAuditLog) {
    // Implementation would store to secure audit database
    // This is a placeholder for production implementation
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Performance monitoring
  public async measurePerformance<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      this.trace(`Starting ${operation}`, context);
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.info(`${operation} completed`, context, {
        duration_ms: duration,
        success: true
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.error(`${operation} failed`, context, error as Error, {
        duration_ms: duration,
        success: false
      });
      
      throw error;
    }
  }

  // Health monitoring
  public reportHealthMetric(metric: string, value: number, tenantId?: string, context?: LogContext) {
    this.info(`Health metric: ${metric}`, {
      ...context,
      tenantId
    }, {
      metric,
      value,
      timestamp: new Date().toISOString()
    });
  }

  // Security events
  public securityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', details: Record<string, any>, context?: LogContext) {
    this.error(`Security event: ${event}`, context, undefined, {
      security: true,
      severity,
      ...details
    });
  }
}

// Export singleton instance
export const logger = ProductionLogger.getInstance();

// Middleware for request logging
export function createRequestLogger(requestId: string) {
  return {
    error: (message: string, error?: Error, metadata?: Record<string, any>) =>
      logger.error(message, { requestId }, error, metadata),
    warn: (message: string, metadata?: Record<string, any>) =>
      logger.warn(message, { requestId }, metadata),
    info: (message: string, metadata?: Record<string, any>) =>
      logger.info(message, { requestId }, metadata),
    debug: (message: string, metadata?: Record<string, any>) =>
      logger.debug(message, { requestId }, metadata),
    trace: (message: string, metadata?: Record<string, any>) =>
      logger.trace(message, { requestId }, metadata)
  };
}

// Utility to generate request IDs
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
