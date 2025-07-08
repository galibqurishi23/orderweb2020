-- Migration to add orderNumber field to orders table and update status enum
-- This script should be run after the existing schema is created

-- Add orderNumber column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS orderNumber VARCHAR(20);

-- Update any existing orders to confirmed status BEFORE changing the enum
UPDATE orders SET status = 'confirmed' WHERE status IN ('pending', 'preparing', 'ready', 'delivered');

-- Now update the status enum to only include 'confirmed' and 'cancelled'
ALTER TABLE orders MODIFY COLUMN status ENUM('confirmed', 'cancelled') NOT NULL;

-- Add unique constraint on orderNumber
ALTER TABLE orders ADD CONSTRAINT unique_order_number UNIQUE (orderNumber);

-- Create index on orderNumber for better performance
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(orderNumber);

-- Add default order numbers for existing orders (if any)
-- This will use a simple pattern for existing orders without proper prefixes
UPDATE orders SET orderNumber = CONCAT('ORD-', LPAD(MOD(ABS(CRC32(id)), 9000) + 1000, 4, '0')) 
WHERE orderNumber IS NULL OR orderNumber = '';
