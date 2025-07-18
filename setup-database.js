#!/usr/bin/env node

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
    console.log(color + message + colors.reset);
}

// Database schema
const schema = `
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS ?? DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ??;

-- Super admin users table
CREATE TABLE IF NOT EXISTS super_admin_users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(255) PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    status ENUM('active', 'inactive', 'suspended', 'trial') DEFAULT 'trial',
    subscription_plan VARCHAR(50) DEFAULT 'starter',
    subscription_status ENUM('active', 'trialing', 'past_due', 'canceled', 'unpaid') DEFAULT 'trialing',
    trial_ends_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tenant users table
CREATE TABLE IF NOT EXISTS tenant_users (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'staff') DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tenant_email (tenant_id, email)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    active TINYINT(1) DEFAULT 1,
    display_order INT DEFAULT 0,
    parentId VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    image LONGTEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (parentId) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_tenant_categories (tenant_id),
    INDEX idx_category_parent (parentId)
);

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    category_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image LONGTEXT,
    image_hint VARCHAR(255),
    available TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_tenant_menu_items (tenant_id),
    INDEX idx_menu_item_category (category_id)
);

-- Addon groups table
CREATE TABLE IF NOT EXISTS addon_groups (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    required TINYINT(1) DEFAULT 0,
    multiple TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_tenant_addon_groups (tenant_id)
);

-- Addon options table
CREATE TABLE IF NOT EXISTS addon_options (
    id VARCHAR(255) PRIMARY KEY,
    addon_group_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (addon_group_id) REFERENCES addon_groups(id) ON DELETE CASCADE,
    INDEX idx_addon_group_options (addon_group_id)
);

-- Menu item addon groups junction table
CREATE TABLE IF NOT EXISTS menu_item_addon_groups (
    menu_item_id VARCHAR(255) NOT NULL,
    addon_group_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (menu_item_id, addon_group_id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    FOREIGN KEY (addon_group_id) REFERENCES addon_groups(id) ON DELETE CASCADE
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    password VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_tenant_customers (tenant_id),
    INDEX idx_customer_email (email),
    INDEX idx_customer_phone (phone)
);

-- Addresses table
CREATE TABLE IF NOT EXISTS addresses (
    id VARCHAR(255) PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    type ENUM('delivery', 'billing') DEFAULT 'delivery',
    street_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'UK',
    is_default TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer_addresses (customer_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    customer_id VARCHAR(255),
    order_number VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    order_type ENUM('dine_in', 'takeaway', 'delivery') NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
    total DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    address TEXT,
    special_instructions TEXT,
    payment_method VARCHAR(50) DEFAULT 'cash',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    is_advance_order TINYINT(1) DEFAULT 0,
    scheduled_time TIMESTAMP NULL,
    printed TINYINT(1) DEFAULT 0,
    voucher_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    INDEX idx_tenant_orders (tenant_id),
    INDEX idx_order_number (order_number),
    INDEX idx_order_status (status),
    INDEX idx_order_date (created_at)
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    menu_item_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL,
    INDEX idx_order_items (order_id)
);

-- Vouchers table
CREATE TABLE IF NOT EXISTS vouchers (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('percentage', 'fixed') NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    minimum_order DECIMAL(10, 2) DEFAULT 0,
    maximum_discount DECIMAL(10, 2),
    usage_limit INT,
    used_count INT DEFAULT 0,
    active TINYINT(1) DEFAULT 1,
    starts_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tenant_code (tenant_id, code),
    INDEX idx_tenant_vouchers (tenant_id),
    INDEX idx_voucher_code (code)
);

-- Delivery zones table
CREATE TABLE IF NOT EXISTS delivery_zones (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    postcodes TEXT NOT NULL,
    delivery_fee DECIMAL(10, 2) NOT NULL,
    minimum_order DECIMAL(10, 2) DEFAULT 0,
    delivery_time INT DEFAULT 30,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_tenant_zones (tenant_id)
);

-- Printers table
CREATE TABLE IF NOT EXISTS printers (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('receipt', 'kitchen', 'bar') DEFAULT 'receipt',
    ip_address VARCHAR(45),
    port INT DEFAULT 9100,
    enabled TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_tenant_printers (tenant_id)
);

-- Tenant settings table
CREATE TABLE IF NOT EXISTS tenant_settings (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    settings_json LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tenant_settings (tenant_id)
);

-- Restaurant settings table
CREATE TABLE IF NOT EXISTS restaurant_settings (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    settings_json LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_restaurant_settings (tenant_id)
);

-- Platform settings table
CREATE TABLE IF NOT EXISTS platform_settings (
    id VARCHAR(255) PRIMARY KEY,
    key_name VARCHAR(255) UNIQUE NOT NULL,
    value LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Billing table
CREATE TABLE IF NOT EXISTS billing (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    plan VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GBP',
    billing_period ENUM('monthly', 'yearly') DEFAULT 'monthly',
    status ENUM('active', 'cancelled', 'past_due') DEFAULT 'active',
    next_billing_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_tenant_billing (tenant_id)
);

-- Set menu templates table
CREATE TABLE IF NOT EXISTS set_menu_templates (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    items JSON NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_tenant_set_menus (tenant_id)
);
`;

