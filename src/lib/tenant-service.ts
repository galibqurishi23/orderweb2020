import pool from './db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import type { Tenant, TenantUser, SuperAdminUser } from './types';

// Email Service for notifications
export class EmailService {
  static async sendWelcomeEmail(
    restaurantName: string, 
    adminEmail: string, 
    adminName: string, 
    password: string, 
    tenantSlug: string
  ): Promise<void> {
    // In a real application, you would integrate with an email service like SendGrid, AWS SES, etc.
    // For now, we'll log the email details (in production, replace with actual email sending)
    console.log('=== RESTAURANT ADMIN WELCOME EMAIL ===');
    console.log('To:', adminEmail);
    console.log('Subject: Welcome to OrderWeb - Your Restaurant Dashboard is Ready!');
    console.log('---');
    console.log(`Dear ${adminName},`);
    console.log('');
    console.log(`Welcome to OrderWeb! Your restaurant "${restaurantName}" has been successfully set up.`);
    console.log('');
    console.log('Your admin dashboard login details:');
    console.log(`Dashboard URL: https://orderWeb.com/${tenantSlug}/admin`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${password}`);
    console.log('');
    console.log('Please log in and change your password for security.');
    console.log('');
    console.log('Your restaurant starts with default settings that you can customize:');
    console.log('- Business hours (Monday-Saturday 9 AM - 5 PM, Sunday closed)');
    console.log('- Currency (GBP)');
    console.log('- Tax rate (10%)');
    console.log('- Payment methods (Cash enabled by default)');
    console.log('- Empty menu (ready for you to add your items)');
    console.log('');
    console.log('You have a 14-day free trial. Enjoy setting up your restaurant!');
    console.log('');
    console.log('Best regards,');
    console.log('The OrderWeb Team');
    console.log('=====================================');
    
    // TODO: Replace with actual email service integration
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // const msg = {
    //   to: adminEmail,
    //   from: 'noreply@orderWeb.com',
    //   subject: 'Welcome to OrderWeb - Your Restaurant Dashboard is Ready!',
    //   html: emailTemplate
    // };
    // await sgMail.send(msg);
  }
}

// Tenant Management
export class TenantService {
  
  // Get all tenants (Super Admin)
  static async getAllTenants(): Promise<Tenant[]> {
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
  static async getTenantBySlug(slug: string): Promise<Tenant | null> {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM tenants WHERE slug = ? AND status = "active"',
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
  static async createTenant(data: {
    name: string;
    slug: string;
    email: string;
    phone?: string;
    address?: string;
    ownerName: string;
    ownerPassword: string;
  }): Promise<{ tenant: Tenant; owner: TenantUser }> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const tenantId = uuidv4();
      const ownerId = uuidv4();
      
      // Create tenant with 14-day trial
      await connection.execute(`
        INSERT INTO tenants (id, slug, name, email, phone, address, status, subscription_plan, subscription_status, trial_ends_at)
        VALUES (?, ?, ?, ?, ?, ?, 'trial', 'starter', 'trialing', DATE_ADD(NOW(), INTERVAL 14 DAY))
      `, [tenantId, data.slug, data.name, data.email, data.phone, data.address]);

      // Create comprehensive default tenant settings
      const defaultSettings = {
        name: data.name,
        description: `Welcome to ${data.name}`,
        logo: "https://placehold.co/200x200.png",
        logoHint: "restaurant logo",
        coverImage: "https://placehold.co/1600x400.png",
        coverImageHint: "restaurant interior",
        currency: "GBP",
        taxRate: 0.1,
        website: "",
        phone: data.phone || "",
        email: data.email,
        address: data.address || "",
        orderPrefix: "ORD",
        advanceOrderPrefix: "ADV",
        openingHours: {
          monday: {morningOpen: "09:00", morningClose: "17:00", eveningOpen: "", eveningClose: "", closed: false},
          tuesday: {morningOpen: "09:00", morningClose: "17:00", eveningOpen: "", eveningClose: "", closed: false},
          wednesday: {morningOpen: "09:00", morningClose: "17:00", eveningOpen: "", eveningClose: "", closed: false},
          thursday: {morningOpen: "09:00", morningClose: "17:00", eveningOpen: "", eveningClose: "", closed: false},
          friday: {morningOpen: "09:00", morningClose: "17:00", eveningOpen: "", eveningClose: "", closed: false},
          saturday: {morningOpen: "10:00", morningClose: "16:00", eveningOpen: "", eveningClose: "", closed: false},
          sunday: {morningOpen: "", morningClose: "", eveningOpen: "", eveningClose: "", closed: true}
        },
        orderThrottling: {
          monday: {interval: 15, ordersPerInterval: 10, enabled: false},
          tuesday: {interval: 15, ordersPerInterval: 10, enabled: false},
          wednesday: {interval: 15, ordersPerInterval: 10, enabled: false},
          thursday: {interval: 15, ordersPerInterval: 10, enabled: false},
          friday: {interval: 15, ordersPerInterval: 10, enabled: false},
          saturday: {interval: 15, ordersPerInterval: 10, enabled: false},
          sunday: {interval: 15, ordersPerInterval: 10, enabled: false}
        },
        paymentSettings: {
          cash: {enabled: true},
          stripe: {enabled: false, apiKey: "", apiSecret: ""},
          globalPayments: {enabled: false, merchantId: "", apiSecret: ""},
          worldpay: {enabled: false, apiKey: "", merchantId: ""}
        },
        orderTypeSettings: {
          deliveryEnabled: true,
          advanceOrderEnabled: true,
          collectionEnabled: true
        },
        theme: {
          primary: "224 82% 57%",
          primaryForeground: "210 40% 98%",
          background: "210 40% 98%",
          accent: "210 40% 94%"
        }
      };

      // Insert default settings
      await connection.execute(
        'INSERT INTO tenant_settings (tenant_id, settings_json) VALUES (?, ?)',
        [tenantId, JSON.stringify(defaultSettings)]
      );

      // Create owner/admin user
      const hashedPassword = await bcrypt.hash(data.ownerPassword, 10);
      await connection.execute(`
        INSERT INTO tenant_users (id, tenant_id, email, password, name, role, active)
        VALUES (?, ?, ?, ?, ?, 'owner', TRUE)
      `, [ownerId, tenantId, data.email, hashedPassword, data.ownerName]);

      // Initialize empty menu structure (tenant starts with no menu items)
      // This is intentional - new restaurants start with completely empty menus
      
      // Initialize default delivery zone (at least one zone is needed for orders)
      await connection.execute(`
        INSERT INTO delivery_zones (id, tenant_id, name, type, postcodes, deliveryFee, minOrder, deliveryTime, collectionTime)
        VALUES (?, ?, 'Default Zone', 'postcode', '[]', 0.00, 0.00, 30, 15)
      `, [uuidv4(), tenantId]);

      await connection.commit();

      // Fetch created tenant and owner
      const [tenantRows] = await connection.execute('SELECT * FROM tenants WHERE id = ?', [tenantId]);
      const [ownerRows] = await connection.execute('SELECT * FROM tenant_users WHERE id = ?', [ownerId]);

      const tenant = (tenantRows as Tenant[])[0];
      const owner = (ownerRows as TenantUser[])[0];

      // Send welcome email to new admin (async, don't wait for it)
      EmailService.sendWelcomeEmail(
        data.name,
        data.email,
        data.ownerName,
        data.ownerPassword,
        data.slug
      ).catch(error => {
        console.error('Failed to send welcome email:', error);
        // Don't throw error - tenant creation succeeded even if email failed
      });

      return { tenant, owner };

    } catch (error) {
      await connection.rollback();
      console.error('Error creating tenant:', error);
      throw new Error('Failed to create tenant');
    } finally {
      connection.release();
    }
  }

  // Hard delete tenant and all associated data
  static async deleteTenant(tenantId: string): Promise<void> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get tenant info before deletion (for logging/confirmation)
      const [tenantRows] = await connection.execute('SELECT name, slug FROM tenants WHERE id = ?', [tenantId]);
      const tenant = (tenantRows as any[])[0];
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      console.log(`Starting hard delete for tenant: ${tenant.name} (${tenant.slug})`);

      // Due to CASCADE DELETE constraints in the database schema, 
      // deleting the tenant will automatically delete all related data:
      // - tenant_settings
      // - tenant_users  
      // - menu_categories, menu_items, menu_item_options, menu_item_allergens
      // - orders, order_items
      // - zones
      // - vouchers
      // - printers
      // - billing records
      // - any other tenant-related data

      await connection.execute('DELETE FROM tenants WHERE id = ?', [tenantId]);

      await connection.commit();
      
      console.log(`Successfully deleted tenant: ${tenant.name} (${tenant.slug}) and all associated data`);

    } catch (error) {
      await connection.rollback();
      console.error('Error deleting tenant:', error);
      throw new Error('Failed to delete tenant');
    } finally {
      connection.release();
    }
  }

  // Update tenant status
  static async updateTenantStatus(tenantId: string, status: 'active' | 'suspended' | 'trial' | 'cancelled'): Promise<void> {
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

  // Get tenant settings
  static async getTenantSettings(tenantId: string): Promise<any> {
    try {
      const [rows] = await pool.execute(
        'SELECT settings_json FROM tenant_settings WHERE tenant_id = ?',
        [tenantId]
      );
      const settings = rows as any[];
      return settings.length > 0 ? settings[0].settings_json : null;
    } catch (error) {
      console.error('Error fetching tenant settings:', error);
      return null;
    }
  }

  // Update tenant settings
  static async updateTenantSettings(tenantId: string, settings: any): Promise<void> {
    try {
      await pool.execute(
        'UPDATE tenant_settings SET settings_json = ?, updated_at = NOW() WHERE tenant_id = ?',
        [JSON.stringify(settings), tenantId]
      );
    } catch (error) {
      console.error('Error updating tenant settings:', error);
      throw new Error('Failed to update tenant settings');
    }
  }
}

// Super Admin Management
export class SuperAdminService {
  
  // Authenticate super admin
  static async authenticate(email: string, password: string): Promise<SuperAdminUser | null> {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM super_admin_users WHERE email = ? AND active = TRUE',
        [email]
      );
      const users = rows as SuperAdminUser[];
      
      if (users.length === 0) return null;
      
      const user = users[0];
      if (!user.password) return null;
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      return isValidPassword ? user : null;
    } catch (error) {
      console.error('Error authenticating super admin:', error);
      return null;
    }
  }

  // Get platform statistics
  static async getPlatformStats(): Promise<{
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    totalRevenue: number;
    monthlyRevenue: number;
  }> {
    try {
      // Get tenant counts
      const [tenantStats] = await pool.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'trial' THEN 1 ELSE 0 END) as trial
        FROM tenants
      `);

      // Get revenue stats
      const [revenueStats] = await pool.execute(`
        SELECT 
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_revenue,
          SUM(CASE WHEN status = 'paid' AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN amount ELSE 0 END) as monthly_revenue
        FROM billing
      `);

      const tenantData = (tenantStats as any[])[0];
      const revenueData = (revenueStats as any[])[0];

      return {
        totalTenants: tenantData.total || 0,
        activeTenants: tenantData.active || 0,
        trialTenants: tenantData.trial || 0,
        totalRevenue: revenueData.total_revenue || 0,
        monthlyRevenue: revenueData.monthly_revenue || 0
      };
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      return {
        totalTenants: 0,
        activeTenants: 0,
        trialTenants: 0,
        totalRevenue: 0,
        monthlyRevenue: 0
      };
    }
  }

  // Get all super admin users
  static async getAllSuperAdminUsers(): Promise<SuperAdminUser[]> {
    try {
      const [rows] = await pool.execute(`
        SELECT id, email, name, role, active, created_at, updated_at 
        FROM super_admin_users 
        ORDER BY created_at ASC
      `);
      return rows as SuperAdminUser[];
    } catch (error) {
      console.error('Error fetching super admin users:', error);
      throw new Error('Failed to fetch super admin users');
    }
  }

  // Create new super admin user
  static async createSuperAdminUser(data: {
    name: string;
    email: string;
    password: string;
    role?: 'super_admin' | 'support';
  }): Promise<SuperAdminUser> {
    try {
      const id = uuidv4();
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      await pool.execute(`
        INSERT INTO super_admin_users (id, email, password, name, role, active)
        VALUES (?, ?, ?, ?, ?, TRUE)
      `, [id, data.email, hashedPassword, data.name, data.role || 'super_admin']);

      // Fetch the created user (without password)
      const [rows] = await pool.execute(
        'SELECT id, email, name, role, active, created_at, updated_at FROM super_admin_users WHERE id = ?',
        [id]
      );
      return (rows as SuperAdminUser[])[0];
    } catch (error) {
      console.error('Error creating super admin user:', error);
      throw error;
    }
  }

  // Update super admin user status
  static async updateSuperAdminUserStatus(userId: string, active: boolean): Promise<void> {
    try {
      await pool.execute(
        'UPDATE super_admin_users SET active = ?, updated_at = NOW() WHERE id = ?',
        [active, userId]
      );
    } catch (error) {
      console.error('Error updating super admin user status:', error);
      throw new Error('Failed to update user status');
    }
  }

  // Delete super admin user
  static async deleteSuperAdminUser(userId: string): Promise<void> {
    try {
      // Prevent deletion if it would leave no active users
      const [activeUsers] = await pool.execute(
        'SELECT COUNT(*) as count FROM super_admin_users WHERE active = TRUE AND id != ?',
        [userId]
      );
      const activeCount = (activeUsers as any[])[0].count;
      
      if (activeCount === 0) {
        throw new Error('Cannot delete the last active super admin user');
      }

      await pool.execute('DELETE FROM super_admin_users WHERE id = ?', [userId]);
    } catch (error) {
      console.error('Error deleting super admin user:', error);
      throw error;
    }
  }
}

