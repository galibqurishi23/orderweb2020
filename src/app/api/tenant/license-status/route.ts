import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { LicenseKeyService } from '@/lib/license-key-service';

// Database connection
async function getConnection() {
  try {
    return await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'dinedesk_db'
    });
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  let connection;
  
  try {
    // Get tenant from pathname since it's called from admin panel
    const url = new URL(request.url);
    const referer = request.headers.get('referer') || '';
    
    // Extract tenant from referer URL
    let tenantSlug = '';
    if (referer) {
      const refererUrl = new URL(referer);
      const pathParts = refererUrl.pathname.split('/');
      tenantSlug = pathParts[1]; // First part after domain
    }
    
    // Also check query params as fallback
    if (!tenantSlug) {
      tenantSlug = url.searchParams.get('tenant') || '';
    }
    
    if (!tenantSlug) {
      return NextResponse.json(
        { success: false, error: 'Tenant not identified' },
        { status: 400 }
      );
    }
    
    connection = await getConnection();
    
    // Get tenant information
    const [tenants] = await connection.execute(
      `SELECT id, name, slug FROM tenants WHERE slug = ?`,
      [tenantSlug]
    ) as any[];
    
    if (tenants.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const tenantId = tenants[0].id;

    // Get current license status using the license service
    const licenseStatus = await LicenseKeyService.checkTenantLicenseStatus(tenantId);
    
    return NextResponse.json({
      success: true,
      ...licenseStatus,
      // Add formatted dates for frontend
      activatedAt: licenseStatus.expiresAt ? new Date(licenseStatus.expiresAt.getTime() - (365 * 24 * 60 * 60 * 1000)).toISOString() : undefined,
      expiresAt: licenseStatus.expiresAt?.toISOString(),
      gracePeriodEndsAt: licenseStatus.gracePeriodEndsAt?.toISOString()
    });
    
  } catch (error) {
    console.error('License check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check license status' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

export async function POST(request: NextRequest) {
  let connection;
  
  try {
    const body = await request.json();
    const { action, licenseKey, tenantSlug } = body;
    
    if (action === 'renew' && licenseKey && tenantSlug) {
      connection = await getConnection();
      
      // Get tenant ID
      const [tenants] = await connection.execute(
        'SELECT id FROM tenants WHERE slug = ?',
        [tenantSlug]
      ) as any[];
      
      if (tenants.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Restaurant not found'
        }, { status: 404 });
      }

      const tenantId = tenants[0].id;

      // Try to activate the license
      const result = await LicenseKeyService.activateLicense(tenantId, licenseKey);

      return NextResponse.json({
        success: result.success,
        message: result.message,
        error: result.success ? undefined : result.error
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action or missing parameters'
    }, { status: 400 });
    
  } catch (error) {
    console.error('License renewal error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process license request'
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
