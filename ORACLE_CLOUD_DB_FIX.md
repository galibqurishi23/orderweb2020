# Oracle Cloud Database Connection Fix

## The Problem
You're getting: `Access denied for user 'orderWeb'@'localhost' to database 'dinedesk_db'`

## Root Cause
The error suggests there's a cached 'orderWeb' user configuration or the database user permissions are not set up correctly.

## Solution Steps

### Step 1: Fix Database User Permissions (Run on Oracle Cloud VM)

```bash
# Connect to MariaDB as root
sudo mysql -u root -p

# Run these SQL commands:
```

```sql
-- Check existing users
SELECT User, Host FROM mysql.user WHERE User IN ('root', 'orderWeb');

-- Remove any problematic orderWeb user
DROP USER IF EXISTS 'orderWeb'@'localhost';
DROP USER IF EXISTS 'orderWeb'@'%';

-- Ensure root user has proper permissions
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;

-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS dinedesk_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant specific database permissions
GRANT ALL PRIVILEGES ON dinedesk_db.* TO 'root'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;

-- Verify permissions
SHOW GRANTS FOR 'root'@'localhost';

-- Exit
EXIT;
```

### Step 2: Update Environment Variables for Production

Create a `.env.production` file on your Oracle Cloud VM:

```bash
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_mariadb_password
DB_NAME=dinedesk_db
DB_PORT=3306

# Application Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secure-secret-key
NODE_ENV=production
```

### Step 3: Test Database Connection

```bash
# Test the connection
node test-oracle-cloud-db.js
```

### Step 4: Clear Cache and Rebuild

```bash
# Clear Next.js cache
rm -rf .next

# Rebuild the application
npm run build

# Start the application
npm start
```

### Step 5: Oracle Cloud VM Setup Checklist

1. **MariaDB Service Status**
   ```bash
   sudo systemctl status mariadb
   sudo systemctl start mariadb  # if not running
   sudo systemctl enable mariadb  # auto-start on boot
   ```

2. **Firewall Configuration**
   ```bash
   # Check firewall status
   sudo ufw status
   
   # Allow MySQL port (if needed for external connections)
   sudo ufw allow 3306
   ```

3. **MariaDB Configuration**
   ```bash
   # Check MariaDB configuration
   sudo cat /etc/mysql/mariadb.conf.d/50-server.cnf
   
   # Ensure bind-address is set correctly
   # bind-address = 127.0.0.1  # for local connections only
   ```

## Alternative: Create Dedicated Database User

If you prefer to create a dedicated user instead of using root:

```sql
-- Create dedicated user
CREATE USER 'orderweb_user'@'localhost' IDENTIFIED BY 'secure_password';

-- Grant database permissions
GRANT ALL PRIVILEGES ON dinedesk_db.* TO 'orderweb_user'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;
```

Then update your `.env.production`:
```bash
DB_USER=orderweb_user
DB_PASSWORD=secure_password
```

## Quick Diagnosis Commands

Run these on your Oracle Cloud VM to diagnose issues:

```bash
# 1. Check if MariaDB is running
sudo systemctl status mariadb

# 2. Test root login
mysql -u root -p

# 3. Check users
mysql -u root -p -e "SELECT User, Host FROM mysql.user;"

# 4. Check databases
mysql -u root -p -e "SHOW DATABASES;"

# 5. Test application database connection
cd /path/to/your/app
node test-oracle-cloud-db.js
```

## Common Issues and Fixes

1. **"Access denied" error**: User doesn't exist or wrong password
   - Fix: Recreate user with proper permissions

2. **"Unknown database" error**: Database doesn't exist
   - Fix: Create database with proper character set

3. **Connection timeout**: Firewall or networking issue
   - Fix: Check firewall and network configuration

4. **Authentication plugin error**: MariaDB authentication method
   - Fix: Use native password authentication

## Files Created for You

1. `oracle-cloud-db-setup.sh` - Database setup script
2. `test-oracle-cloud-db.js` - Connection testing script
3. `.env.production` - Production environment template
4. This troubleshooting guide

## Next Steps

1. Run the database setup script on your Oracle Cloud VM
2. Test the connection with the test script
3. Update your environment variables with actual credentials
4. Deploy and test your application
