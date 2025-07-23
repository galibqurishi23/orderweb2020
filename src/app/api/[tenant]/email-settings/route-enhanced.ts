/**
 * Production-Level Email Settings API Route
 * Enhanced with comprehensive error handling, validation, and logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { enhancedEmailService } from '@/lib/enhanced-email-service-fixed';
import { logger, generateRequestId } from '@/lib/email-logger';
import { EmailValidationError, EmailConfigurationError, EmailServiceError } from '@/lib/enhanced-email-service-fixed';

// Helper function to create standardized API responses
function createApiResponse(success: boolean, data?: any, message?: string, error?: string, statusCode: number = 200) {
  const response = {
    success,
    data,
    message,
    error,
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0',
      requestId: generateRequestId()
    }
  };

  return NextResponse.json(response, { status: statusCode });
}

// Helper function to extract client IP and User Agent
function getClientInfo(request: NextRequest) {
  return {
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown'
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  const requestId = generateRequestId();
  const clientInfo = getClientInfo(request);
  
  try {
    const tenantId = params.tenant;
    
    logger.info('Email settings retrieval requested', {
      requestId,
      tenantId,
      ...clientInfo
    });

    // Input validation
    if (!tenantId || typeof tenantId !== 'string') {
      logger.warn('Invalid tenant ID provided', { requestId, tenantId });
      return createApiResponse(false, null, 'Invalid tenant ID', 'INVALID_TENANT_ID', 400);
    }

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      logger.warn('Tenant ID is not a valid UUID', { requestId, tenantId });
      return createApiResponse(false, null, 'Tenant ID must be a valid UUID', 'INVALID_UUID_FORMAT', 400);
    }
    
    const emailSettings = await enhancedEmailService.getTenantEmailSettings(tenantId);
    
    if (!emailSettings) {
      logger.info('No email settings found for tenant', { requestId, tenantId });
      return createApiResponse(false, null, 'No email settings found for this tenant', 'SETTINGS_NOT_FOUND', 404);
    }

    // Security: Don't return the password in the response
    const { smtp_password, ...safeSettings } = emailSettings;
    
    const responseData = {
      ...safeSettings,
      smtp_password: smtp_password ? '***configured***' : null,
      has_password: !!smtp_password
    };

    logger.info('Email settings retrieved successfully', { requestId, tenantId });
    
    return createApiResponse(true, responseData, 'Email settings retrieved successfully');

  } catch (error) {
    logger.error('Failed to retrieve email settings', {
      requestId,
      tenantId: params.tenant,
      ...clientInfo
    }, error as Error);

    if (error instanceof EmailValidationError) {
      return createApiResponse(false, null, error.message, error.code, error.statusCode);
    }

    if (error instanceof EmailServiceError) {
      return createApiResponse(false, null, 'Service temporarily unavailable', 'SERVICE_ERROR', 503);
    }

    return createApiResponse(false, null, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  const requestId = generateRequestId();
  const clientInfo = getClientInfo(request);
  
  try {
    const tenantId = params.tenant;
    
    logger.info('Email settings update requested', {
      requestId,
      tenantId,
      ...clientInfo
    });

    // Input validation
    if (!tenantId || typeof tenantId !== 'string') {
      return createApiResponse(false, null, 'Invalid tenant ID', 'INVALID_TENANT_ID', 400);
    }

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      return createApiResponse(false, null, 'Tenant ID must be a valid UUID', 'INVALID_UUID_FORMAT', 400);
    }

    let requestData;
    try {
      requestData = await request.json();
    } catch (parseError) {
      logger.warn('Invalid JSON in request body', { requestId, tenantId });
      return createApiResponse(false, null, 'Invalid JSON in request body', 'INVALID_JSON', 400);
    }

    // Content-Type validation
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return createApiResponse(false, null, 'Content-Type must be application/json', 'INVALID_CONTENT_TYPE', 400);
    }

    // Add tenant_id to the data
    const emailSettingsData = {
      ...requestData,
      tenant_id: tenantId
    };

    // Additional server-side validation
    const requiredFields = ['smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'from_email', 'from_name'];
    const missingFields = requiredFields.filter(field => {
      const value = emailSettingsData[field];
      return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
      logger.warn('Missing required fields in email settings', { 
        requestId, 
        tenantId, 
        missingFields 
      });
      return createApiResponse(
        false, 
        { missingFields }, 
        `Missing required fields: ${missingFields.join(', ')}`, 
        'MISSING_REQUIRED_FIELDS', 
        400
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailSettingsData.from_email)) {
      return createApiResponse(false, null, 'Invalid from_email format', 'INVALID_EMAIL_FORMAT', 400);
    }

    if (emailSettingsData.reply_to && !emailRegex.test(emailSettingsData.reply_to)) {
      return createApiResponse(false, null, 'Invalid reply_to email format', 'INVALID_REPLY_TO_FORMAT', 400);
    }

    // Port validation
    const port = parseInt(emailSettingsData.smtp_port);
    if (isNaN(port) || port < 1 || port > 65535) {
      return createApiResponse(false, null, 'SMTP port must be between 1 and 65535', 'INVALID_PORT', 400);
    }

    // Hostname validation
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!hostnameRegex.test(emailSettingsData.smtp_host)) {
      return createApiResponse(false, null, 'Invalid SMTP hostname format', 'INVALID_HOSTNAME', 400);
    }

    // Sanitize and normalize data
    const sanitizedSettings = {
      tenant_id: tenantId,
      smtp_host: emailSettingsData.smtp_host.trim(),
      smtp_port: port,
      smtp_username: emailSettingsData.smtp_username.trim(),
      smtp_password: emailSettingsData.smtp_password,
      from_email: emailSettingsData.from_email.trim().toLowerCase(),
      from_name: emailSettingsData.from_name.trim(),
      reply_to: emailSettingsData.reply_to ? emailSettingsData.reply_to.trim().toLowerCase() : undefined,
      is_ssl: emailSettingsData.is_ssl !== false, // Default to true
      is_active: emailSettingsData.is_active !== false, // Default to true
      failure_count: 0 // Reset failure count on update
    };

    // Save settings
    const success = await enhancedEmailService.saveTenantEmailSettings(sanitizedSettings);

    if (success) {
      logger.info('Email settings saved successfully', { requestId, tenantId });
      
      // Audit log the configuration change
      await logger.auditLog(
        'email_settings_updated',
        'tenant_email_settings',
        tenantId,
        undefined, // userId not available in this context
        tenantId,
        undefined, // oldValues not tracked here
        sanitizedSettings,
        { requestId, ...clientInfo }
      );

      return createApiResponse(true, { tenant_id: tenantId }, 'Email settings saved successfully');
    } else {
      logger.error('Failed to save email settings', { requestId, tenantId });
      return createApiResponse(false, null, 'Failed to save email settings', 'SAVE_FAILED', 500);
    }

  } catch (error) {
    logger.error('Email settings update failed', {
      requestId,
      tenantId: params.tenant,
      ...clientInfo
    }, error as Error);

    if (error instanceof EmailValidationError) {
      return createApiResponse(false, null, error.message, error.code, error.statusCode);
    }

    if (error instanceof EmailConfigurationError) {
      return createApiResponse(false, null, error.message, error.code, error.statusCode);
    }

    if (error instanceof EmailServiceError) {
      return createApiResponse(false, null, 'Service temporarily unavailable', 'SERVICE_ERROR', 503);
    }

    return createApiResponse(false, null, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  // PUT method for testing SMTP connection
  const requestId = generateRequestId();
  const clientInfo = getClientInfo(request);
  
  try {
    const tenantId = params.tenant;
    
    logger.info('SMTP test requested', {
      requestId,
      tenantId,
      ...clientInfo
    });

    // Input validation
    if (!tenantId || typeof tenantId !== 'string') {
      return createApiResponse(false, null, 'Invalid tenant ID', 'INVALID_TENANT_ID', 400);
    }

    let requestData;
    try {
      requestData = await request.json();
    } catch (parseError) {
      // If no JSON body, just test connection without sending email
      requestData = {};
    }

    const testEmail = requestData.test_email;

    // Validate test email if provided
    if (testEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(testEmail)) {
        return createApiResponse(false, null, 'Invalid test email format', 'INVALID_TEST_EMAIL', 400);
      }
    }

    // Test SMTP connection
    const testResult = await enhancedEmailService.testTenantSmtp(tenantId, testEmail);

    if (testResult.success && testResult.data) {
      logger.info('SMTP test completed successfully', { requestId, tenantId, testEmail: !!testEmail });
      return createApiResponse(true, testResult.data, 'SMTP test completed successfully');
    } else {
      logger.warn('SMTP test failed', { requestId, tenantId, error: testResult.error });
      return createApiResponse(false, null, testResult.message || 'SMTP test failed', 'SMTP_TEST_FAILED', 422);
    }

  } catch (error) {
    logger.error('SMTP test error', {
      requestId,
      tenantId: params.tenant,
      ...clientInfo
    }, error as Error);

    return createApiResponse(false, null, 'SMTP test failed due to server error', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  const requestId = generateRequestId();
  const clientInfo = getClientInfo(request);
  
  try {
    const tenantId = params.tenant;
    
    logger.info('Email settings deletion requested', {
      requestId,
      tenantId,
      ...clientInfo
    });

    // This endpoint could be used to deactivate email settings
    // For security, we don't actually delete, just deactivate
    
    const success = await enhancedEmailService.saveTenantEmailSettings({
      tenant_id: tenantId,
      is_active: false
    });

    if (success) {
      logger.info('Email settings deactivated', { requestId, tenantId });
      
      await logger.auditLog(
        'email_settings_deactivated',
        'tenant_email_settings',
        tenantId,
        undefined,
        tenantId,
        { is_active: true },
        { is_active: false },
        { requestId, ...clientInfo }
      );

      return createApiResponse(true, null, 'Email settings deactivated successfully');
    } else {
      return createApiResponse(false, null, 'Failed to deactivate email settings', 'DEACTIVATION_FAILED', 500);
    }

  } catch (error) {
    logger.error('Email settings deactivation failed', {
      requestId,
      tenantId: params.tenant,
      ...clientInfo
    }, error as Error);

    return createApiResponse(false, null, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}
