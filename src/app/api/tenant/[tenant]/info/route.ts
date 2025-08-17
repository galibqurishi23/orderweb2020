import { NextRequest, NextResponse } from 'next/server';
import { getTenantBySlug } from '@/lib/tenant-service';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const { tenant: tenantSlug } = await params;

    const tenantData = await getTenantBySlug(tenantSlug);

    if (!tenantData) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get tenant settings from tenant_settings table
    let settings = {};
    try {
      const [settingsRows] = await pool.execute(
        'SELECT settings_json FROM tenant_settings WHERE tenant_id = ?',
        [tenantData.id]
      );
      if (settingsRows && (settingsRows as any[]).length > 0) {
        const settingsData = (settingsRows as any[])[0].settings_json;
        settings = typeof settingsData === 'string' ? JSON.parse(settingsData) : settingsData;
      }
    } catch (error) {
      console.error('Error fetching tenant settings:', error);
    }

    // Return tenant data with restaurant settings for shop page
    return NextResponse.json({
      id: tenantData.id,
      name: (settings as any)?.name || tenantData.name,
      slug: tenantData.slug,
      status: tenantData.status,
      plan: tenantData.subscription_plan || 'basic',
      // Include contact information from restaurant settings
      email: (settings as any)?.email || tenantData.email,
      phone: (settings as any)?.phone || tenantData.phone,
      address: (settings as any)?.address || tenantData.address,
      description: (settings as any)?.description || '',
      logo_url: (settings as any)?.logo || '',
      settings: settings
    });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
