-- SQLite Multi-tenant Schema for Restaurant Ordering System

-- Super Admin Users
CREATE TABLE IF NOT EXISTS super_admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'support')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tenants (Restaurants)
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'expired')),
    subscription_plan VARCHAR(20) DEFAULT 'starter' CHECK (subscription_plan IN ('starter', 'professional', 'enterprise')),
    subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'cancelled', 'trialing')),
    trial_ends_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tenant Users (Restaurant Staff)
CREATE TABLE IF NOT EXISTS tenant_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('owner', 'manager', 'staff')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE(tenant_id, email)
);

-- Categories (per tenant)
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    `order` INT DEFAULT 0,
    parentId VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (parentId) REFERENCES categories(id) ON DELETE SET NULL
);

-- Menu Items (per tenant)
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
);

-- Vouchers (per tenant)
CREATE TABLE IF NOT EXISTS vouchers (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'amount')),
    value DECIMAL(10, 2) NOT NULL,
    minOrderValue DECIMAL(10, 2) DEFAULT 0,
    maxUses INT DEFAULT NULL,
    usedCount INT DEFAULT 0,
    validFrom DATETIME NOT NULL,
    validUntil DATETIME NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE(tenant_id, code)
);

-- Printers (per tenant)
CREATE TABLE IF NOT EXISTS printers (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    ipAddress VARCHAR(45) NOT NULL,
    port INT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('kitchen', 'receipt', 'bar', 'cashier')),
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Delivery Zones (per tenant)
CREATE TABLE IF NOT EXISTS delivery_zones (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    deliveryFee DECIMAL(10, 2) NOT NULL DEFAULT 0,
    minimumOrder DECIMAL(10, 2) NOT NULL DEFAULT 0,
    coordinates JSON,
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Customers (per tenant)
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Orders (per tenant)
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    customerId VARCHAR(255),
    customerName VARCHAR(255) NOT NULL,
    customerPhone VARCHAR(255),
    customerEmail VARCHAR(255),
    orderType VARCHAR(20) DEFAULT 'delivery' CHECK (orderType IN ('delivery', 'pickup', 'dine-in')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
    items JSON NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    deliveryFee DECIMAL(10, 2) DEFAULT 0,
    tax DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    voucherCode VARCHAR(255),
    address TEXT,
    notes TEXT,
    printed BOOLEAN DEFAULT FALSE,
    isAdvanceOrder BOOLEAN DEFAULT FALSE,
    scheduledFor DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE SET NULL
);

-- Restaurant Settings (per tenant)
CREATE TABLE IF NOT EXISTS restaurant_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id VARCHAR(255) UNIQUE NOT NULL,
    settings JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Insert default super admin user
INSERT OR IGNORE INTO super_admin_users (email, password_hash, name, role) VALUES 
('admin@dinedesk.com', '$2b$10$V8rE2iF4w7eLqWyT8J3.z.7m8%Kf6LpQ9nX2vYt5.uheWG/igi', 'Super Admin', 'super_admin');

-- Insert demo restaurants
INSERT OR IGNORE INTO tenants (id, name, slug, email, phone, address, status, subscription_plan, subscription_status) VALUES 
('demo-restaurant', 'Demo Restaurant', 'demo-restaurant', 'demo@restaurant.com', '+1234567890', '123 Demo Street, Demo City', 'active', 'professional', 'active'),
('babur', 'Babur Restaurant', 'babur', 'babur@restaurant.com', '+1234567891', '456 Babur Street, Restaurant City', 'active', 'starter', 'active'),
('test-cafe', 'Test Cafe', 'test-cafe', 'test@cafe.com', '+1234567892', '789 Test Avenue, Cafe Town', 'active', 'enterprise', 'active');

-- Insert tenant admin users
INSERT OR IGNORE INTO tenant_users (tenant_id, email, password_hash, name, role) VALUES 
('demo-restaurant', 'admin@demo-restaurant.com', '$2b$10$V8rE2iF4w7eLqWyT8J3.z.7m8%Kf6LpQ9nX2vYt5.uheWG/igi', 'Demo Admin', 'owner'),
('babur', 'admin@babur.com', '$2b$10$V8rE2iF4w7eLqWyT8J3.z.7m8%Kf6LpQ9nX2vYt5.uheWG/igi', 'Babur Admin', 'owner'),
('test-cafe', 'admin@test-cafe.com', '$2b$10$V8rE2iF4w7eLqWyT8J3.z.7m8%Kf6LpQ9nX2vYt5.uheWG/igi', 'Test Admin', 'owner');

-- Insert default restaurant settings for each tenant
INSERT OR IGNORE INTO restaurant_settings (tenant_id, settings) VALUES 
('demo-restaurant', '{"name": "Demo Restaurant", "currency": "USD", "theme": {"primary": "224 82% 57%", "primaryForeground": "210 40% 98%", "background": "210 40% 98%", "accent": "210 40% 94%"}}'),
('babur', '{"name": "Babur Restaurant", "currency": "USD", "theme": {"primary": "224 82% 57%", "primaryForeground": "210 40% 98%", "background": "210 40% 98%", "accent": "210 40% 94%"}}'),
('test-cafe', '{"name": "Test Cafe", "currency": "USD", "theme": {"primary": "224 82% 57%", "primaryForeground": "210 40% 98%", "background": "210 40% 98%", "accent": "210 40% 94%"}}');

-- Sample categories for demo data
INSERT OR IGNORE INTO categories (id, tenant_id, name, description, active, `order`) VALUES 
('cat-demo-pizzas', 'demo-restaurant', 'Pizzas', 'Our delicious pizza selection', TRUE, 1),
('cat-demo-drinks', 'demo-restaurant', 'Drinks', 'Refreshing beverages', TRUE, 2),
('cat-babur-mains', 'babur', 'Main Dishes', 'Traditional main courses', TRUE, 1),
('cat-babur-appetizers', 'babur', 'Appetizers', 'Start your meal right', TRUE, 2),
('cat-cafe-coffee', 'test-cafe', 'Coffee', 'Freshly brewed coffee', TRUE, 1),
('cat-cafe-pastries', 'test-cafe', 'Pastries', 'Fresh baked goods', TRUE, 2);

-- Sample menu items
INSERT OR IGNORE INTO menu_items (id, tenant_id, name, description, price, available, categoryId) VALUES 
('item-demo-margherita', 'demo-restaurant', 'Margherita Pizza', 'Fresh tomatoes, mozzarella, and basil', 18.99, TRUE, 'cat-demo-pizzas'),
('item-demo-pepperoni', 'demo-restaurant', 'Pepperoni Pizza', 'Classic pepperoni with extra cheese', 22.99, TRUE, 'cat-demo-pizzas'),
('item-demo-coke', 'demo-restaurant', 'Coca Cola', 'Classic Coca Cola', 2.99, TRUE, 'cat-demo-drinks'),
('item-babur-biryani', 'babur', 'Chicken Biryani', 'Fragrant basmati rice with tender chicken', 24.99, TRUE, 'cat-babur-mains'),
('item-babur-samosa', 'babur', 'Vegetable Samosa', 'Crispy pastry with spiced vegetables', 6.99, TRUE, 'cat-babur-appetizers'),
('item-cafe-latte', 'test-cafe', 'Caffe Latte', 'Espresso with steamed milk', 4.50, TRUE, 'cat-cafe-coffee'),
('item-cafe-croissant', 'test-cafe', 'Butter Croissant', 'Flaky French pastry', 3.99, TRUE, 'cat-cafe-pastries');
