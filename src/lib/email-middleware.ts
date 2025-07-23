/**
 * Production-Level Email System Middleware
 * Rate limiting, authentication, validation, and security
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './email-logger';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security headers for email API responses
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'none'; script-src 'none'; object-src 'none';",
};

// CORS configuration for email APIs
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Tenant-ID',
  'Access-Control-Max-Age': '86400',
};

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipPaths?: string[];
}

interface MiddlewareOptions {
  enableRateLimit?: boolean;
  enableCors?: boolean;
  enableSecurity?: boolean;
  enableLogging?: boolean;
  rateLimitConfig?: RateLimitConfig;
}

export class EmailMiddleware {
  private static instance: EmailMiddleware;
  private defaultOptions: MiddlewareOptions;

  private constructor() {
    this.defaultOptions = {
      enableRateLimit: process.env.NODE_ENV === 'production',
      enableCors: true,
      enableSecurity: true,
      enableLogging: true,
      rateLimitConfig: {
        windowMs: 60000, // 1 minute
        maxRequests: 100,
        skipPaths: ['/api/health', '/api/db-status']
      }
    };
  }

  public static getInstance(): EmailMiddleware {
    if (!EmailMiddleware.instance) {
      EmailMiddleware.instance = new EmailMiddleware();
    }
    return EmailMiddleware.instance;
  }

  // Rate limiting middleware
  private async applyRateLimit(
    request: NextRequest, 
    config: RateLimitConfig
  ): Promise<NextResponse | null> {
    const ip = this.getClientIP(request);
    const path = new URL(request.url).pathname;
    
    // Skip rate limiting for certain paths
    if (config.skipPaths?.some(skipPath => path.includes(skipPath))) {
      return null;
    }

    const key = `rate_limit:${ip}:${path}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Clean up old entries
    this.cleanupRateLimitStore(windowStart);
    
    const current = rateLimitStore.get(key);
    
    if (!current || current.resetTime <= now) {
      // New window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return null;
    }
    
    if (current.count >= config.maxRequests) {
      logger.rateLimitExceeded(ip, config.maxRequests, {
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
      
      const retryAfter = Math.ceil((current.resetTime - now) / 1000);
      
      return new NextResponse(JSON.stringify({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter
      }), {
        status: 429,
        headers: {
          ...SECURITY_HEADERS,
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': current.resetTime.toString(),
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Increment counter
    current.count++;
    rateLimitStore.set(key, current);
    
    return null;
  }

  private cleanupRateLimitStore(windowStart: number): void {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime <= windowStart) {
        rateLimitStore.delete(key);
      }
    }
  }

  // Security validation middleware
  private async applySecurity(request: NextRequest): Promise<NextResponse | null> {
    const contentType = request.headers.get('content-type');
    const method = request.method;
    const path = new URL(request.url).pathname;
    
    // Validate Content-Type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      if (!contentType || !contentType.includes('application/json')) {
        logger.securityEvent('invalid_content_type', 'medium', {
          path,
          method,
          contentType: contentType || 'missing',
          ip: this.getClientIP(request)
        });
        
        return new NextResponse(JSON.stringify({
          success: false,
          error: 'INVALID_CONTENT_TYPE',
          message: 'Content-Type must be application/json'
        }), {
          status: 400,
          headers: {
            ...SECURITY_HEADERS,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    
    // Check for suspicious headers
    const suspiciousHeaders = ['x-forwarded-host', 'x-original-url', 'x-rewrite-url'];
    for (const header of suspiciousHeaders) {
      if (request.headers.get(header)) {
        logger.securityEvent('suspicious_header', 'high', {
          header,
          value: request.headers.get(header),
          path,
          ip: this.getClientIP(request)
        });
      }
    }
    
    // Validate tenant ID format in URL
    const tenantMatch = path.match(/\/api\/([^\/]+)\/email/);
    if (tenantMatch) {
      const tenantId = tenantMatch[1];
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(tenantId)) {
        logger.securityEvent('invalid_tenant_id', 'medium', {
          tenantId,
          path,
          ip: this.getClientIP(request)
        });
        
        return new NextResponse(JSON.stringify({
          success: false,
          error: 'INVALID_TENANT_ID',
          message: 'Tenant ID must be a valid UUID'
        }), {
          status: 400,
          headers: {
            ...SECURITY_HEADERS,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    
    return null;
  }

  // CORS middleware
  private applyCors(request: NextRequest, response?: NextResponse): NextResponse {
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          ...SECURITY_HEADERS
        }
      });
    }
    
    if (response) {
      // Add CORS headers to existing response
      Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }
    
    return new NextResponse();
  }

  // Request logging middleware
  private logRequest(request: NextRequest): string {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const path = new URL(request.url).pathname;
    const method = request.method;
    
    logger.info('Email API request received', {
      requestId,
      ipAddress: ip,
      userAgent
    }, {
      method,
      path,
      timestamp: new Date().toISOString()
    });
    
    return requestId;
  }

  // Get client IP address
  private getClientIP(request: NextRequest): string {
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-client-ip') ||
      'unknown'
    );
  }

  // Main middleware function
  public async handle(
    request: NextRequest,
    options: Partial<MiddlewareOptions> = {}
  ): Promise<NextResponse | null> {
    const config = { ...this.defaultOptions, ...options };
    let requestId: string | undefined;
    
    try {
      // Log request if enabled
      if (config.enableLogging) {
        requestId = this.logRequest(request);
      }
      
      // Handle CORS preflight
      if (config.enableCors && request.method === 'OPTIONS') {
        return this.applyCors(request);
      }
      
      // Apply security checks
      if (config.enableSecurity) {
        const securityResponse = await this.applySecurity(request);
        if (securityResponse) {
          return config.enableCors ? this.applyCors(request, securityResponse) : securityResponse;
        }
      }
      
      // Apply rate limiting
      if (config.enableRateLimit && config.rateLimitConfig) {
        const rateLimitResponse = await this.applyRateLimit(request, config.rateLimitConfig);
        if (rateLimitResponse) {
          return config.enableCors ? this.applyCors(request, rateLimitResponse) : rateLimitResponse;
        }
      }
      
      return null; // Continue to the actual handler
      
    } catch (error) {
      logger.error('Email middleware error', { requestId }, error as Error);
      
      const errorResponse = new NextResponse(JSON.stringify({
        success: false,
        error: 'MIDDLEWARE_ERROR',
        message: 'Request processing failed'
      }), {
        status: 500,
        headers: {
          ...SECURITY_HEADERS,
          'Content-Type': 'application/json'
        }
      });
      
      return config.enableCors ? this.applyCors(request, errorResponse) : errorResponse;
    }
  }

  // Helper to enhance API responses with security headers
  public enhanceResponse(response: NextResponse, enableCors: boolean = true): NextResponse {
    // Add security headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Add CORS headers if enabled
    if (enableCors) {
      Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }
    
    return response;
  }

  // Validate request size
  public async validateRequestSize(request: NextRequest, maxSizeBytes: number = 1048576): Promise<boolean> {
    const contentLength = request.headers.get('content-length');
    
    if (contentLength) {
      const size = parseInt(contentLength);
      if (size > maxSizeBytes) {
        logger.securityEvent('request_too_large', 'medium', {
          size,
          maxSize: maxSizeBytes,
          path: new URL(request.url).pathname,
          ip: this.getClientIP(request)
        });
        return false;
      }
    }
    
    return true;
  }

  // Validate JSON payload
  public async validateJsonPayload(request: NextRequest): Promise<any> {
    try {
      const text = await request.text();
      
      if (text.length === 0) {
        return {};
      }
      
      const data = JSON.parse(text);
      
      // Basic XSS protection
      const jsonString = JSON.stringify(data);
      if (jsonString.includes('<script') || jsonString.includes('javascript:')) {
        logger.securityEvent('xss_attempt', 'high', {
          payload: jsonString.substring(0, 100),
          ip: this.getClientIP(request)
        });
        throw new Error('Potentially malicious content detected');
      }
      
      return data;
    } catch (error) {
      logger.error('JSON validation failed', {
        ipAddress: this.getClientIP(request)
      }, error as Error);
      throw error;
    }
  }
}

// Export singleton instance
export const emailMiddleware = EmailMiddleware.getInstance();

// Export helper functions
export function createSecureResponse(
  data: any,
  status: number = 200,
  message?: string,
  error?: string
): NextResponse {
  const response = NextResponse.json({
    success: !error,
    data,
    message,
    error,
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
  }, { status });

  return emailMiddleware.enhanceResponse(response);
}

export function createErrorResponse(
  message: string,
  error: string,
  status: number = 400
): NextResponse {
  return createSecureResponse(null, status, message, error);
}
