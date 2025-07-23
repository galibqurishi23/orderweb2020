import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { emailService } from '@/lib/universal-email-service';

// GET /api/tenant/email-config - Get tenant SMTP configuration
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Get tenant SMTP configuration (excluding password for security)
    const [rows] = await db.execute(`
      SELECT 
        smtp_host, smtp_port, smtp_secure, smtp_user, smtp_from, name
      FROM tenants 
      WHERE id = ?
    `, [tenantId]);

    const tenant = (rows as any[])[0];
    
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      config: {
        smtp_host: tenant.smtp_host || '',
        smtp_port: tenant.smtp_port || 587,
        smtp_secure: tenant.smtp_secure === 1,
        smtp_user: tenant.smtp_user || '',
        smtp_from: tenant.smtp_from || `${tenant.name} <noreply@example.com>`,
        has_config: !!tenant.smtp_host
      }
    });
  } catch (error) {
    console.error('Error getting tenant email config:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/tenant/email-config - Update tenant SMTP configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      smtp_host,
      smtp_port,
      smtp_secure,
      smtp_user,
      smtp_password,
      smtp_from
    } = body;

    // Validate required fields
    if (!tenantId || !smtp_host || !smtp_user || !smtp_password) {
      return NextResponse.json(
        { success: false, error: 'Missing required SMTP configuration fields' },
        { status: 400 }
      );
    }

    // Validate email format for smtp_from
    if (smtp_from && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(smtp_from.split('<')[1]?.split('>')[0] || smtp_from)) {
      return NextResponse.json(
        { success: false, error: 'Invalid from email format' },
        { status: 400 }
      );
    }

    // Update tenant SMTP configuration
    await db.execute(`
      UPDATE tenants SET 
        smtp_host = ?, 
        smtp_port = ?, 
        smtp_secure = ?, 
        smtp_user = ?, 
        smtp_password = ?, 
        smtp_from = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [
      smtp_host,
      smtp_port || 587,
      smtp_secure ? 1 : 0,
      smtp_user,
      smtp_password,
      smtp_from || `${smtp_user.split('@')[0]} <${smtp_user}>`,
      tenantId
    ]);

    return NextResponse.json({
      success: true,
      message: 'SMTP configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating tenant email config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update SMTP configuration' },
      { status: 500 }
    );
  }
}

// PUT /api/tenant/email-config/test - Test tenant SMTP configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, testEmail } = body;

    if (!tenantId || !testEmail) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID and test email are required' },
        { status: 400 }
      );
    }

    // Test the email configuration
    const success = await emailService.testEmailConfig(tenantId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'SMTP configuration test successful'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'SMTP configuration test failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error testing tenant email config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test SMTP configuration' },
      { status: 500 }
    );
  }
}
