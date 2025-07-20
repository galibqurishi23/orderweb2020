#!/bin/bash
# Oracle Cloud Database Setup Script
# Run this script on your Oracle Cloud VM to set up the database properly

echo "=== Oracle Cloud MariaDB Setup for OrderWeb ==="
echo

# 1. Create the database and user
echo "Setting up database and user permissions..."
mysql -u root -p << 'EOF'

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS dinedesk_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create or update the orderWeb user (this might be where the issue is)
-- First, let's drop the user if it exists and create it fresh
DROP USER IF EXISTS 'orderWeb'@'localhost';
DROP USER IF EXISTS 'orderWeb'@'%';

-- Create the root user permissions (recommended for production)
-- Make sure root can connect from localhost
CREATE USER IF NOT EXISTS 'root'@'localhost' IDENTIFIED BY 'your_new_password_here';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;

-- Alternative: Create a dedicated orderWeb user
-- CREATE USER 'orderWeb'@'localhost' IDENTIFIED BY 'your_secure_password';
-- GRANT ALL PRIVILEGES ON dinedesk_db.* TO 'orderWeb'@'localhost';

-- Grant all privileges on the specific database
GRANT ALL PRIVILEGES ON dinedesk_db.* TO 'root'@'localhost';

-- Flush privileges to ensure changes take effect
FLUSH PRIVILEGES;

-- Show users to verify
SELECT User, Host FROM mysql.user WHERE User IN ('root', 'orderWeb');

-- Show database
SHOW DATABASES;

EOF

echo
echo "Database setup completed!"
echo
echo "Next steps:"
echo "1. Update your .env file with the correct credentials"
echo "2. Make sure your Oracle Cloud firewall allows port 3306"
echo "3. Test the connection from your application"
