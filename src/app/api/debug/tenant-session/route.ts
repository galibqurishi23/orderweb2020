import { NextRequest, NextResponse } from 'next/server';
import { TenantService } from '@/lib/tenant-service';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Extract tenant info from headers (set by middleware)
    const tenantSlug = request.headers.get('x-tenant-slug');
    const tenantContext = request.headers.get('x-tenant-context');
    
    // Get all request headers for debugging
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    // Check if a specific tenant slug was requested via query param
    // This allows testing a tenant without going through middleware
    const requestedTenantSlug = searchParams.get('tenant') || tenantSlug;
    
    // Variables to store tenant info
    let tenantData = null;
    let tenantSettings = null;
    let tenantOrders = null;
    let tenantUsers = null;
    let tenantDatabaseStatus = false;
    
    // Get tenant data if slug exists
    if (requestedTenantSlug) {
      try {
        // Get basic tenant data
        tenantData = await TenantService.getTenantBySlug(requestedTenantSlug);
        
        if (tenantData && tenantData.id) {
          // Get tenant settings
          try {
            const [settingsRows] = await pool.execute(
              'SELECT settings_json FROM tenant_settings WHERE tenant_id = ?',
              [tenantData.id]
            );
            
            if (settingsRows && (settingsRows as any[]).length > 0) {
              const settingsData = (settingsRows as any[])[0].settings_json;
              tenantSettings = typeof settingsData === 'string' 
                ? JSON.parse(settingsData) 
                : settingsData;
            }
          } catch (error) {
            console.error('Error fetching tenant settings:', error);
          }
          
          // Get tenant order count
          try {
            const [orderRows] = await pool.execute(
              'SELECT COUNT(*) as orderCount FROM orders WHERE tenant_id = ?',
              [tenantData.id]
            );
            
            tenantOrders = {
              count: (orderRows as any[])[0].orderCount || 0
            };
          } catch (error) {
            console.error('Error fetching tenant order count:', error);
          }
          
          // Get tenant users count
          try {
            const [userRows] = await pool.execute(
              'SELECT COUNT(*) as userCount FROM tenant_users WHERE tenant_id = ?',
              [tenantData.id]
            );
            
            tenantUsers = {
              count: (userRows as any[])[0].userCount || 0
            };
          } catch (error) {
            console.error('Error fetching tenant user count:', error);
          }
          
          tenantDatabaseStatus = true;
        }
      } catch (error) {
        console.error('Error fetching tenant data:', error);
      }
    }
    
    return NextResponse.json({
      requestInfo: {
        url: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
        source: tenantSlug ? 'middleware' : (requestedTenantSlug ? 'query_param' : 'no_tenant')
      },
      tenantContext: {
        tenantSlug: requestedTenantSlug || tenantSlug,
        contextType: tenantContext,
        headerSlug: tenantSlug,
        requestedSlug: searchParams.get('tenant'),
        isAdminContext: tenantContext === 'admin',
        isCustomerContext: tenantContext === 'customer'
      },
      tenantData: tenantData ? {
        id: tenantData.id,
        name: tenantData.name,
        slug: tenantData.slug,
        status: tenantData.status,
        subscriptionPlan: tenantData.subscription_plan || 'basic',
        createdAt: tenantData.created_at
      } : null,
      tenantDetails: {
        settings: tenantSettings,
        orders: tenantOrders,
        users: tenantUsers,
        databaseStatus: tenantDatabaseStatus
      },
      debugInfo: {
        headers,
        params
      }
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
