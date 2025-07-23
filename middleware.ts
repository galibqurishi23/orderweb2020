import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { TenantAccessMiddleware } from '@/lib/tenant-access-middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow super-admin routes to pass through
  if (pathname.startsWith('/super-admin')) {
    return NextResponse.next();
  }
  
  // Allow API routes to pass through (except tenant-specific ones that need checking)
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  
  // Allow static files to pass through
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }
  
  // Check for tenant-specific routes
  // Format: /{tenant-slug}/admin or /{tenant-slug}/customer or /{tenant-slug}
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length >= 1) {
    const potentialTenant = segments[0];
    
    // Check if this is a tenant route
    if (potentialTenant && !isSystemRoute(potentialTenant)) {
      // This is a tenant-specific route
      const tenantSlug = potentialTenant;
      const remainingPath = segments.slice(1).join('/');
      
      // Skip license checking for exempt routes
      if (TenantAccessMiddleware.isExemptRoute(pathname)) {
        const response = NextResponse.next();
        response.headers.set('x-tenant-slug', tenantSlug);
        return response;
      }
      
      // Check tenant access (trial/license status)
      try {
        const accessCheck = await TenantAccessMiddleware.checkTenantAccess(tenantSlug, request);
        
        if (!accessCheck.allowed && accessCheck.response) {
          return accessCheck.response;
        }
        
        // Add tenant context to headers
        const response = NextResponse.next();
        response.headers.set('x-tenant-slug', tenantSlug);
        
        // Add access status to headers for debugging
        if (accessCheck.accessStatus) {
          response.headers.set('x-tenant-status', accessCheck.accessStatus.status);
          response.headers.set('x-tenant-valid', accessCheck.accessStatus.isValid.toString());
        }
        
        // If accessing admin panel
        if (remainingPath.startsWith('admin')) {
          response.headers.set('x-tenant-context', 'admin');
        } 
        // If accessing customer interface
        else {
          response.headers.set('x-tenant-context', 'customer');
        }
        
        return response;
      } catch (error) {
        console.error('Middleware error:', error);
        // In case of error, redirect to error page
        return NextResponse.redirect(new URL(`/${tenantSlug}/error`, request.url));
      }
    }
  }
  
  // Default behavior for root routes
  return NextResponse.next();
}

function isSystemRoute(segment: string): boolean {
  const systemRoutes = [
    'super-admin', // Super admin routes
    'api',        // API routes
    'auth',       // Auth routes
    'login',      // Login routes
    'register',   // Register routes
    '_next',      // Next.js internal routes
    'favicon.ico' // Favicon
  ];
  
  return systemRoutes.includes(segment);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
