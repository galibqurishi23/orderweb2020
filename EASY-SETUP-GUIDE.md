# Easy Setup Guide for OrderWeb

This guide will help you quickly set up OrderWeb on your Oracle VM or any Linux server.

## Quick Setup Steps

1. **Copy Files to Server**
   ```bash
   scp easy-setup.sh your-username@your-vm-ip:/path/to/application/
   ```

2. **Make Script Executable**
   ```bash
   chmod +x easy-setup.sh
   ```

3. **Run Setup Script**
   ```bash
   ./easy-setup.sh
   ```

## What the Script Does

1. Creates all necessary directories
2. Sets up the .env file with your database configuration
3. Installs dependencies
4. Sets up the database with all required tables
5. Builds the application

## Default Credentials

After setup, you can login with:
- **URL**: http://your-vm-ip:3000/super-admin
- **Email**: admin@dinedesk.com
- **Password**: admin123

⚠️ **Important**: Change these credentials after first login!

## Directory Structure Created

```
your-app/
├── public/
│   └── uploads/
│       ├── logos/     (for restaurant logos)
│       ├── menus/     (for menu images)
│       └── products/  (for product images)
└── ... (other app files)
```

## Database Tables Created

- super_admin_users
- tenants
- tenant_users
- menu_items
- orders
- settings
(and other necessary tables)

## Troubleshooting

If you encounter any issues:

1. **Database Connection Issues**
   ```bash
   # Check if MariaDB is running
   sudo systemctl status mariadb
   
   # Test database connection
   mysql -u orderWeb -p'orderWeb123' -h localhost order_web
   ```

2. **Permission Issues**
   ```bash
   # Fix directory permissions
   sudo chown -R $USER:$USER /path/to/application
   sudo chmod -R 755 public/uploads
   ```

3. **Port Already in Use**
   ```bash
   # Check what's using port 3000
   sudo lsof -i :3000
   
   # Kill the process if needed
   sudo kill -9 <PID>
   ```

## Next Steps After Setup

1. Change the default admin password
2. Configure your domain name (if any)
3. Set up SSL/HTTPS
4. Configure email settings (if needed)
5. Set up regular backups

Need help? Contact support or check the main documentation.
