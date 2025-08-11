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

export async function POST(request: NextRequest) {
  let connection;
  
  try {
    const body = await request.json();
    const { licenseKey, tenantSlug } = body;
    
    if (!licenseKey || !tenantSlug) {
      return NextResponse.json({
        success: false,
        error: 'License key and tenant slug are required'
      }, { status: 400 });
    }

    // Validate license key format (OW + 6 characters)
    if (!LicenseKeyService.isValidKeyFormat(licenseKey)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid license key format. Must be OW + 6 characters (e.g., OWAB1234)'
      }, { status: 400 });
    }

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

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        license: result.license
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.message
      }, { status: 400 });
    }

  } catch (error) {
    console.error('License activation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to activate license'
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

export async function GET(request: NextRequest) {
  let connection;
  
  try {
    const { searchParams } = new URL(request.url);
    const tenantSlug = searchParams.get('slug');
    
    if (!tenantSlug) {
      return NextResponse.json({
        success: false,
        error: 'Tenant slug is required'
      }, { status: 400 });
    }

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

    // Get current license status
    const licenseStatus = await LicenseKeyService.checkTenantLicenseStatus(tenantId);

    return NextResponse.json({
      success: true,
      data: {
        access: {
          isValid: licenseStatus.hasLicense,
          isLicenseActive: licenseStatus.status === 'active',
          status: licenseStatus.hasLicense ? 'licensed' : 'no_license'
        },
        ...licenseStatus
      }
    });

  } catch (error) {
    console.error('License check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check license status'
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
