#!/bin/bash

echo "Adding gift card color columns to shop_settings table..."

# Add the three gift card color columns to MariaDB
mariadb -u root -p dinedesk_db << 'EOF'

-- Add gift_card_background_color column if it doesn't exist
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_SCHEMA = 'dinedesk_db' 
                     AND TABLE_NAME = 'shop_settings' 
                     AND COLUMN_NAME = 'gift_card_background_color');

SET @sql = IF(@column_exists = 0, 
              'ALTER TABLE shop_settings ADD COLUMN gift_card_background_color VARCHAR(7) DEFAULT "#dbeafe"',
              'SELECT "gift_card_background_color column already exists" as status');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add gift_card_border_color column if it doesn't exist
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_SCHEMA = 'dinedesk_db' 
                     AND TABLE_NAME = 'shop_settings' 
                     AND COLUMN_NAME = 'gift_card_border_color');

SET @sql = IF(@column_exists = 0, 
              'ALTER TABLE shop_settings ADD COLUMN gift_card_border_color VARCHAR(7) DEFAULT "#3b82f6"',
              'SELECT "gift_card_border_color column already exists" as status');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add gift_card_button_color column if it doesn't exist
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_SCHEMA = 'dinedesk_db' 
                     AND TABLE_NAME = 'shop_settings' 
                     AND COLUMN_NAME = 'gift_card_button_color');

SET @sql = IF(@column_exists = 0, 
              'ALTER TABLE shop_settings ADD COLUMN gift_card_button_color VARCHAR(7) DEFAULT "#1d4ed8"',
              'SELECT "gift_card_button_color column already exists" as status');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Show the updated table structure
DESCRIBE shop_settings;

EOF

echo "Gift card color columns migration completed!"
