import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '@/lib/db';

interface CustomerAuthResult {
  success: boolean;
  customer?: any;
  token?: string;
  error?: string;
}

export class CustomerAuthService {
  private static readonly JWT_SECRET: string = process.env.NEXTAUTH_SECRET || 'customer-secret-key';
  private static readonly TOKEN_EXPIRY: string = '7d'; // 7 days
  private static readonly MAX_LOGIN_ATTEMPTS: number = 5;
  private static readonly LOCKOUT_DURATION: number = 15; // minutes

  /**
   * Authenticate customer with email and password
   */
  static async login(email: string, password: string, tenantId: string, ipAddress?: string): Promise<CustomerAuthResult> {
    try {
      // Check for too many failed attempts
      const recentAttempts = await this.getRecentLoginAttempts(email, tenantId, ipAddress);
      if (recentAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        return { success: false, error: 'Too many failed login attempts. Please try again in 15 minutes.' };
      }

      // Find customer
      const [customers] = await db.execute(
        'SELECT * FROM customers WHERE email = ? AND tenant_id = ?',
        [email, tenantId]
      );

      const customer = (customers as any[])[0];
      if (!customer) {
        await this.logLoginAttempt(email, tenantId, false, ipAddress);
        return { success: false, error: 'Invalid email or password' };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, customer.password);
      if (!isValidPassword) {
        await this.logLoginAttempt(email, tenantId, false, ipAddress);
        return { success: false, error: 'Invalid email or password' };
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          customerId: customer.id,
          tenantId: tenantId,
          email: customer.email,
          type: 'customer'
        },
        CustomerAuthService.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Create session
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      await db.execute(
        'INSERT INTO customer_sessions (id, customer_id, tenant_id, expires_at) VALUES (?, ?, ?, ?)',
        [sessionId, customer.id, tenantId, expiresAt]
      );

      // Log successful attempt
      await this.logLoginAttempt(email, tenantId, true, ipAddress);

      // Update customer last login
      await db.execute(
        'UPDATE customers SET updated_at = NOW() WHERE id = ?',
        [customer.id]
      );

      // Remove password from response
      const { password: _, ...customerData } = customer;

      return {
        success: true,
        customer: customerData,
        token: token
      };

    } catch (error) {
      console.error('Customer login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  /**
   * Register new customer
   */
  static async register(
    name: string, 
    email: string, 
    password: string, 
    phone: string, 
    tenantId: string
  ): Promise<CustomerAuthResult> {
    try {
      // Check if customer already exists
      const [existing] = await db.execute(
        'SELECT id FROM customers WHERE email = ? AND tenant_id = ?',
        [email, tenantId]
      );

      if ((existing as any[]).length > 0) {
        return { success: false, error: 'Account already exists with this email' };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Generate customer ID
      const customerId = crypto.randomUUID();

      // Create customer
      await db.execute(
        `INSERT INTO customers (id, tenant_id, name, email, phone, password, customer_segment, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, 'new', NOW())`,
        [customerId, tenantId, name, email, phone, hashedPassword]
      );

      // Create loyalty points record with signup bonus
      await db.execute(
        'INSERT INTO customer_loyalty_points (customer_id, tenant_id, points_balance, total_points_earned, tier_level) VALUES (?, ?, 100, 100, "bronze")',
        [customerId, tenantId]
      );

      // Log signup bonus transaction
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year expiry

      await db.execute(
        'INSERT INTO loyalty_transactions (customer_id, tenant_id, transaction_type, points_amount, description, expires_at) VALUES (?, ?, "bonus", 100, "Welcome signup bonus", ?)',
        [customerId, tenantId, expiresAt]
      );

      // Create default preferences
      await db.execute(
        'INSERT INTO customer_preferences (customer_id, tenant_id, dietary_preferences, communication_preferences) VALUES (?, ?, "[]", JSON_OBJECT("email_orders", true, "email_promotions", true, "sms_orders", false, "sms_promotions", false))',
        [customerId, tenantId]
      );

      // Auto-login after registration
      return await this.login(email, password, tenantId);

    } catch (error) {
      console.error('Customer registration error:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  }

  /**
   * Verify JWT token and get customer
   */
  static async verifyToken(token: string): Promise<CustomerAuthResult> {
    try {
      const decoded = jwt.verify(token, CustomerAuthService.JWT_SECRET) as any;
      
      if (decoded.type !== 'customer') {
        return { success: false, error: 'Invalid token type' };
      }

      // Get customer data
      const [customers] = await db.execute(
        'SELECT * FROM customers WHERE id = ? AND tenant_id = ?',
        [decoded.customerId, decoded.tenantId]
      );

      const customer = (customers as any[])[0];
      if (!customer) {
        return { success: false, error: 'Customer not found' };
      }

      // Remove password from response
      const { password: _, ...customerData } = customer;

      return {
        success: true,
        customer: customerData
      };

    } catch (error) {
      return { success: false, error: 'Invalid or expired token' };
    }
  }

  /**
   * Logout customer (invalidate session)
   */
  static async logout(token: string): Promise<boolean> {
    try {
      const decoded = jwt.verify(token, CustomerAuthService.JWT_SECRET) as any;
      
      // Remove all sessions for this customer
      await db.execute(
        'DELETE FROM customer_sessions WHERE customer_id = ? AND tenant_id = ?',
        [decoded.customerId, decoded.tenantId]
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate password reset token
   */
  static async generatePasswordResetToken(email: string, tenantId: string): Promise<string | null> {
    try {
      const [customers] = await db.execute(
        'SELECT id FROM customers WHERE email = ? AND tenant_id = ?',
        [email, tenantId]
      );

      const customer = (customers as any[])[0];
      if (!customer) {
        return null;
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

      await db.execute(
        'INSERT INTO customer_password_resets (customer_id, tenant_id, token, expires_at) VALUES (?, ?, ?, ?)',
        [customer.id, tenantId, token, expiresAt]
      );

      return token;
    } catch (error) {
      console.error('Password reset token generation error:', error);
      return null;
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token: string, newPassword: string, tenantId: string): Promise<boolean> {
    try {
      // Find valid token
      const [tokens] = await db.execute(
        'SELECT customer_id FROM customer_password_resets WHERE token = ? AND tenant_id = ? AND expires_at > NOW() AND used = false',
        [token, tenantId]
      );

      const tokenData = (tokens as any[])[0];
      if (!tokenData) {
        return false;
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await db.execute(
        'UPDATE customers SET password = ? WHERE id = ?',
        [hashedPassword, tokenData.customer_id]
      );

      // Mark token as used
      await db.execute(
        'UPDATE customer_password_resets SET used = true WHERE token = ?',
        [token]
      );

      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      return false;
    }
  }

  /**
   * Log login attempt for security
   */
  private static async logLoginAttempt(email: string, tenantId: string, success: boolean, ipAddress?: string): Promise<void> {
    try {
      await db.execute(
        'INSERT INTO customer_login_attempts (email, tenant_id, ip_address, success) VALUES (?, ?, ?, ?)',
        [email, tenantId, ipAddress || null, success]
      );
    } catch (error) {
      console.error('Failed to log login attempt:', error);
    }
  }

  /**
   * Get recent failed login attempts
   */
  private static async getRecentLoginAttempts(email: string, tenantId: string, ipAddress?: string): Promise<number> {
    try {
      const [attempts] = await db.execute(
        `SELECT COUNT(*) as count FROM customer_login_attempts 
         WHERE email = ? AND tenant_id = ? AND success = false 
         AND attempted_at > DATE_SUB(NOW(), INTERVAL ${this.LOCKOUT_DURATION} MINUTE)
         ${ipAddress ? 'AND ip_address = ?' : ''}`,
        ipAddress ? [email, tenantId, ipAddress] : [email, tenantId]
      );

      return (attempts as any[])[0]?.count || 0;
    } catch (error) {
      console.error('Failed to get login attempts:', error);
      return 0;
    }
  }
}
