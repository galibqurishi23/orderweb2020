'use strict';

import { v4 as uuidv4 } from 'uuid';
import db from './db';

export interface LicenseKey {
  id: string;
  keyCode: string;
  durationDays: number;
  status: 'unused' | 'active' | 'expired' | 'revoked';
  assignedTenantId?: string;
  createdBy: string;
  notes?: string;
  createdAt: Date;
}

export interface TenantLicense {
  id: string;
  tenantId: string;
  licenseKeyId: string;
  keyCode: string;
  activatedAt: Date;
  expiresAt: Date;
  gracePeriodEndsAt: Date;
  status: 'active' | 'grace_period' | 'expired' | 'suspended';
  remindersSent: {
    day7: boolean;
    day3: boolean;
    day1: boolean;
    expired: boolean;
  };
}

export interface LicenseGenerationOptions {
  durationDays: number;
  quantity?: number;
  assignedTenantId?: string;
  createdBy: string;
  notes?: string;
}

export interface LicenseActivationResult {
  success: boolean;
  message: string;
  license?: TenantLicense;
  error?: string;
}

export class LicenseKeyService {
  
  /**
   * Generate license key in OW + 6 digits format (8 characters total)
   */
  static generateKeyCode(): string {
    const prefix = 'OW';
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    let result = prefix;
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Validate license key format (OW + 6 alphanumeric characters)
   */
  static isValidKeyFormat(keyCode: string): boolean {
    const pattern = /^OW[0-9A-Z]{6}$/;
    return pattern.test(keyCode);
  }

  /**
   * Generate one or more license keys
   */
  static async generateLicenseKeys(options: LicenseGenerationOptions): Promise<LicenseKey[]> {
    const { durationDays, quantity = 1, assignedTenantId, createdBy, notes } = options;
    
    // Validate duration (1-365 days)
    if (durationDays < 1 || durationDays > 365) {
      throw new Error('Duration must be between 1 and 365 days');
    }

    const generatedKeys: LicenseKey[] = [];
    
    for (let i = 0; i < quantity; i++) {
      let keyCode: string;
      let isUnique = false;
      let attempts = 0;
      
      // Ensure unique key code generation
      while (!isUnique && attempts < 100) {
        keyCode = this.generateKeyCode();
        
        // Check if key already exists
        const [existingRows] = await db.execute(
          'SELECT id FROM license_keys WHERE key_code = ?',
          [keyCode]
        );
        
        if (Array.isArray(existingRows) && existingRows.length === 0) {
          isUnique = true;
        }
        attempts++;
      }
      
      if (!isUnique) {
        throw new Error('Failed to generate unique key code after 100 attempts');
      }
      
      const licenseId = uuidv4();
      
      // Insert license key into database
      await db.execute(
        `INSERT INTO license_keys 
         (id, key_code, duration_days, status, assigned_tenant_id, created_by, notes) 
         VALUES (?, ?, ?, 'unused', ?, ?, ?)`,
        [licenseId, keyCode!, durationDays, assignedTenantId || null, createdBy, notes || null]
      );
      
      generatedKeys.push({
        id: licenseId,
        keyCode: keyCode!,
        durationDays,
        status: 'unused',
        assignedTenantId,
        createdBy,
        notes,
        createdAt: new Date()
      });
    }
    
    return generatedKeys;
  }

  /**
   * Activate a license key for a tenant
   */
  static async activateLicense(tenantId: string, keyCode: string): Promise<LicenseActivationResult> {
    try {
      // Validate key format
      if (!this.isValidKeyFormat(keyCode)) {
        return {
          success: false,
          message: 'Invalid license key format',
          error: 'KEY_FORMAT_INVALID'
        };
      }

      // Check if tenant already has an active license
      const [activeLicenseRows] = await db.execute(
        `SELECT id FROM tenant_licenses 
         WHERE tenant_id = ? AND status IN ('active', 'grace_period')`,
        [tenantId]
      );

      if (Array.isArray(activeLicenseRows) && activeLicenseRows.length > 0) {
        return {
          success: false,
          message: 'You already have an active license. Please wait for it to expire before activating a new one.',
          error: 'ACTIVE_LICENSE_EXISTS'
        };
      }

      // Get license key details
      const [keyRows] = await db.execute(
        'SELECT * FROM license_keys WHERE key_code = ?',
        [keyCode]
      );

      const keys = keyRows as any[];
      if (!keys || keys.length === 0) {
        return {
          success: false,
          message: 'License key not found',
          error: 'KEY_NOT_FOUND'
        };
      }

      const licenseKey = keys[0];

      // Check if key is already used
      if (licenseKey.status !== 'unused') {
        return {
          success: false,
          message: 'License key has already been used',
          error: 'KEY_ALREADY_USED'
        };
      }

      // Calculate dates
      const activatedAt = new Date();
      const expiresAt = new Date(activatedAt.getTime() + (licenseKey.duration_days * 24 * 60 * 60 * 1000));
      const gracePeriodEndsAt = new Date(expiresAt.getTime() + (7 * 24 * 60 * 60 * 1000)); // +7 days grace

      const tenantLicenseId = uuidv4();

      // Start transaction
      await db.execute('START TRANSACTION');

      try {
        // Create tenant license record
        await db.execute(
          `INSERT INTO tenant_licenses 
           (id, tenant_id, license_key_id, key_code, activated_at, expires_at, grace_period_ends_at, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
          [tenantLicenseId, tenantId, licenseKey.id, keyCode, activatedAt, expiresAt, gracePeriodEndsAt]
        );

        // Update license key status
        await db.execute(
          'UPDATE license_keys SET status = \'active\', assigned_tenant_id = ? WHERE id = ?',
          [tenantId, licenseKey.id]
        );

        // Update tenant license status
        await db.execute(
          `UPDATE tenants 
           SET license_status = 'active', license_expires_at = ?, license_grace_ends_at = ? 
           WHERE id = ?`,
          [expiresAt, gracePeriodEndsAt, tenantId]
        );

        // Log activation in history
        await db.execute(
          `INSERT INTO license_history 
           (id, tenant_id, license_key_id, key_code, action, duration_days, activated_at, expired_at) 
           VALUES (?, ?, ?, ?, 'activated', ?, ?, ?)`,
          [uuidv4(), tenantId, licenseKey.id, keyCode, licenseKey.duration_days, activatedAt, expiresAt]
        );

        await db.execute('COMMIT');

        return {
          success: true,
          message: `License activated successfully! Valid until ${expiresAt.toLocaleDateString()}`,
          license: {
            id: tenantLicenseId,
            tenantId,
            licenseKeyId: licenseKey.id,
            keyCode,
            activatedAt,
            expiresAt,
            gracePeriodEndsAt,
            status: 'active',
            remindersSent: {
              day7: false,
              day3: false,
              day1: false,
              expired: false
            }
          }
        };

      } catch (error) {
        await db.execute('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('License activation error:', error);
      return {
        success: false,
        message: 'Failed to activate license',
        error: 'ACTIVATION_FAILED'
      };
    }
  }

  /**
   * Get tenant's current license status
   */
  static async getTenantLicenseStatus(tenantId: string): Promise<TenantLicense | null> {
    const [licenseRows] = await db.execute(
      `SELECT * FROM tenant_licenses 
       WHERE tenant_id = ? AND status IN ('active', 'grace_period') 
       ORDER BY activated_at DESC LIMIT 1`,
      [tenantId]
    );

    const licenses = licenseRows as any[];
    if (!licenses || licenses.length === 0) {
      return null;
    }

    const license = licenses[0];
    return {
      id: license.id,
      tenantId: license.tenant_id,
      licenseKeyId: license.license_key_id,
      keyCode: license.key_code,
      activatedAt: new Date(license.activated_at),
      expiresAt: new Date(license.expires_at),
      gracePeriodEndsAt: new Date(license.grace_period_ends_at),
      status: license.status,
      remindersSent: {
        day7: license.reminder_7day_sent,
        day3: license.reminder_3day_sent,
        day1: license.reminder_1day_sent,
        expired: license.expiry_notice_sent
      }
    };
  }

  /**
   * Check and update license statuses (for cron job)
   */
  static async updateLicenseStatuses(): Promise<{
    updated: number;
    expired: number;
    suspended: number;
  }> {
    const now = new Date();
    let updated = 0;
    let expired = 0;
    let suspended = 0;

    // Get all active and grace period licenses
    const [licenseRows] = await db.execute(
      `SELECT * FROM tenant_licenses 
       WHERE status IN ('active', 'grace_period')`
    );

    const licenses = licenseRows as any[];

    for (const license of licenses) {
      const expiresAt = new Date(license.expires_at);
      const gracePeriodEndsAt = new Date(license.grace_period_ends_at);

      let newStatus = license.status;

      if (now > gracePeriodEndsAt) {
        // License has passed grace period - suspend
        newStatus = 'suspended';
        suspended++;
      } else if (now > expiresAt) {
        // License expired but still in grace period
        newStatus = 'grace_period';
        expired++;
      }

      if (newStatus !== license.status) {
        // Update license status
        await db.execute(
          'UPDATE tenant_licenses SET status = ? WHERE id = ?',
          [newStatus, license.id]
        );

        // Update tenant status
        await db.execute(
          'UPDATE tenants SET license_status = ? WHERE id = ?',
          [newStatus, license.tenant_id]
        );

        updated++;
      }
    }

    return { updated, expired, suspended };
  }

  /**
   * Check current license status for a tenant
   */
  static async checkTenantLicenseStatus(tenantId: string): Promise<{
    hasLicense: boolean;
    status?: 'active' | 'grace_period' | 'expired' | 'suspended';
    daysRemaining?: number;
    inGracePeriod?: boolean;
    graceDaysRemaining?: number;
    keyCode?: string;
    expiresAt?: Date;
    gracePeriodEndsAt?: Date;
  }> {
    try {
      const [licenseRows] = await db.execute(
        `SELECT tl.*, lk.key_code 
         FROM tenant_licenses tl 
         JOIN license_keys lk ON tl.license_key_id = lk.id 
         WHERE tl.tenant_id = ? 
         AND tl.status IN ('active', 'grace_period') 
         ORDER BY tl.created_at DESC 
         LIMIT 1`,
        [tenantId]
      );

      const licenses = licenseRows as any[];
      
      if (!licenses || licenses.length === 0) {
        return { hasLicense: false };
      }

      const license = licenses[0];
      const now = new Date();
      const expiresAt = new Date(license.expires_at);
      const gracePeriodEndsAt = new Date(license.grace_period_ends_at);

      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const graceDaysRemaining = Math.ceil((gracePeriodEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let status = license.status;
      let inGracePeriod = false;

      // Update status based on current time
      if (now > gracePeriodEndsAt) {
        status = 'suspended';
      } else if (now > expiresAt) {
        status = 'grace_period';
        inGracePeriod = true;
      } else {
        status = 'active';
      }

      return {
        hasLicense: true,
        status,
        daysRemaining: Math.max(0, daysRemaining),
        inGracePeriod,
        graceDaysRemaining: Math.max(0, graceDaysRemaining),
        keyCode: license.key_code,
        expiresAt,
        gracePeriodEndsAt
      };

    } catch (error) {
      console.error('Error checking tenant license status:', error);
      return { hasLicense: false };
    }
  }

  /**
   * Get licenses expiring in specified days for reminders
   */
  static async getLicensesForReminders(days: number): Promise<any[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const reminderField = days === 7 ? 'reminder_7day_sent' :
                         days === 3 ? 'reminder_3day_sent' :
                         days === 1 ? 'reminder_1day_sent' : null;

    if (!reminderField) return [];

    const [licenseRows] = await db.execute(
      `SELECT tl.*, t.name, t.email 
       FROM tenant_licenses tl 
       JOIN tenants t ON tl.tenant_id = t.id 
       WHERE tl.status = 'active' 
       AND tl.expires_at >= ? 
       AND tl.expires_at <= ? 
       AND tl.${reminderField} = FALSE`,
      [startOfDay, endOfDay]
    );

    return licenseRows as any[];
  }
}

export default LicenseKeyService;
