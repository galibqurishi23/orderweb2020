import pool from '@/lib/db';
import { LicenseKeyService } from '@/lib/license-key-service';

interface TenantLicenseStatus {
  isValid: boolean;
  isTrialActive: boolean;
  isLicenseActive: boolean;
  trialDaysRemaining?: number;
  licenseDaysRemaining?: number;
  status: 'trial' | 'licensed' | 'expired' | 'suspended';
  message: string;
  redirectPath?: string;
}

export class TenantLicenseChecker {
  /**
   * Check if a tenant has valid access (trial or license)
   */
  static async checkTenantAccess(tenantId: string): Promise<TenantLicenseStatus> {
    try {
      // Get tenant info
      const [tenantRows] = await pool.execute(
        'SELECT id, status, subscription_status, trial_ends_at FROM tenants WHERE id = ?',
        [tenantId]
      );

      const tenants = tenantRows as any[];
      if (!tenants || tenants.length === 0) {
        return {
          isValid: false,
          isTrialActive: false,
          isLicenseActive: false,
          status: 'suspended',
          message: 'Restaurant not found',
          redirectPath: '/suspended'
        };
      }

      const tenant = tenants[0];
      const now = new Date();
      const trialEndsAt = new Date(tenant.trial_ends_at);

      // Check if trial is still active
      const isTrialActive = tenant.status === 'trial' && now < trialEndsAt;
      const trialDaysRemaining = isTrialActive 
        ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        : 0;

      if (isTrialActive) {
        return {
          isValid: true,
          isTrialActive: true,
          isLicenseActive: false,
          trialDaysRemaining,
          status: 'trial',
          message: `Trial active. ${trialDaysRemaining} day(s) remaining. Please purchase a license key.`
        };
      }

      // Trial has expired, check for active license
      const licenseStatus = await LicenseKeyService.checkTenantLicenseStatus(tenantId);

      if (licenseStatus.hasLicense && licenseStatus.status === 'active') {
        return {
          isValid: true,
          isTrialActive: false,
          isLicenseActive: true,
          licenseDaysRemaining: licenseStatus.daysRemaining,
          status: 'licensed',
          message: `License active. ${licenseStatus.daysRemaining} day(s) remaining.`
        };
      }

      // Check if in grace period
      if (licenseStatus.inGracePeriod) {
        return {
          isValid: true,
          isTrialActive: false,
          isLicenseActive: false,
          licenseDaysRemaining: licenseStatus.graceDaysRemaining,
          status: 'expired',
          message: `License expired but in grace period. ${licenseStatus.graceDaysRemaining} day(s) remaining to activate new license.`
        };
      }

      // No valid trial or license
      await this.suspendTenant(tenantId);

      return {
        isValid: false,
        isTrialActive: false,
        isLicenseActive: false,
        status: 'suspended',
        message: 'Trial expired and no valid license found. Service suspended.',
        redirectPath: '/license-required'
      };

    } catch (error) {
      console.error('Error checking tenant access:', error);
      return {
        isValid: false,
        isTrialActive: false,
        isLicenseActive: false,
        status: 'suspended',
        message: 'Error checking access. Please contact support.',
        redirectPath: '/error'
      };
    }
  }

  /**
   * Suspend a tenant due to expired trial/license
   */
  static async suspendTenant(tenantId: string): Promise<void> {
    try {
      await pool.execute(
        'UPDATE tenants SET status = ?, subscription_status = ? WHERE id = ?',
        ['suspended', 'suspended', tenantId]
      );
    } catch (error) {
      console.error('Error suspending tenant:', error);
    }
  }

  /**
   * Reactivate a tenant when they get a valid license
   */
  static async reactivateTenant(tenantId: string): Promise<void> {
    try {
      await pool.execute(
        'UPDATE tenants SET status = ?, subscription_status = ? WHERE id = ?',
        ['active', 'active', tenantId]
      );
    } catch (error) {
      console.error('Error reactivating tenant:', error);
    }
  }

  /**
   * Get all tenants with their license status
   */
  static async getTenantsWithLicenseStatus(): Promise<any[]> {
    try {
      const [tenantRows] = await pool.execute(`
        SELECT 
          t.id,
          t.slug,
          t.name,
          t.email,
          t.status,
          t.subscription_status,
          t.trial_ends_at,
          t.created_at,
          tl.id as license_id,
          tl.expires_at as license_expires_at,
          tl.status as license_status,
          lk.key_code,
          lk.duration_days
        FROM tenants t
        LEFT JOIN tenant_licenses tl ON t.id = tl.tenant_id AND tl.status = 'active'
        LEFT JOIN license_keys lk ON tl.license_key_id = lk.id
        ORDER BY t.created_at DESC
      `);

      const tenants = tenantRows as any[];
      const now = new Date();

      return tenants.map(tenant => {
        const trialEndsAt = new Date(tenant.trial_ends_at);
        const isTrialActive = tenant.status === 'trial' && now < trialEndsAt;
        const trialDaysRemaining = isTrialActive 
          ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
          : 0;

        let licenseDaysRemaining = 0;
        let licenseStatus = 'none';
        
        if (tenant.license_expires_at) {
          const licenseExpiresAt = new Date(tenant.license_expires_at);
          licenseDaysRemaining = Math.ceil((licenseExpiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          licenseStatus = licenseDaysRemaining > 0 ? 'active' : 'expired';
        }

        return {
          ...tenant,
          isTrialActive,
          trialDaysRemaining,
          licenseDaysRemaining,
          licenseStatus,
          overallStatus: isTrialActive ? 'trial' : 
                        licenseStatus === 'active' ? 'licensed' : 
                        tenant.status === 'suspended' ? 'suspended' : 'expired'
        };
      });
    } catch (error) {
      console.error('Error getting tenants with license status:', error);
      return [];
    }
  }
}
