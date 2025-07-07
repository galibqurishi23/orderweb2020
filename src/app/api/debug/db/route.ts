import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const dbResults: Record<string, any> = {};
    
    // Check database type
    const dbType = process.env.DATABASE_TYPE || 'sqlite';
    dbResults.dbType = dbType;
    
    // Check connection
    try {
      // Simple query to test the connection
      const [result] = await db.query('SELECT 1 as connected');
      dbResults.connection = 'Connected successfully';
    } catch (error: any) {
      dbResults.connection = `Connection error: ${error.message}`;
      return NextResponse.json(dbResults);
    }
    
    // Get list of tables
    try {
      const [tablesResult] = await db.query('SHOW TABLES');
      dbResults.tables = tablesResult;
    } catch (error: any) {
      dbResults.tables = `Error listing tables: ${error.message}`;
    }
    
    // Check for tenants table and count tenants
    try {
      const [tenantsResult] = await db.query('SELECT COUNT(*) as count FROM tenants');
      dbResults.tenantsCount = tenantsResult;
    } catch (error: any) {
      dbResults.tenantsCount = `Error counting tenants: ${error.message}`;
    }
    
    // Check for orders table and count orders
    try {
      const [ordersResult] = await db.query('SELECT COUNT(*) as count FROM orders');
      dbResults.ordersCount = ordersResult;
    } catch (error: any) {
      dbResults.ordersCount = `Error counting orders: ${error.message}`;
    }
    
    // Check tenant requested in query params
    const { searchParams } = new URL(request.url);
    const tenantSlug = searchParams.get('tenantSlug');
    
    if (tenantSlug) {
      try {
        const [tenantResult] = await db.query(
          'SELECT * FROM tenants WHERE slug = ?', 
          [tenantSlug]
        );
        dbResults.tenant = tenantResult;
        
        if (tenantResult && (tenantResult as any[]).length > 0) {
          const tenantId = (tenantResult as any[])[0].id;
          
          // Get tenant settings
          try {
            const [settingsResult] = await db.query(
              'SELECT * FROM tenant_settings WHERE tenant_id = ?',
              [tenantId]
            );
            dbResults.tenantSettings = settingsResult;
          } catch (error: any) {
            dbResults.tenantSettings = `Error getting tenant settings: ${error.message}`;
          }
          
          // Get tenant users
          try {
            const [usersResult] = await db.query(
              'SELECT id, email, name, role, active FROM tenant_users WHERE tenant_id = ?',
              [tenantId]
            );
            dbResults.tenantUsers = usersResult;
          } catch (error: any) {
            dbResults.tenantUsers = `Error getting tenant users: ${error.message}`;
          }
        }
      } catch (error: any) {
        dbResults.tenant = `Error getting tenant: ${error.message}`;
      }
    }
    
    return NextResponse.json(dbResults);
  } catch (error: any) {
    return NextResponse.json({ error: `Database debug error: ${error.message}` }, { status: 500 });
  }
}
