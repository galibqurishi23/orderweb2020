# OrderWeb - Multi-Tenant Restaurant Management System

## Quick Setup for Web Hosting

### 1. Get Your Files Ready
- Download all project files
- Upload to your web hosting server

### 2. Setup Environment
```bash
# Create configuration
npm run setup-hosting

# Follow the on-screen instructions to configure .env file
```

### 3. Install and Deploy
```bash
# Install dependencies
npm install

# Setup database and build
npm run setup-production

# Start application
npm start
```

### 4. Access Your System
- **Health Check**: `https://yourdomain.com/api/health`
- **Super Admin**: `https://yourdomain.com/super-admin`
- **Default Login**: admin@yourdomain.com / changeme123

## System Requirements

### Web Hosting Requirements
- **Node.js 18+** support
- **MySQL/MariaDB** database
- **SSL certificate** (recommended)
- **1GB+ RAM** (minimum)
- **SSH/Terminal access** (for setup)

### Compatible Hosting Providers
- ✅ Hostinger (Node.js hosting)
- ✅ A2 Hosting (Node.js support)
- ✅ GoDaddy (VPS with Node.js)
- ✅ SiteGround (Cloud hosting)
- ✅ DigitalOcean (VPS)
- ✅ Linode (VPS)
- ⚠️ Shared hosting may have limitations

## Features

### Multi-Tenant System
- Multiple restaurants on one platform
- Separate admin panels for each restaurant
- Isolated data and settings

### Restaurant Management
- Menu management with categories
- Order processing and tracking
- Customer management
- Delivery zone configuration
- Voucher/discount system
- Opening hours configuration

### Order System
- Online ordering
- Advance order scheduling
- Multiple payment methods
- Order status tracking
- Receipt printing

### Admin Features
- Dashboard with statistics
- Order management
- Customer analytics
- Settings configuration
- User management

## Database Tables (Auto-Created)

The system automatically creates these tables:
- `tenants` - Restaurant information
- `tenant_users` - Restaurant admin users
- `tenant_settings` - Restaurant configurations
- `customers` - Customer accounts
- `categories` - Menu categories
- `menu_items` - Menu items and pricing
- `orders` - Order management
- `order_items` - Order line items
- `delivery_zones` - Delivery areas
- `vouchers` - Discount codes
- `printers` - Printer configurations
- `super_admin_users` - Platform administrators
- `platform_settings` - System configuration

## Security Features

- Password hashing with bcrypt
- JWT authentication
- Input validation
- SQL injection protection
- XSS protection
- CSRF protection
- Rate limiting
- Secure session management

## Support

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

### Common Issues
1. **Database connection failed** - Check credentials in .env
2. **Application won't start** - Verify Node.js version
3. **Permission errors** - Check file permissions
4. **Domain issues** - Verify DNS settings

### Getting Help
- Check the health endpoint: `/api/health`
- Review hosting provider documentation
- Verify environment configuration
- Test database connectivity

## Updates

To update the application:
1. Backup your database
2. Upload new files
3. Run `npm install`
4. Run `npm run build`
5. Restart the application

---

**🚀 Ready to deploy your restaurant management system!**
