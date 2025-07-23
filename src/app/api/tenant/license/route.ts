import { NextRequest, NextResponse } from 'next/server';
import { LicenseKeyService } from '@/lib/license-key-service';
import { getTenantBySlug } from '@/lib/tenant-service';
import { TenantLicenseChecker } from '@/lib/tenant-license-checker';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseKey, tenantSlug, tenantId, keyCode } = body;

    // Support both new format (licenseKey + tenantSlug) and old format (tenantId + keyCode)
    const finalLicenseKey = licenseKey || keyCode;
    let finalTenantId = tenantId;

    if (!finalLicenseKey) {
      return NextResponse.json({
        success: false,
        error: 'License key is required'
      }, { status: 400 });
    }

    // If tenantSlug is provided, get tenant by slug
    if (tenantSlug && !finalTenantId) {
      const tenant = await getTenantBySlug(tenantSlug);
      if (!tenant) {
        return NextResponse.json({
          success: false,
          error: 'Restaurant not found'
        }, { status: 404 });
      }
      finalTenantId = tenant.id;
    }

    if (!finalTenantId) {
      return NextResponse.json({
        success: false,
        error: 'Tenant ID or slug is required'
      }, { status: 400 });
    }

    // Activate the license for this tenant
    const result = await LicenseKeyService.activateLicense(finalTenantId, finalLicenseKey);

    if (result.success) {
      // Reactivate the tenant if they were suspended
      await TenantLicenseChecker.reactivateTenant(finalTenantId);

      return NextResponse.json({
        success: true,
        message: 'License activated successfully',
        license: result.license,
        data: {
          expiresAt: result.license?.expiresAt,
          status: result.license?.status
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.message,
        errorCode: result.error
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error activating license:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const tenantSlug = searchParams.get('slug');

    let finalTenantId = tenantId;

    // If tenantSlug is provided, get tenant by slug
    if (tenantSlug && !finalTenantId) {
      const tenant = await getTenantBySlug(tenantSlug);
      if (!tenant) {
        return NextResponse.json({
          success: false,
          error: 'Restaurant not found'
        }, { status: 404 });
      }
      finalTenantId = tenant.id;
    }

    if (!finalTenantId) {
      return NextResponse.json({
        success: false,
        error: 'Tenant ID or slug is required'
      }, { status: 400 });
    }

    // Get license status using our new checking system
    const accessStatus = await TenantLicenseChecker.checkTenantAccess(finalTenantId);

    return NextResponse.json({
      success: true,
      data: {
        access: accessStatus,
        hasLicense: accessStatus.isLicenseActive,
        isTrialActive: accessStatus.isTrialActive,
        status: accessStatus.status
      }
    });

  } catch (error) {
    console.error('Get license status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get license status' },
      { status: 500 }
    );
  }
}
