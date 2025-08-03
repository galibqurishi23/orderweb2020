'use server'; // Mark as server-only code

import pool from './db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import type { Tenant, TenantUser, SuperAdminUser, RestaurantSettings } from './types';
import { emailService } from './universal-email-service';

// Email Service for notifications
export async function sendWelcomeEmail(
  restaurantName: string, 
  adminEmail: string, 
  adminName: string, 
  password: string, 
  tenantSlug: string
): Promise<void> {
  try {
    // Use the universal email service to send welcome email
    const success = await emailService.sendWelcomeEmail({
      restaurantName: restaurantName,
      adminEmail: adminEmail,
      adminName: adminName,
      password: password,
      tenantSlug: tenantSlug
    });

    if (success) {
      console.log(`✅ Welcome email sent successfully to ${adminEmail}`);
    } else {
      console.error(`❌ Failed to send welcome email to ${adminEmail}`);
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
}

// Get all tenants (Super Admin)
export async function getAllTenants(): Promise<Tenant[]> {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        id, slug, name, email, phone, address, status, 
        subscription_plan, subscription_status, trial_ends_at,
        created_at, updated_at
      FROM tenants 
      ORDER BY created_at DESC
    `);
    return rows as Tenant[];
  } catch (error) {
    console.error('Error fetching tenants:', error);
    throw new Error('Failed to fetch tenants');
  }
}

// Get tenant by slug
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM tenants WHERE slug = ? AND status IN ("active", "trial")',
      [slug]
    );
    const tenants = rows as Tenant[];
    return tenants.length > 0 ? tenants[0] : null;
  } catch (error) {
    console.error('Error fetching tenant by slug:', error);
    return null;
  }
}

// Create new tenant with full automation
export async function createTenant(data: {
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  adminName: string;
  adminEmail: string;
  adminPassword?: string; // If not provided, will generate a random one
}): Promise<{ tenant: Tenant; adminUser: TenantUser; password: string }> {
  // Generate a random password if not provided
  const password = data.adminPassword || Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Create the tenant record
      const tenantId = uuidv4();
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const trialEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
        .toISOString().slice(0, 19).replace('T', ' ');
      
      await connection.execute(
        `INSERT INTO tenants (
          id, slug, name, email, phone, address, status, 
          subscription_plan, subscription_status, trial_ends_at, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId,
          data.slug,
          data.name,
          data.email,
          data.phone || '',
          data.address || '',
          'trial',
          'starter',
          'trialing',
          trialEndsAt,
          now,
          now
        ]
      );
      
      // Create the admin user for this tenant
      const adminId = uuidv4();
      
      await connection.execute(
        `INSERT INTO tenant_users (
          id, tenant_id, email, password, name, role, active,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          adminId,
          tenantId,
          data.adminEmail,
          hashedPassword,
          data.adminName,
          'owner',
          true,
          now,
          now
        ]
      );
      
      // Initialize tenant settings with default values
      const defaultSettings = {
        name: data.name,
        description: '',
        logo: '',
        logoHint: '',
        coverImage: '',
        coverImageHint: '',
        favicon: '',
        currency: 'GBP',
        // No taxRate - application is tax-free
        website: '',
        phone: data.phone || '',
        email: data.email,
        address: data.address || '',
        openingHours: {
          monday: { closed: false, timeMode: 'single', openTime: '09:00', closeTime: '17:00' },
          tuesday: { closed: false, timeMode: 'single', openTime: '09:00', closeTime: '17:00' },
          wednesday: { closed: false, timeMode: 'single', openTime: '09:00', closeTime: '17:00' },
          thursday: { closed: false, timeMode: 'single', openTime: '09:00', closeTime: '17:00' },
          friday: { closed: false, timeMode: 'single', openTime: '09:00', closeTime: '17:00' },
          saturday: { closed: false, timeMode: 'single', openTime: '09:00', closeTime: '17:00' },
          sunday: { closed: true, timeMode: 'single', openTime: '09:00', closeTime: '17:00' }
        },
        orderThrottling: {
          monday: { interval: 15, ordersPerInterval: 10, enabled: false },
          tuesday: { interval: 15, ordersPerInterval: 10, enabled: false },
          wednesday: { interval: 15, ordersPerInterval: 10, enabled: false },
          thursday: { interval: 15, ordersPerInterval: 10, enabled: false },
          friday: { interval: 15, ordersPerInterval: 10, enabled: false },
          saturday: { interval: 15, ordersPerInterval: 10, enabled: false },
          sunday: { interval: 15, ordersPerInterval: 10, enabled: false }
        },
        paymentSettings: {
          cash: { enabled: true },
          stripe: { enabled: false, apiKey: '', apiSecret: '', merchantId: '' },
          globalPayments: { enabled: false, apiKey: '', apiSecret: '', merchantId: '' },
          worldpay: { enabled: false, apiKey: '', apiSecret: '', merchantId: '' }
        },
        orderTypeSettings: {
          deliveryEnabled: true,
          advanceOrderEnabled: true,
          collectionEnabled: true
        },
        theme: {
          primary: '224 82% 57%',
          primaryForeground: '0 0% 100%',
          background: '0 0% 100%',
          accent: '210 40% 96%'
        }
      };
      
      await connection.execute(
        `INSERT INTO tenant_settings (tenant_id, settings_json, created_at, updated_at)
        VALUES (?, ?, ?, ?)`,
        [
          tenantId,
          JSON.stringify(defaultSettings),
          now,
          now
        ]
      );
      
      await connection.commit();
      
      // Send welcome email to the admin
      await sendWelcomeEmail(data.name, data.adminEmail, data.adminName, password, data.slug);
      
      // Return the created tenant and admin user details
      return {
        tenant: {
          id: tenantId,
          slug: data.slug,
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          status: 'trial',
          subscription_plan: 'starter',
          subscription_status: 'trialing',
          trial_ends_at: trialEndsAt,
          created_at: now,
          updated_at: now
        },
        adminUser: {
          id: adminId,
          tenant_id: tenantId,
          email: data.adminEmail,
          name: data.adminName,
          role: 'owner',
          active: true,
          created_at: now,
          updated_at: now
        },
        password
      };
    } catch (error) {
      await connection.rollback();
      console.error('Transaction rollback due to error:', error);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Error creating tenant:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      sqlMessage: error?.sqlMessage,
      sqlState: error?.sqlState,
      stack: error?.stack
    });
    throw new Error(`Failed to create tenant and admin account: ${error?.message || 'Unknown error'}`);
  }
}

// Get tenant settings
export async function getTenantSettings(tenantId: string): Promise<RestaurantSettings | null> {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('Getting settings for tenant:', tenantId);
    }
    
    // Let's try to debug if the pool is working correctly
    const connection = await pool.getConnection();
    if (process.env.NODE_ENV === 'development') {
      console.log('Got connection from pool');
    }
    
    try {
      const [rows] = await connection.execute(
        'SELECT settings_json FROM tenant_settings WHERE tenant_id = ?',
        [tenantId]
      );
      const settings = rows as any[];
      if (process.env.NODE_ENV === 'development') {
        console.log('Settings rows found:', settings.length);
      }
      
      if (settings.length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Settings JSON:', settings[0].settings_json);
        }
        // The settings are stored as a JSON string, so we need to parse it.
        return JSON.parse(settings[0].settings_json) as RestaurantSettings;
      }
      return null;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching tenant settings:', error);
    return null;
  }
}

// Get tenant settings by slug
export async function getTenantSettingsBySlug(slug: string): Promise<RestaurantSettings | null> {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('Getting settings for tenant slug:', slug);
    }
    
    const connection = await pool.getConnection();
    if (process.env.NODE_ENV === 'development') {
      console.log('Got connection from pool');
    }
    
    try {
      // First get the tenant ID from the slug
      const [tenantRows] = await connection.execute(
        'SELECT id FROM tenants WHERE slug = ? AND status IN ("active", "trial")',
        [slug]
      );
      const tenants = tenantRows as any[];
      
      if (tenants.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('No tenant found with slug:', slug);
        }
        return null;
      }
      
      const tenantId = tenants[0].id;
      if (process.env.NODE_ENV === 'development') {
        console.log('Found tenant ID:', tenantId);
      }
      
      // Now get the settings
      const [rows] = await connection.execute(
        'SELECT settings_json FROM tenant_settings WHERE tenant_id = ?',
        [tenantId]
      );
      const settings = rows as any[];
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Settings rows found:', settings.length);
      }
      
      if (settings.length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Settings JSON:', settings[0].settings_json);
        }
        return JSON.parse(settings[0].settings_json) as RestaurantSettings;
      }
      return null;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching tenant settings by slug:', error);
    return null;
  }
}

// Update tenant settings
export async function updateTenantSettings(tenantId: string, settings: RestaurantSettings): Promise<void> {
  try {
    // Use INSERT ON DUPLICATE KEY UPDATE for upsert functionality
    await pool.execute(
      `INSERT INTO tenant_settings (tenant_id, settings_json, created_at, updated_at) 
       VALUES (?, ?, NOW(), NOW()) 
       ON DUPLICATE KEY UPDATE 
       settings_json = VALUES(settings_json), 
       updated_at = NOW()`,
      [tenantId, JSON.stringify(settings)]
    );
  } catch (error) {
    console.error('Error updating tenant settings:', error);
    throw new Error('Failed to update tenant settings');
  }
}

// Update tenant status
export async function updateTenantStatus(tenantId: string, status: string): Promise<void> {
  try {
    await pool.execute(
      'UPDATE tenants SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, tenantId]
    );
  } catch (error) {
    console.error('Error updating tenant status:', error);
    throw new Error('Failed to update tenant status');
  }
}

// Delete tenant
export async function deleteTenant(tenantId: string): Promise<void> {
  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Delete related data first (due to foreign key constraints)
      await connection.execute('DELETE FROM tenant_settings WHERE tenant_id = ?', [tenantId]);
      await connection.execute('DELETE FROM tenant_users WHERE tenant_id = ?', [tenantId]);
      
      // Then delete the tenant
      await connection.execute('DELETE FROM tenants WHERE id = ?', [tenantId]);
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting tenant:', error);
    throw new Error('Failed to delete tenant');
  }
}

// Get platform statistics (Super Admin)
export async function getPlatformStats(): Promise<{
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  totalRevenue: number;
  monthlyRevenue: number;
}> {
  try {
    // Get tenant counts
    const [tenantCounts] = await pool.execute(`
      SELECT 
        COUNT(*) as totalTenants,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeTenants,
        SUM(CASE WHEN status = 'trial' THEN 1 ELSE 0 END) as trialTenants
      FROM tenants
    `);

    const counts = (tenantCounts as any[])[0];

    // For now, we'll return mock revenue data since we don't have a billing system implemented
    // In a real implementation, you would calculate this from actual billing/subscription data
    const stats = {
      totalTenants: counts.totalTenants || 0,
      activeTenants: counts.activeTenants || 0,
      trialTenants: counts.trialTenants || 0,
      totalRevenue: 0, // TODO: Implement when billing system is added
      monthlyRevenue: 0 // TODO: Implement when billing system is added
    };

    return stats;
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    throw new Error('Failed to fetch platform statistics');
  }
}

// Super Admin User Management Functions

// Get all super admin users
export async function getAllSuperAdminUsers(): Promise<SuperAdminUser[]> {
  try {
    const [rows] = await pool.execute(`
      SELECT id, email, name, role, active, created_at, updated_at
      FROM super_admin_users 
      ORDER BY created_at DESC
    `);
    return rows as SuperAdminUser[];
  } catch (error) {
    console.error('Error fetching super admin users:', error);
    throw new Error('Failed to fetch super admin users');
  }
}

// Create super admin user
export async function createSuperAdminUser(data: {
  email: string;
  name: string;
  password: string;
  role?: 'super_admin' | 'support';
}): Promise<SuperAdminUser> {
  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const userId = uuidv4();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    await pool.execute(
      `INSERT INTO super_admin_users (
        id, email, password, name, role, active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        data.email,
        hashedPassword,
        data.name,
        data.role || 'super_admin',
        true,
        now,
        now
      ]
    );
    
    return {
      id: userId,
      email: data.email,
      name: data.name,
      role: data.role || 'super_admin',
      active: true,
      created_at: now,
      updated_at: now
    };
  } catch (error) {
    console.error('Error creating super admin user:', error);
    throw new Error('Failed to create super admin user');
  }
}

