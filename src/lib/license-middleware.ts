import { NextRequest, NextResponse } from 'next/server';
import { LicenseKeyService } from '@/lib/license-key-service';

export class LicenseMiddleware {
  private static licenseService = new LicenseKeyService();

  // Routes that require license validation (only food order page)
  private static protectedRoutes = [
    '/', // Main food order page
    '/kitchen', // Kitchen display (if exists)
    '/customer', // Customer interface (if exists)
  ];

  // Check if the route should be protected by license
  static shouldCheckLicense(pathname: string, tenantId: string): boolean {
    // Extract the path after tenant
    const tenantPath = pathname.replace(`/${tenantId}`, '') || '/';
    
    // Admin routes are never protected
    if (tenantPath.startsWith('/admin')) {
      return false;
    }
    
    // Shop routes are never protected  
    if (tenantPath.startsWith('/shop')) {
      return false;
    }
    
    // License routes are never protected
    if (tenantPath.startsWith('/license')) {
      return false;
    }
    
    // Only protect food order routes
    return this.protectedRoutes.includes(tenantPath);
  }

  static async checkTenantLicense(tenantId: string): Promise<{
    isValid: boolean;
    status?: string;
    redirectPath?: string;
    message?: string;
  }> {
    try {
      const licenseStatus = await LicenseKeyService.checkTenantLicenseStatus(tenantId);

      if (!licenseStatus.hasLicense) {
        return {
          isValid: false,
          status: 'no_license',
          redirectPath: `/${tenantId}/license-required`,
          message: 'Please talk with OrderWeb Ltd and get new License'
        };
      }

      if (licenseStatus.status === 'expired' && !licenseStatus.inGracePeriod) {
        return {
          isValid: false,
          status: 'expired',
          redirectPath: `/${tenantId}/license-required`,
          message: 'License has expired. Please talk with OrderWeb Ltd and get new License'
        };
      }

      if (licenseStatus.status === 'expired' && licenseStatus.inGracePeriod) {
        // Allow access but with warning
        return {
          isValid: true,
          status: 'grace_period',
          message: `License expired but in grace period. ${licenseStatus.graceDaysRemaining} days remaining.`
        };
      }

      if (licenseStatus.status === 'active' && licenseStatus.daysRemaining !== undefined && licenseStatus.daysRemaining <= 2) {
        // Allow access but with warning
        return {
          isValid: true,
          status: 'expiring_soon',
          message: `License expires in ${licenseStatus.daysRemaining} days. Please renew soon.`
        };
      }

      return {
        isValid: true,
        status: 'active'
      };

    } catch (error) {
      console.error('License check failed:', error);
      // In case of error, allow access but log the issue
      return {
        isValid: true,
        status: 'check_failed',
        message: 'Unable to verify license status.'
      };
    }
  }

  static async handleTenantRequest(
    request: NextRequest,
    tenantId: string
  ): Promise<NextResponse | null> {
    const url = request.nextUrl.clone();
    
    // Skip license check for license management pages
    if (url.pathname.includes('/license')) {
      return null; // Continue with normal processing
    }

    // Skip license check for API routes that don't require license
    if (url.pathname.includes('/api/') && 
        !url.pathname.includes('/api/menu') && 
        !url.pathname.includes('/api/orders')) {
      return null;
    }

    const licenseCheck = await this.checkTenantLicense(tenantId);

    if (!licenseCheck.isValid) {
      // Redirect to license page
      url.pathname = licenseCheck.redirectPath || `/${tenantId}/license`;
      return NextResponse.redirect(url);
    }

    // Add license status to headers for client-side components
    const response = NextResponse.next();
    response.headers.set('X-License-Status', licenseCheck.status || 'unknown');
    if (licenseCheck.message) {
      response.headers.set('X-License-Message', licenseCheck.message);
    }

    return response;
  }
}
