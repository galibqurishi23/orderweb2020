import { NextRequest, NextResponse } from 'next/server';
import LicenseKeyService from '@/lib/license-key-service';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { durationDays, quantity = 1, assignedTenantId, notes } = await request.json();

    // Validate input
    if (!durationDays || durationDays < 1 || durationDays > 365) {
      return NextResponse.json(
        { success: false, error: 'Duration must be between 1 and 365 days' },
        { status: 400 }
      );
    }

    if (quantity < 1 || quantity > 100) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Generate license keys
    const generatedKeys = await LicenseKeyService.generateLicenseKeys({
      durationDays,
      quantity,
      assignedTenantId: assignedTenantId || undefined,
      createdBy: 'super-admin', // TODO: Get from session
      notes
    });

    return NextResponse.json({
      success: true,
      keys: generatedKeys,
      message: `Successfully generated ${generatedKeys.length} license key(s)`
    });

  } catch (error) {
    console.error('License key generation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to generate license keys' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const assignedTenantId = url.searchParams.get('tenantId');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    let queryStr = `
      SELECT 
        lk.*,
        t.name as assigned_tenant_name,
        t.email as assigned_tenant_email
      FROM license_keys lk
      LEFT JOIN tenants t ON lk.assigned_tenant_id = t.id
    `;
    
    const queryParams: any[] = [];
    const conditions: string[] = [];

    if (status) {
      conditions.push('lk.status = ?');
      queryParams.push(status);
    }

    if (assignedTenantId) {
      conditions.push('lk.assigned_tenant_id = ?');
      queryParams.push(assignedTenantId);
    }

    if (conditions.length > 0) {
      queryStr += ' WHERE ' + conditions.join(' AND ');
    }

    queryStr += ' ORDER BY lk.created_at DESC LIMIT ?';
    queryParams.push(limit);

    const [keyRows] = await db.execute(queryStr, queryParams);
    const rawKeys = keyRows as any[];

    // Transform keys to camelCase for frontend
    const keys = rawKeys.map(key => ({
      id: key.id,
      keyCode: key.key_code,
      durationDays: key.duration_days,
      status: key.status,
      assignedTenantId: key.assigned_tenant_id,
      assignedTenantName: key.assigned_tenant_name,
      assignedTenantEmail: key.assigned_tenant_email,
      createdBy: key.created_by,
      notes: key.notes,
      createdAt: key.created_at,
      updatedAt: key.updated_at
    }));

    // Get statistics
    const [statsRows] = await db.execute(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(duration_days) as total_days
      FROM license_keys 
      GROUP BY status
    `);

    const stats = (statsRows as any[]).reduce((acc, row) => {
      acc[row.status] = {
        count: row.count,
        totalDays: row.total_days
      };
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      keys: keys || [],
      statistics: stats
    });

  } catch (error) {
    console.error('Get license keys error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch license keys' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('keyId');

    if (!keyId) {
      return NextResponse.json(
        { success: false, error: 'License key ID is required' },
        { status: 400 }
      );
    }

    // Check if key exists and get its status
    const [keyRows] = await db.execute(
      'SELECT id, key_code, status FROM license_keys WHERE id = ?',
      [keyId]
    );

    const keys = keyRows as any[];
    if (keys.length === 0) {
      return NextResponse.json(
        { success: false, error: 'License key not found' },
        { status: 404 }
      );
    }

    const key = keys[0];

    // Allow deletion of all license keys (including active ones)
    // Note: Deleting active keys may cause service disruption for restaurants
    console.log(`Deleting license key: ${key.key_code} (Status: ${key.status})`);
    
    // If the key is active, we should also remove it from tenant licenses
    if (key.status === 'active') {
      // Remove from tenant license assignments
      await db.execute(
        'UPDATE tenants SET license_key = NULL, license_expiry = NULL WHERE license_key = ?',
        [key.key_code]
      );
      console.log(`Removed active license key ${key.key_code} from tenant assignments`);
    }

    // Delete the license key
    await db.execute('DELETE FROM license_keys WHERE id = ?', [keyId]);

    return NextResponse.json({
      success: true,
      message: `License key ${key.key_code} has been deleted successfully`
    });

  } catch (error) {
    console.error('Delete license key error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete license key' },
      { status: 500 }
    );
  }
}