// Update super admin user status
export async function updateSuperAdminUserStatus(userId: string, active: boolean): Promise<void> {
  try {
    await pool.execute(
      'UPDATE super_admin_users SET active = ?, updated_at = NOW() WHERE id = ?',
      [active, userId]
    );
  } catch (error) {
    console.error('Error updating super admin user status:', error);
    throw new Error('Failed to update super admin user status');
  }
}

// Delete super admin user
export async function deleteSuperAdminUser(userId: string): Promise<void> {
  try {
    await pool.execute(
      'DELETE FROM super_admin_users WHERE id = ?',
      [userId]
    );
  } catch (error) {
    console.error('Error deleting super admin user:', error);
    throw new Error('Failed to delete super admin user');
  }
}

// Change super admin user password
export async function changeSuperAdminUserPassword(
  userId: string, 
  currentPassword: string, 
  newPassword: string
): Promise<void> {
  try {
    // First verify the current password
    const [rows] = await pool.execute(
      'SELECT password FROM super_admin_users WHERE id = ?',
      [userId]
    );
    
    const users = rows as any[];
    if (users.length === 0) {
      throw new Error('User not found');
    }
    
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }
    
    // Hash and update the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      'UPDATE super_admin_users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedNewPassword, userId]
    );
  } catch (error) {
    console.error('Error changing super admin user password:', error);
    throw error; // Re-throw to preserve the original error message
  }
}