async function createDatabase(host, port, user, password, database) {
    let connection;
    
    try {
        log('🔗 Connecting to MySQL server...', colors.blue);
        
        // First connect without database to create it
        connection = await mysql.createConnection({
            host: host,
            port: port,
            user: user,
            password: password,
            multipleStatements: true
        });
        
        log('✅ Connected to MySQL server successfully!', colors.green);
        
        // Create database and tables
        log('🗄️ Creating database and tables...', colors.blue);
        await connection.query(schema, [database, database]);
        
        log('✅ Database and tables created successfully!', colors.green);
        
        // Create default super admin
        const bcrypt = require('bcryptjs');
        const adminId = 'super-admin-' + Date.now();
        const hashedPassword = await bcrypt.hash('admin123', 12);
        
        await connection.query(
            `INSERT IGNORE INTO ${database}.super_admin_users (id, name, email, password) VALUES (?, ?, ?, ?)`,
            [adminId, 'Super Admin', 'admin@restaurant.com', hashedPassword]
        );
        
        log('✅ Default super admin created!', colors.green);
        log('   Email: admin@restaurant.com', colors.cyan);
        log('   Password: admin123', colors.cyan);
        log('   (Please change this password after first login)', colors.yellow);
        
        await connection.end();
        
        return true;
        
    } catch (error) {
        log('❌ Database setup failed:', colors.red);
        log(error.message, colors.red);
        
        if (connection) {
            await connection.end();
        }
        
        return false;
    }
}

async function updateEnvFile(host, port, user, password, database) {
    try {
        log('📝 Updating .env file...', colors.blue);
        
        const envContent = `# Database Configuration
DB_HOST=${host}
DB_USER=${user}
DB_PASSWORD=${password}
DB_NAME=${database}
DB_PORT=${port}

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-${Date.now()}

# Production Domain (change this for your deployment)
PRODUCTION_DOMAIN=yourdomain.com

# Email Configuration (Optional - for notifications)
EMAIL_SERVICE=disabled

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# Security Configuration
BCRYPT_ROUNDS=12
JWT_EXPIRES_IN=24h

# System Configuration
NODE_ENV=development
PORT=3000

# Default Super Admin (created during setup)
DEFAULT_ADMIN_EMAIL=admin@restaurant.com
DEFAULT_ADMIN_PASSWORD=admin123
DEFAULT_ADMIN_NAME=Super Admin
`;
        
        await fs.promises.writeFile('.env', envContent);
        log('✅ .env file updated successfully!', colors.green);
        
    } catch (error) {
        log('❌ Failed to update .env file:', colors.red);
        log(error.message, colors.red);
    }
}

async function main() {
    log('🚀 OrderWeb Restaurant - Database Setup', colors.bright + colors.magenta);
    log('=====================================', colors.magenta);
    
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    const question = (query) => new Promise((resolve) => readline.question(query, resolve));
    
    try {
        log('\\nPlease provide your database connection details:', colors.cyan);
        
        const host = await question('Database Host (default: localhost): ') || 'localhost';
        const port = parseInt(await question('Database Port (default: 3306): ') || '3306');
        const user = await question('Database User (default: root): ') || 'root';
        const password = await question('Database Password: ');
        const database = await question('Database Name (default: orderwebdb): ') || 'orderwebdb';
        
        log('\\n🔧 Setting up your database...', colors.blue);
        
        const success = await createDatabase(host, port, user, password, database);
        
        if (success) {
            await updateEnvFile(host, port, user, password, database);
            
            log('\\n🎉 Setup completed successfully!', colors.green + colors.bright);
            log('\\nNext steps:', colors.cyan);
            log('1. Run: npm run dev', colors.white);
            log('2. Visit: http://localhost:9002', colors.white);
            log('3. Health check: http://localhost:9002/api/health', colors.white);
            log('4. Login to super admin: http://localhost:9002/super-admin', colors.white);
            log('5. Create your first restaurant', colors.white);
            
        } else {
            log('\\n❌ Setup failed. Please check your database credentials and try again.', colors.red);
        }
        
    } catch (error) {
        log('\\n❌ Setup failed:', colors.red);
        log(error.message, colors.red);
    }
    
    readline.close();
}

if (require.main === module) {
    main();
}
