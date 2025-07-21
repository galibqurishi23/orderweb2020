# Oracle VM Deployment Guide for OrderWeb

## Prerequisites
- Oracle VM with Ubuntu/Linux
- Node.js 16+ installed
- MySQL/MariaDB installed
- Nginx installed
- PM2 for process management

## Step 1: Install Required Software (Run as root or with sudo)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x if not installed
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install build tools
sudo apt install -y build-essential

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -p pm2@latest -g

# Install MySQL if not installed
sudo apt install -y mysql-server
```

## Step 2: Setup MySQL Database

```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Login to MySQL
sudo mysql

# Create database and user (in MySQL prompt)
CREATE DATABASE order_web;
CREATE USER 'orderWeb'@'localhost' IDENTIFIED BY 'orderWeb123';
GRANT ALL PRIVILEGES ON order_web.* TO 'orderWeb'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Step 3: Deploy Application

```bash
# Create directory for the application
sudo mkdir -p /var/www/orderweb
sudo chown -R $USER:$USER /var/www/orderweb

# Clone the repository
cd /var/www/orderweb
git clone https://github.com/farhana51/orderweb.git .

# Install dependencies
npm install

# Create .env file
cat > .env << EOL
# Database Configuration - Oracle Cloud
DB_HOST=localhost
DB_USER=orderWeb
DB_PASSWORD=orderWeb123
DB_NAME=order_web
DB_PORT=3306

# Application Configuration
NEXTAUTH_URL=http://your-oracle-vm-ip:3000
NEXTAUTH_SECRET=your-secret-key-here-1752666079408

# Production Domain
PRODUCTION_DOMAIN=your-oracle-vm-ip

# Email Configuration
EMAIL_SERVICE=disabled

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# Security Configuration
BCRYPT_ROUNDS=12
JWT_EXPIRES_IN=24h

# System Configuration
NODE_ENV=production
PORT=3000

# Default Super Admin
DEFAULT_ADMIN_EMAIL=admin@dinedesk.com
DEFAULT_ADMIN_PASSWORD=admin123
DEFAULT_ADMIN_NAME=Super Admin
EOL

# Setup database
npm run setup

# Build the application
npm run build
```

## Step 4: Configure PM2

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: 'orderweb',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '500M'
  }]
}
EOL

# Start the application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration (for auto-restart)
pm2 save

# Setup PM2 to start on system boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
```

## Step 5: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/orderweb

# Add this configuration:
server {
    listen 80;
    server_name your-oracle-vm-ip;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # For larger file uploads
    client_max_body_size 10M;
}

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/orderweb /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 6: Setup Firewall (if enabled)

```bash
# Allow Nginx and SSH
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh

# Enable firewall if not enabled
sudo ufw enable
```

## Maintenance Commands

### Restart Application
```bash
pm2 restart orderweb
```

### View Logs
```bash
# View application logs
pm2 logs orderweb

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Update Application
```bash
cd /var/www/orderweb
git pull
npm install
npm run build
pm2 restart orderweb
```

## Troubleshooting

1. If the application doesn't start:
   ```bash
   # Check PM2 logs
   pm2 logs orderweb
   ```

2. If you can't connect to the website:
   ```bash
   # Check Nginx status
   sudo systemctl status nginx
   
   # Check if application is running
   pm2 status
   ```

3. If database connection fails:
   ```bash
   # Check MySQL status
   sudo systemctl status mysql
   
   # Test database connection
   mysql -u orderWeb -p
   ```

## Security Notes

1. Change the default super admin password after first login
2. Set strong passwords for database and admin accounts
3. Consider setting up SSL/HTTPS
4. Regularly update system and dependencies
5. Monitor logs for suspicious activities