// Change tenant admin user password (called from super admin panel)
export async function changeTenantAdminUserPassword(
  userId: string, 
  newPassword: string
): Promise<void> {
  try {
    // Super admin can change tenant admin password without current password
    const [rows] = await pool.execute(
      'SELECT id, tenant_id FROM tenant_users WHERE id = ?',
      [userId]
    );
    
    const users = rows as any[];
    if (users.length === 0) {
      throw new Error('Tenant admin user not found');
    }
    
    // Hash and update the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await pool.execute(
      'UPDATE tenant_users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedNewPassword, userId]
    );
  } catch (error) {
    console.error('Error changing tenant admin user password:', error);
    throw error;
  }
}

// Change tenant admin password (self-service)
export async function changeTenantAdminPassword(
  tenantId: string, 
  currentPassword: string, 
  newPassword: string
): Promise<void> {
  try {
    // Get the tenant admin user (owner role)
    const [rows] = await pool.execute(
      'SELECT id, password FROM tenant_users WHERE tenant_id = ? AND role = ?',
      [tenantId, 'owner']
    );
    
    const users = rows as any[];
    if (users.length === 0) {
      throw new Error('Tenant admin user not found');
    }
    
    const user = users[0];
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Invalid current password');
    }
    
    // Hash and update the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await pool.execute(
      'UPDATE tenant_users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedNewPassword, user.id]
    );
  } catch (error) {
    console.error('Error changing tenant admin password:', error);
    throw error;
  }
}

