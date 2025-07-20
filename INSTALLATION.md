# OrderWeb Restaurant System - Production Installation Guide

## Quick Installation for Oracle Linux

This guide helps you deploy the OrderWeb Restaurant System on Oracle Linux without Docker.

### Prerequisites

1. **Oracle Linux** with root/sudo access
2. **MySQL/MariaDB** server running
3. **Node.js 18+** and npm

### System Setup (Oracle Linux)

```bash
# Update system
sudo dnf update -y

# Install Node.js 18+
sudo dnf install -y nodejs npm

# Install MySQL client
sudo dnf install -y mysql

# Install Git (if needed)
sudo dnf install -y git
```

### Quick Installation

1. **Extract/Upload** the application files to your server

2. **Configure Database**:
   ```bash
   # Edit the production environment file
   nano .env.production
   ```

   Update these essential values:
   ```bash
   # Your database credentials
   DB_HOST=localhost
   DB_USER=your_db_username  
   DB_PASSWORD=your_db_password
   DB_NAME=orderweb_production

   # Your domain
   PRODUCTION_DOMAIN=yourdomain.com
   NEXTAUTH_URL=https://yourdomain.com

   # Generate a secure secret
   NEXTAUTH_SECRET=your-super-secure-random-string-here

   # Admin credentials
   SUPER_ADMIN_EMAIL=admin@yourdomain.com
   SUPER_ADMIN_PASSWORD=secure_admin_password
   ```

3. **Run Deployment Script**:
   ```bash
   chmod +x deploy-production.sh
   ./deploy-production.sh
   ```

   The script will automatically:
   - Check system requirements
   - Install dependencies  
   - Setup database
   - Build the application
   - Configure systemd service (optional)

4. **Start the Application**:
   ```bash
   # Manual start
   npm start

   # Or using systemd (if configured)
   sudo systemctl start orderweb
   ```

### Manual Installation (Alternative)

If you prefer manual installation:

```bash
# 1. Install dependencies
npm ci --only=production

# 2. Copy environment config
cp .env.production .env

# 3. Setup database
npm run setup

# 4. Build application
npm run build

# 5. Start application
npm start
```

### Database Configuration

The system supports both environment variable formats:
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (primary)
- `DATABASE_HOST`, `DATABASE_USER`, etc. (alternative)

### Production Checklist

- [ ] Database credentials configured
- [ ] Domain and URLs updated
- [ ] Secure NEXTAUTH_SECRET generated
- [ ] Admin credentials set
- [ ] Firewall configured (port 3000)
- [ ] SSL certificate configured
- [ ] Reverse proxy setup (nginx/apache)
- [ ] Database backups scheduled

### Reverse Proxy Setup (nginx example)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Application Management

```bash
# Check application status
sudo systemctl status orderweb

# View logs
sudo journalctl -u orderweb -f

# Restart application
sudo systemctl restart orderweb

# Health check
npm run health-check
```

### Security Recommendations

1. **Change all default passwords**
2. **Use HTTPS with SSL certificate**
3. **Configure firewall properly**
4. **Regular database backups**
5. **Monitor application logs**
6. **Keep system updated**

### Troubleshooting

**Database Connection Issues:**
```bash
# Test database connection
mysql -h localhost -u your_username -p your_database_name
```

**Application Won't Start:**
```bash
# Check logs
sudo journalctl -u orderweb -n 50

# Check port availability
netstat -tulpn | grep 3000
```

**Permission Issues:**
```bash
# Fix file permissions
chown -R $USER:$USER /path/to/app
chmod -R 755 /path/to/app
```

### Support

- Check logs: `sudo journalctl -u orderweb -f`
- Database health: `npm run health-check`
- System status: `sudo systemctl status orderweb`

---

The application will be available at `http://your-server-ip:3000` or your configured domain.

Default admin login will be available at `/super-admin` with the credentials you set in `.env.production`.