// Tenant User Management
export class TenantUserService {
  
  // Authenticate tenant user
  static async authenticate(email: string, password: string, tenantId: string): Promise<TenantUser | null> {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM tenant_users WHERE email = ? AND tenant_id = ? AND active = TRUE',
        [email, tenantId]
      );
      const users = rows as TenantUser[];
      
      if (users.length === 0) return null;
      
      const user = users[0];
      if (!user.password) return null;
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      return isValidPassword ? user : null;
    } catch (error) {
      console.error('Error authenticating tenant user:', error);
      return null;
    }
  }

  // Get tenant users
  static async getTenantUsers(tenantId: string): Promise<TenantUser[]> {
    try {
      const [rows] = await pool.execute(
        'SELECT id, tenant_id, email, name, role, permissions, active, created_at, updated_at FROM tenant_users WHERE tenant_id = ? ORDER BY created_at DESC',
        [tenantId]
      );
      return rows as TenantUser[];
    } catch (error) {
      console.error('Error fetching tenant users:', error);
      throw new Error('Failed to fetch tenant users');
    }
  }
}

// Orders Service (Tenant-aware)
export class OrderService {
  
  // Get orders for a tenant
  static async getTenantOrders(tenantId: string, limit: number = 50): Promise<any[]> {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          id, customerName, customerPhone, customerEmail, total, status, 
          orderType, isAdvanceOrder, scheduledTime, createdAt
        FROM orders 
        WHERE tenant_id = ? 
        ORDER BY createdAt DESC 
        LIMIT ?
      `, [tenantId, limit]);
      return rows as any[];
    } catch (error) {
      console.error('Error fetching tenant orders:', error);
      return [];
    }
  }

  // Get order statistics for a tenant
  static async getTenantOrderStats(tenantId: string): Promise<{
    totalOrders: number;
    todayOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    todayRevenue: number;
  }> {
    try {
      const [orderStats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN DATE(createdAt) = CURDATE() THEN 1 ELSE 0 END) as today_orders,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
          SUM(total) as total_revenue,
          SUM(CASE WHEN DATE(createdAt) = CURDATE() THEN total ELSE 0 END) as today_revenue
        FROM orders 
        WHERE tenant_id = ?
      `, [tenantId]);

      const stats = (orderStats as any[])[0];
      return {
        totalOrders: stats.total_orders || 0,
        todayOrders: stats.today_orders || 0,
        pendingOrders: stats.pending_orders || 0,
        totalRevenue: parseFloat(stats.total_revenue) || 0,
        todayRevenue: parseFloat(stats.today_revenue) || 0
      };
    } catch (error) {
      console.error('Error fetching tenant order stats:', error);
      return {
        totalOrders: 0,
        todayOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        todayRevenue: 0
      };
    }
  }
}