// Change tenant admin email (self-service)
export async function changeTenantAdminEmail(
  tenantId: string, 
  newEmail: string, 
  currentPassword: string
): Promise<void> {
  try {
    // Get the tenant admin user (owner role)
    const [rows] = await pool.execute(
      'SELECT id, email, password FROM tenant_users WHERE tenant_id = ? AND role = ?',
      [tenantId, 'owner']
    );
    
    const users = rows as any[];
    if (users.length === 0) {
      throw new Error('Tenant admin user not found');
    }
    
    const user = users[0];
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Invalid current password');
    }
    
    // Check if new email is already in use
    const [existingEmailRows] = await pool.execute(
      'SELECT id FROM tenant_users WHERE email = ? AND id != ?',
      [newEmail, user.id]
    );
    
    if ((existingEmailRows as any[]).length > 0) {
      throw new Error('Email already exists');
    }
    
    // Update the email
    await pool.execute(
      'UPDATE tenant_users SET email = ?, updated_at = NOW() WHERE id = ?',
      [newEmail, user.id]
    );
  } catch (error) {
    console.error('Error changing tenant admin email:', error);
    throw error;
  }
}

// Order Service for tenant statistics
export async function getTenantOrderStats(tenantId: string): Promise<{
  todayOrders: number;
  todayRevenue: number;
  totalCustomers: number;
  totalRefunds: number;
}> {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Get today's orders count
    const [todayOrdersResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM orders WHERE tenant_id = ? AND createdAt >= ?',
      [tenantId, todayStart]
    );
    const todayOrders = (todayOrdersResult as any[])[0].count;
    
    // Get today's revenue
    const [todayRevenueResult] = await pool.execute(
      'SELECT SUM(total) as total FROM orders WHERE tenant_id = ? AND createdAt >= ? AND status != ?',
      [tenantId, todayStart, 'cancelled']
    );
    const todayRevenue = (todayRevenueResult as any[])[0].total || 0;
    
    // Get total customers count
    const [totalCustomersResult] = await pool.execute(
      'SELECT COUNT(DISTINCT customerId) as count FROM orders WHERE tenant_id = ? AND customerId IS NOT NULL',
      [tenantId]
    );
    const totalCustomers = (totalCustomersResult as any[])[0].count;
    
    // Get total refunds (assuming refunded orders or refund amount)
    const [totalRefundsResult] = await pool.execute(
      'SELECT SUM(total) as total FROM orders WHERE tenant_id = ? AND status = ?',
      [tenantId, 'refunded']
    );
    const totalRefunds = (totalRefundsResult as any[])[0].total || 0;
    
    return {
      todayOrders,
      todayRevenue: parseFloat(todayRevenue.toString()),
      totalCustomers,
      totalRefunds: parseFloat(totalRefunds.toString())
    };
  } catch (error) {
    console.error('Error fetching tenant order stats:', error);
    throw new Error('Failed to fetch tenant order statistics');
  }
}

