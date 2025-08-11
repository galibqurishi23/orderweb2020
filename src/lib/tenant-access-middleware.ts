import { NextRequest, NextResponse } from 'next/server';
import { TenantLicenseChecker } from '@/lib/tenant-license-checker';
import { getTenantBySlug } from '@/lib/tenant-service';

export class TenantAccessMiddleware {
  /**
   * Check if a tenant has access to their dashboard/services
   */
  static async checkTenantAccess(tenantSlug: string, request: NextRequest): Promise<{
    allowed: boolean;
    response?: NextResponse;
    tenant?: any;
    accessStatus?: any;
  }> {
    try {
      // Get tenant by slug
      const tenant = await getTenantBySlug(tenantSlug);
      
      if (!tenant) {
        return {
          allowed: false,
          response: NextResponse.redirect(new URL('/tenant-not-found', request.url))
        };
      }

      // Check access status
      const accessStatus = await TenantLicenseChecker.checkTenantAccess(tenant.id);

      // If access is valid, allow the request
      if (accessStatus.isValid) {
        return {
          allowed: true,
          tenant,
          accessStatus
        };
      }

      // If access is not valid, redirect to appropriate page
      const redirectPath = accessStatus.redirectPath || '/license-required';
      const redirectUrl = new URL(`/${tenantSlug}${redirectPath}`, request.url);
      
      // Add status information as query parameters
      redirectUrl.searchParams.set('status', accessStatus.status);
      redirectUrl.searchParams.set('message', encodeURIComponent(accessStatus.message));

      return {
        allowed: false,
        response: NextResponse.redirect(redirectUrl),
        tenant,
        accessStatus
      };

    } catch (error) {
      console.error('Error in tenant access middleware:', error);
      return {
        allowed: false,
        response: NextResponse.redirect(new URL(`/${tenantSlug}/error`, request.url))
      };
    }
  }

  /**
   * Check if a route should be exempt from license checking
   */
  static isExemptRoute(pathname: string): boolean {
    const exemptRoutes = [
      '/license',
      '/license-required',
      '/suspended',
      '/error',
      '/admin',          // Allow admin login page even with expired license
      '/admin/dashboard', // Allow admin dashboard even with expired license (will show renewal interface)
      '/admin/settings',  // Allow admin settings for license renewal
      '/api/tenant/license',
      '/api/tenant/license-status', // Allow license status API
      '/api/tenant/info',
      '/api/auth',
      '/favicon.ico',
      '/_next',
      '/static'
    ];

    return exemptRoutes.some(route => pathname.includes(route));
  }

  /**
   * Extract tenant slug from pathname
   */
  static extractTenantSlug(pathname: string): string | null {
    const match = pathname.match(/^\/([^\/]+)/);
    return match ? match[1] : null;
  }
}
