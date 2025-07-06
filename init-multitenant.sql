-- Multi-Tenant Database Schema for DineDesk SaaS Platform

-- This script creates all necessary tables for a multi-tenant restaurant ordering platform.
-- It supports Super Admin management and tenant-isolated data.

-- Super Admin Users Table: Platform administrators
CREATE TABLE IF NOT EXISTS super_admin_users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'support') DEFAULT 'super_admin',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tenants/Restaurants Table: Each restaurant is a tenant
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(255) PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL, -- Used in URL: /{slug}/
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    status ENUM('active', 'suspended', 'trial', 'cancelled') DEFAULT 'trial',
    subscription_plan ENUM('starter', 'professional', 'enterprise') DEFAULT 'starter',
    subscription_status ENUM('active', 'past_due', 'cancelled', 'trialing') DEFAULT 'trialing',
    trial_ends_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tenant Users Table: Restaurant staff/owners
CREATE TABLE IF NOT EXISTS tenant_users (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('owner', 'manager', 'staff') DEFAULT 'staff',
    permissions JSON, -- Granular permissions for different features
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_email_per_tenant (tenant_id, email)
);

-- Tenant Settings Table: Restaurant-specific configuration
CREATE TABLE IF NOT EXISTS tenant_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(255) UNIQUE NOT NULL,
    settings_json JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Categories Table: Now tenant-aware
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    `order` INT DEFAULT 0,
    parentId VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (parentId) REFERENCES categories(id) ON DELETE CASCADE
);

-- Menu Items Table: Now tenant-aware
CREATE TABLE IF NOT EXISTS menu_items (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    imageUrl VARCHAR(1024),
    imageHint VARCHAR(255),
    available BOOLEAN DEFAULT TRUE,
    categoryId VARCHAR(255),
    addons JSON,
    characteristics JSON,
    nutrition JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
);

-- Vouchers Table: Now tenant-aware
CREATE TABLE IF NOT EXISTS vouchers (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    code VARCHAR(255) NOT NULL,
    type ENUM('percentage', 'amount') NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    minOrder DECIMAL(10, 2) DEFAULT 0,
    maxDiscount DECIMAL(10, 2),
    expiryDate DATE NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    usageLimit INT,
    usedCount INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_code_per_tenant (tenant_id, code)
);

-- Delivery Zones Table: Now tenant-aware
CREATE TABLE IF NOT EXISTS delivery_zones (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    postcodes JSON,
    deliveryFee DECIMAL(10, 2) NOT NULL,
    minOrder DECIMAL(10, 2) NOT NULL,
    deliveryTime INT NOT NULL,
    collectionTime INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Printers Table: Now tenant-aware
CREATE TABLE IF NOT EXISTS printers (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    ipAddress VARCHAR(45) NOT NULL,
    port INT NOT NULL,
    type ENUM('kitchen', 'receipt', 'bar', 'dot-matrix', 'label') NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Customers Table: Now tenant-aware
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
    UNIQUE KEY unique_email_per_tenant (tenant_id, email)
);

-- Addresses Table: Now tenant-aware
CREATE TABLE IF NOT EXISTS addresses (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postcode VARCHAR(20) NOT NULL,
    isDefault BOOLEAN DEFAULT FALSE,
    customerId VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE
);

-- Orders Table: Now tenant-aware
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    customerName VARCHAR(255),
    customerPhone VARCHAR(50),
    customerEmail VARCHAR(255),
    address TEXT,
    total DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') NOT NULL,
    orderType ENUM('delivery', 'pickup', 'advance', 'collection') NOT NULL,
    isAdvanceOrder BOOLEAN DEFAULT FALSE,
    scheduledTime DATETIME,
    subtotal DECIMAL(10, 2) NOT NULL,
    deliveryFee DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    tax DECIMAL(10, 2) NOT NULL,
    voucherCode VARCHAR(255),
    printed BOOLEAN DEFAULT FALSE,
    customerId VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE SET NULL
);

-- Order Items Table: Now tenant-aware
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    orderId VARCHAR(255) NOT NULL,
    menuItemId VARCHAR(255),
    quantity INT NOT NULL,
    selectedAddons JSON,
    specialInstructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menuItemId) REFERENCES menu_items(id) ON DELETE SET NULL
);

-- Billing Table: Track subscription and payment history
CREATE TABLE IF NOT EXISTS billing (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    subscription_plan ENUM('starter', 'professional', 'enterprise') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GBP',
    billing_period_start DATETIME NOT NULL,
    billing_period_end DATETIME NOT NULL,
    status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL,
    payment_method VARCHAR(50),
    stripe_invoice_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Platform Settings Table: Global platform configuration
CREATE TABLE IF NOT EXISTS platform_settings (
    id INT PRIMARY KEY DEFAULT 1,
    settings_json JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default Super Admin user (password should be hashed in production)
INSERT INTO super_admin_users (id, email, password, name, role) VALUES 
('super-admin-1', 'admin@dinedesk.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super Admin', 'super_admin')
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- Insert default platform settings
INSERT INTO platform_settings (id, settings_json) VALUES (1, '{
    "platformName": "DineDesk SaaS",
    "defaultCurrency": "GBP",
    "allowedCurrencies": ["GBP", "USD", "EUR"],
    "subscriptionPlans": {
        "starter": {
            "name": "Starter",
            "monthlyPrice": 29,
            "features": ["Up to 100 orders/month", "Basic support", "Standard themes"]
        },
        "professional": {
            "name": "Professional", 
            "monthlyPrice": 79,
            "features": ["Up to 1000 orders/month", "Priority support", "Custom themes", "Advanced analytics"]
        },
        "enterprise": {
            "name": "Enterprise",
            "monthlyPrice": 199,
            "features": ["Unlimited orders", "24/7 support", "White label", "API access", "Custom integrations"]
        }
    },
    "trialPeriodDays": 14,
    "defaultTheme": {
        "primary": "224 82% 57%",
        "primaryForeground": "210 40% 98%",
        "background": "210 40% 98%",
        "accent": "210 40% 94%"
    }
}')
ON DUPLICATE KEY UPDATE settings_json=VALUES(settings_json);

-- Indexes for performance
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX idx_categories_tenant_id ON categories(tenant_id);
CREATE INDEX idx_menu_items_tenant_id ON menu_items(tenant_id);
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(createdAt);
CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