export async function getRecentTenantOrders(tenantId: string, limit: number = 10): Promise<any[]> {
  try {
    const [orders] = await pool.execute(
      `SELECT o.id, o.order_number as orderNumber, o.total, o.status, o.createdAt as createdAt, 
              o.customerName as customerName, o.customerEmail as customerEmail
       FROM orders o
       WHERE o.tenant_id = ?
       ORDER BY o.createdAt DESC
       LIMIT ?`,
      [tenantId, limit]
    );
    return orders as any[];
  } catch (error) {
    console.error('Error fetching recent tenant orders:', error);
    throw new Error('Failed to fetch recent tenant orders');
  }
}

export async function getTenantOrders(tenantId: string, limit: number = 50): Promise<any[]> {
  try {
    const [orders] = await pool.execute(
      `SELECT o.id, o.order_number as orderNumber, o.total, o.status, o.createdAt as createdAt,
              o.customerName as customerName, o.customerEmail as customerEmail
       FROM orders o
       WHERE o.tenant_id = ?
       ORDER BY o.createdAt DESC
       LIMIT ?`,
      [tenantId, limit]
    );
    return orders as any[];
  } catch (error) {
    console.error('Error fetching tenant orders:', error);
    throw new Error('Failed to fetch tenant orders');
  }
}
