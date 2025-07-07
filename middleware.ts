import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow super-admin routes to pass through
  if (pathname.startsWith('/super-admin')) {
    return NextResponse.next();
  }
  
  // Allow API routes to pass through
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
      
      // Add tenant context to headers
      const response = NextResponse.next();
      response.headers.set('x-tenant-slug', tenantSlug);
      
      // If accessing admin panel
      if (remainingPath.startsWith('admin')) {
        response.headers.set('x-tenant-context', 'admin');
      } 
      // If accessing customer interface
      else {
        response.headers.set('x-tenant-context', 'customer');
      }
      
      return response;
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
