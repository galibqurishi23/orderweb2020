-- Database Schema for DineDesk

-- This script creates all necessary tables for the application to run.
-- It is designed to be run once on a new, empty database.
-- The application will automatically execute this script if it detects an uninitialized database.

-- Categories Table: Stores menu categories and sub-categories.
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    `order` INT DEFAULT 0,
    parentId VARCHAR(255),
    FOREIGN KEY (parentId) REFERENCES categories(id) ON DELETE CASCADE
);

-- Menu Items Table: Stores all individual menu items.
CREATE TABLE IF NOT EXISTS menu_items (
    id VARCHAR(255) PRIMARY KEY,
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
    FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
);

-- Vouchers Table: Stores discount codes and promotions.
CREATE TABLE IF NOT EXISTS vouchers (
    id VARCHAR(255) PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    type ENUM('percentage', 'amount') NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    minOrder DECIMAL(10, 2) DEFAULT 0,
    maxDiscount DECIMAL(10, 2),
    expiryDate DATE NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    usageLimit INT,
    usedCount INT DEFAULT 0
);

-- Delivery Zones Table: Stores delivery areas and associated fees/times.
CREATE TABLE IF NOT EXISTS delivery_zones (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    postcodes JSON,
    deliveryFee DECIMAL(10, 2) NOT NULL,
    minOrder DECIMAL(10, 2) NOT NULL,
    deliveryTime INT NOT NULL,
    collectionTime INT NOT NULL
);

-- Printers Table: Stores configuration for physical printers.
CREATE TABLE IF NOT EXISTS printers (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ipAddress VARCHAR(45) NOT NULL,
    port INT NOT NULL,
    type ENUM('kitchen', 'receipt', 'bar', 'dot-matrix', 'label') NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

-- Restaurant Settings Table: A single row to store all restaurant configuration.
CREATE TABLE IF NOT EXISTS restaurant_settings (
    id INT PRIMARY KEY,
    settings_json JSON
);

-- Customers Table: Stores customer information.
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password VARCHAR(255) NOT NULL
);

-- Addresses Table: Stores customer addresses, linked to a customer.
CREATE TABLE IF NOT EXISTS addresses (
    id VARCHAR(255) PRIMARY KEY,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postcode VARCHAR(20) NOT NULL,
    isDefault BOOLEAN DEFAULT FALSE,
    customerId VARCHAR(255) NOT NULL,
    FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE
);

-- Orders Table: Stores all order information.
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(255) PRIMARY KEY,
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
    FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE SET NULL
);

-- Order Items Table: Links menu items to an order.
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId VARCHAR(255) NOT NULL,
    menuItemId VARCHAR(255),
    quantity INT NOT NULL,
    selectedAddons JSON,
    specialInstructions TEXT,
    FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menuItemId) REFERENCES menu_items(id) ON DELETE SET NULL
);


-- Default Settings Insertion
-- A single row of default settings is inserted to ensure the application can run on a fresh database.
-- All other tables will be empty.
INSERT INTO restaurant_settings (id, settings_json) VALUES (1, '{
    "name": "DineDesk Bistro",
    "description": "A cozy spot serving modern European cuisine with a twist.",
    "logo": "https://placehold.co/200x200.png",
    "logoHint": "restaurant logo",
    "coverImage": "https://placehold.co/1600x400.png",
    "coverImageHint": "restaurant interior",
    "currency": "GBP",
    "taxRate": 0.2,
    "website": "https://www.dinedesk.com",
    "phone": "0123 456 7890",
    "email": "contact@dinedesk.com",
    "address": "123 Culinary Lane, London, W1A 1AA, United Kingdom",
    "orderPrefix": "ORD",
    "advanceOrderPrefix": "ADV",
    "openingHours": {
        "monday": {"morningOpen": "09:00", "morningClose": "14:00", "eveningOpen": "17:00", "eveningClose": "22:00", "closed": false},
        "tuesday": {"morningOpen": "09:00", "morningClose": "14:00", "eveningOpen": "17:00", "eveningClose": "22:00", "closed": false},
        "wednesday": {"morningOpen": "09:00", "morningClose": "14:00", "eveningOpen": "17:00", "eveningClose": "22:00", "closed": false},
        "thursday": {"morningOpen": "09:00", "morningClose": "14:00", "eveningOpen": "17:00", "eveningClose": "22:00", "closed": false},
        "friday": {"morningOpen": "09:00", "morningClose": "14:00", "eveningOpen": "17:00", "eveningClose": "23:00", "closed": false},
        "saturday": {"morningOpen": "10:00", "morningClose": "15:00", "eveningOpen": "17:00", "eveningClose": "23:00", "closed": false},
        "sunday": {"morningOpen": "11:00", "morningClose": "16:00", "eveningOpen": "", "eveningClose": "", "closed": false}
    },
    "orderThrottling": {
        "monday": {"interval": 15, "ordersPerInterval": 10, "enabled": false},
        "tuesday": {"interval": 15, "ordersPerInterval": 10, "enabled": false},
        "wednesday": {"interval": 15, "ordersPerInterval": 10, "enabled": false},
        "thursday": {"interval": 15, "ordersPerInterval": 10, "enabled": false},
        "friday": {"interval": 15, "ordersPerInterval": 10, "enabled": false},
        "saturday": {"interval": 15, "ordersPerInterval": 10, "enabled": false},
        "sunday": {"interval": 15, "ordersPerInterval": 10, "enabled": false}
    },
    "paymentSettings": {
        "cash": {"enabled": true},
        "stripe": {"enabled": false, "apiKey": "", "apiSecret": ""},
        "globalPayments": {"enabled": false, "merchantId": "", "apiSecret": ""},
        "worldpay": {"enabled": false, "apiKey": "", "merchantId": ""}
    },
    "orderTypeSettings": {
        "deliveryEnabled": true,
        "advanceOrderEnabled": true,
        "collectionEnabled": true
    },
    "theme": {
        "primary": "224 82% 57%",
        "primaryForeground": "210 40% 98%",
        "background": "210 40% 98%",
        "accent": "210 40% 94%"
    }
}')
ON DUPLICATE KEY UPDATE settings_json=VALUES(settings_json);
