const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
require('dotenv').config();

// Database configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'dinedesk_db',
  port: process.env.DB_PORT || 3306,
  multipleStatements: true
};

// Complete database schema
const DATABASE_SCHEMA = `
-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(255) PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  status ENUM('active', 'suspended', 'trial', 'cancelled') DEFAULT 'trial',
  subscription_plan ENUM('starter', 'professional', 'enterprise') DEFAULT 'starter',
  subscription_status ENUM('active', 'past_due', 'cancelled', 'trialing') DEFAULT 'trialing',
  trial_ends_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Create tenant_users table
CREATE TABLE IF NOT EXISTS tenant_users (
  id VARCHAR(255) PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('owner', 'manager', 'staff') DEFAULT 'staff',
  permissions JSON,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_tenant_email (tenant_id, email),
  INDEX idx_active (active)
);

-- Create tenant_settings table
CREATE TABLE IF NOT EXISTS tenant_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(255) UNIQUE NOT NULL,
  settings_json JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(255) PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_tenant_email (tenant_id, email),
  INDEX idx_tenant_phone (tenant_id, phone)
);

-- Create addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id VARCHAR(255) PRIMARY KEY,
  customer_id VARCHAR(255) NOT NULL,
  street TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  postcode VARCHAR(20) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX idx_customer_default (customer_id, is_default)
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(255) PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  parent_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_tenant_active (tenant_id, active),
  INDEX idx_display_order (display_order)
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id VARCHAR(255) PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  category_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(500),
  image_hint VARCHAR(255),
  available BOOLEAN DEFAULT TRUE,
  addons JSON,
  characteristics JSON,
  nutrition JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_tenant_category (tenant_id, category_id),
  INDEX idx_available (available)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(255) PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  order_number VARCHAR(20) UNIQUE,
  customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),
  address TEXT,
  total DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled', 'scheduled') DEFAULT 'pending',
  order_type ENUM('delivery', 'pickup', 'advance', 'collection') NOT NULL,
  is_advance_order BOOLEAN DEFAULT FALSE,
  scheduled_time DATETIME,
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL,
  voucher_code VARCHAR(255),
  printed BOOLEAN DEFAULT FALSE,
  payment_method ENUM('cash', 'card', 'voucher') DEFAULT 'cash',
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  INDEX idx_tenant_status (tenant_id, status),
  INDEX idx_tenant_date (tenant_id, created_at),
  INDEX idx_order_number (order_number)
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(255) PRIMARY KEY,
  order_id VARCHAR(255) NOT NULL,
  menu_item_id VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  selected_addons JSON,
  special_instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT,
  INDEX idx_order (order_id)
);

-- Create delivery_zones table
CREATE TABLE IF NOT EXISTS delivery_zones (
  id VARCHAR(255) PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('postcode', 'radius') DEFAULT 'postcode',
  postcodes JSON,
  delivery_fee DECIMAL(10,2) NOT NULL,
  min_order DECIMAL(10,2) NOT NULL,
  delivery_time INT NOT NULL, -- in minutes
  collection_time INT NOT NULL, -- in minutes
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_tenant_active (tenant_id, active)
);

-- Create vouchers table
CREATE TABLE IF NOT EXISTS vouchers (
  id VARCHAR(255) PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  type ENUM('percentage', 'amount') NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  min_order DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2),
  expiry_date DATETIME,
  active BOOLEAN DEFAULT TRUE,
  usage_limit INT,
  used_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE KEY unique_tenant_code (tenant_id, code),
  INDEX idx_tenant_active (tenant_id, active),
  INDEX idx_code (code)
);

-- Create printers table
CREATE TABLE IF NOT EXISTS printers (
  id VARCHAR(255) PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  port INT DEFAULT 9100,
  type ENUM('kitchen', 'receipt', 'bar', 'dot-matrix', 'label') NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_tenant_active (tenant_id, active)
);

-- Create super_admin_users table
CREATE TABLE IF NOT EXISTS super_admin_users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'support') DEFAULT 'super_admin',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_active (active)
);

-- Create platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  id INT PRIMARY KEY DEFAULT 1,
  settings_json JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create billing table (for future subscription management)
CREATE TABLE IF NOT EXISTS billing (
  id VARCHAR(255) PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  subscription_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GBP',
  status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  billing_date DATE NOT NULL,
  due_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_tenant_date (tenant_id, billing_date),
  INDEX idx_status (status)
);
`;

// Default settings for new tenants
const DEFAULT_TENANT_SETTINGS = {
  name: '',
  description: '',
  logo: '',
  logoHint: '',
  coverImage: '',
  coverImageHint: '',
  favicon: '',
  currency: 'GBP',
  taxRate: 0.1,
  website: '',
  phone: '',
  email: '',
  address: '',
  orderPrefix: 'ORD',
  advanceOrderPrefix: 'ADV',
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

// Default platform settings
const DEFAULT_PLATFORM_SETTINGS = {
  siteName: 'OrderWeb',
  siteDescription: 'Multi-tenant restaurant ordering system',
  adminEmail: process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com',
  enableRegistration: true,
  maintenanceMode: false,
  version: '1.0.0'
};

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    
    console.log('✅ Database connected successfully');
    
    // Create all tables
    console.log('📋 Creating database tables...');
    
    // Split the schema into individual statements
    const statements = DATABASE_SCHEMA.split(';').filter(statement => statement.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }
    
    console.log('✅ Database tables created successfully');
    
    // Check if super admin exists
    const [existingAdmin] = await connection.execute(
      'SELECT id FROM super_admin_users WHERE email = ?',
      [process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com']
    );
    
    if (existingAdmin.length === 0) {
      console.log('👤 Creating default super admin user...');
      const hashedPassword = await bcrypt.hash(
        process.env.DEFAULT_ADMIN_PASSWORD || 'changeme123',
        parseInt(process.env.BCRYPT_ROUNDS) || 12
      );
      
      await connection.execute(
        `INSERT INTO super_admin_users (id, email, password, name, role, active) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com',
          hashedPassword,
          process.env.DEFAULT_ADMIN_NAME || 'Super Admin',
          'super_admin',
          true
        ]
      );
      console.log('✅ Default super admin user created');
    } else {
      console.log('ℹ️ Super admin user already exists');
    }
    
    // Insert default platform settings
    const [existingSettings] = await connection.execute(
      'SELECT id FROM platform_settings WHERE id = 1'
    );
    
    if (existingSettings.length === 0) {
      console.log('⚙️ Creating default platform settings...');
      await connection.execute(
        'INSERT INTO platform_settings (id, settings_json) VALUES (?, ?)',
        [1, JSON.stringify(DEFAULT_PLATFORM_SETTINGS)]
      );
      console.log('✅ Default platform settings created');
    } else {
      console.log('ℹ️ Platform settings already exist');
    }
    
    console.log('🎉 Database setup completed successfully!');
    console.log('');
    console.log('📋 Setup Summary:');
    console.log('- Database tables created');
    console.log(`- Super admin email: ${process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com'}`);
    console.log(`- Super admin password: ${process.env.DEFAULT_ADMIN_PASSWORD || 'changeme123'}`);
    console.log('- Platform settings configured');
    console.log('');
    console.log('🚀 Your application is ready to run!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('');
    console.error('Please check:');
    console.error('1. Database connection details in .env file');
    console.error('2. Database server is running');
    console.error('3. Database user has proper permissions');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = {
  setupDatabase,
  DEFAULT_TENANT_SETTINGS,
  DEFAULT_PLATFORM_SETTINGS
};

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  setupDatabase();
}
