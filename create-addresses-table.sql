-- Create addresses table if it doesn't exist
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
    INDEX idx_customer_addresses (customer_id)
);

-- Insert sample address for testing if table is empty
INSERT IGNORE INTO addresses (id, customer_id, type, street_address, city, postal_code, country, is_default) 
VALUES 
('addr_test_1', 'cust_test_123', 'delivery', '123 Test Street', 'London', 'SW1A 1AA', 'United Kingdom', 1);

-- Show the table structure
DESCRIBE addresses;

-- Show any existing data
SELECT * FROM addresses LIMIT 5;
