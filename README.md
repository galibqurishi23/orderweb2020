# OrderWeb - Multi-Tenant Restaurant Ordering System

**Built by OrderWeb LTD**

A comprehensive multi-tenant restaurant ordering system designed for modern food service businesses. Complete with payment processing, order management, and customer interfaces.

---

## 🚀 Quick Setup

### Prerequisites
- Node.js 18 or higher
- MySQL/MariaDB database
- Domain name (for production)

### Environment Configuration
Create `.env` file with your database credentials:

```bash
# Database Configuration (Required)
DB_HOST=localhost
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name

# Application Settings (Required)
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-random-32-character-secret

# Optional: Super Admin (will be created automatically)
SUPER_ADMIN_EMAIL=admin@yourdomain.com
SUPER_ADMIN_PASSWORD=your_admin_password
```

### Installation
```bash
# Install dependencies
npm install

# Build application
npm run build

# Start server (database will be auto-initialized)
npm start
```

**That's it!** Your restaurant system is now running with automatic database setup.

---

## 🌍 Cloud Platform Deployment

## 🟦 Hostinger Deployment

### Step 1: Prepare Your Files
1. **Zip your project** (exclude `node_modules` folder)
2. **Upload to Hostinger** via File Manager
3. **Extract files** in your domain's `public_html` folder

### Step 2: Setup Database
1. **Go to Hostinger Control Panel**
2. **Navigate to "Databases" → "MySQL Databases"**
3. **Create new database:**
   - Database name: `u123456_restaurant` (note the actual name)
   - Database user: `u123456_dbuser` (create new user)
   - Database password: `your_secure_password`
4. **Grant all privileges** to the user

### Step 3: Configure Environment
1. **Create `.env` file** in your project root:
```bash
DB_HOST=localhost
DB_USER=u123456_dbuser
DB_PASSWORD=your_secure_password
DB_NAME=u123456_restaurant
DB_PORT=3306

NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=abcdef1234567890abcdef1234567890

SUPER_ADMIN_EMAIL=admin@yourdomain.com
SUPER_ADMIN_PASSWORD=YourSecurePassword123
```

### Step 4: Deploy
1. **Enable Node.js** in Hostinger control panel
2. **Select Node.js version 18+**
3. **Run deployment:**
```bash
npm install
npm run build
npm start
```

### Step 5: Access Your System
- **Admin Panel**: `https://yourdomain.com/super-admin`
- **Default Login**: Check your `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD`

---

## 🟨 AWS Deployment

### Step 1: Setup EC2 Instance
1. **Launch EC2 Instance**
   - Choose Ubuntu 22.04 LTS
   - Instance type: t3.medium (minimum)
   - Configure security group: Allow HTTP (80), HTTPS (443), SSH (22)

2. **Connect to Instance**
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

3. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 2: Setup RDS Database
1. **Create RDS MySQL Instance**
   - Engine: MySQL 8.0
   - Instance class: db.t3.micro
   - Storage: 20GB
   - Multi-AZ: No (for cost optimization)

2. **Configure Security Group**
   - Allow inbound MySQL (3306) from EC2 security group

3. **Note Connection Details**
   - Endpoint: `your-rds-endpoint.amazonaws.com`
   - Port: `3306`
   - Master username: `admin`
   - Master password: `your_secure_password`

### Step 3: Deploy Application
1. **Upload Project to EC2**
```bash
# Clone or upload your project
git clone your-repository
cd order-web-restaurant
```

2. **Configure Environment**
```bash
# Create .env file
nano .env
```

```bash
DB_HOST=your-rds-endpoint.amazonaws.com
DB_USER=admin
DB_PASSWORD=your_secure_password
DB_NAME=restaurant_db
DB_PORT=3306

NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-random-32-character-secret

SUPER_ADMIN_EMAIL=admin@your-domain.com
SUPER_ADMIN_PASSWORD=YourSecurePassword123
```

3. **Install and Start**
```bash
npm install
npm run build
npm start
```

### Step 4: Setup Process Manager
```bash
# Install PM2
sudo npm install -g pm2

# Start application
pm2 start npm --name "restaurant-app" -- start
pm2 startup
pm2 save
```

### Step 5: Setup Nginx (Optional)
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/restaurant
```

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🟦 Azure Deployment

### Step 1: Setup Azure Resources
1. **Create Resource Group**
```bash
az group create --name restaurant-rg --location eastus
```

2. **Create Azure Database for MySQL**
```bash
az mysql server create \
  --resource-group restaurant-rg \
  --name restaurant-mysql \
  --location eastus \
  --admin-user mysqladmin \
  --admin-password YourSecurePassword123 \
  --sku-name B_Gen5_1
```

3. **Create Database**
```bash
az mysql db create \
  --resource-group restaurant-rg \
  --server-name restaurant-mysql \
  --name restaurant_db
```

### Step 2: Create App Service
1. **Create App Service Plan**
```bash
az appservice plan create \
  --name restaurant-plan \
  --resource-group restaurant-rg \
  --sku B1 \
  --is-linux
```

2. **Create Web App**
```bash
az webapp create \
  --resource-group restaurant-rg \
  --plan restaurant-plan \
  --name your-restaurant-app \
  --runtime "NODE|18-lts"
```

### Step 3: Configure Environment Variables
```bash
az webapp config appsettings set \
  --resource-group restaurant-rg \
  --name your-restaurant-app \
  --settings \
  DB_HOST=restaurant-mysql.mysql.database.azure.com \
  DB_USER=mysqladmin@restaurant-mysql \
  DB_PASSWORD=YourSecurePassword123 \
  DB_NAME=restaurant_db \
  DB_PORT=3306 \
  NEXTAUTH_URL=https://your-restaurant-app.azurewebsites.net \
  NEXTAUTH_SECRET=your-random-32-character-secret \
  SUPER_ADMIN_EMAIL=admin@yourdomain.com \
  SUPER_ADMIN_PASSWORD=AdminPassword123
```

### Step 4: Deploy Application
1. **Prepare for Deployment**
```bash
# Create .deployment file
echo "[config]
command = npm install && npm run build && npm start" > .deployment
```

2. **Deploy via Git**
```bash
git remote add azure https://your-restaurant-app.scm.azurewebsites.net:443/your-restaurant-app.git
git push azure main
```

---

## 🟩 Google Cloud Deployment

### Step 1: Setup Cloud SQL
1. **Create Cloud SQL Instance**
```bash
gcloud sql instances create restaurant-mysql \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=us-central1
```

2. **Set Root Password**
```bash
gcloud sql users set-password root \
  --host=% \
  --instance=restaurant-mysql \
  --password=YourSecurePassword123
```

3. **Create Database**
```bash
gcloud sql databases create restaurant_db \
  --instance=restaurant-mysql
```

### Step 2: Setup App Engine
1. **Create app.yaml**
```yaml
runtime: nodejs18

env_variables:
  DB_HOST: /cloudsql/your-project:us-central1:restaurant-mysql
  DB_USER: root
  DB_PASSWORD: YourSecurePassword123
  DB_NAME: restaurant_db
  NEXTAUTH_URL: https://your-project.appspot.com
  NEXTAUTH_SECRET: your-random-32-character-secret
  SUPER_ADMIN_EMAIL: admin@yourdomain.com
  SUPER_ADMIN_PASSWORD: AdminPassword123

beta_settings:
  cloud_sql_instances: your-project:us-central1:restaurant-mysql
```

2. **Deploy Application**
```bash
gcloud app deploy
```

### Step 3: Setup Cloud Storage (Optional)
```bash
# Create bucket for file uploads
gsutil mb gs://your-restaurant-uploads
```

---

## 🔧 System Features

### 🏪 Multi-Tenant Architecture
- **Super Admin Dashboard** - Manage all restaurants
- **Restaurant Admin Panel** - Individual restaurant management
- **Customer Interface** - Online ordering system

### 📱 Complete Restaurant Management
- **Menu Management** - Categories, items, variants, allergens
- **Order Processing** - Real-time order tracking
- **Payment Integration** - Stripe, Global Payments, Worldpay
- **Delivery Zones** - Postcode-based delivery areas
- **Voucher System** - Discount codes and promotions
- **Staff Management** - Multi-level user access

### 🔒 Security & Performance
- **JWT Authentication** - Secure token-based authentication
- **Database Connection Pooling** - Optimized performance
- **SQL Injection Protection** - Parameterized queries
- **Role-based Access Control** - Multi-level permissions

---

## 🎯 Access Points

### Super Admin Access
- **URL**: `https://yourdomain.com/super-admin`
- **Default Login**: Check your environment variables
- **Features**: Create restaurants, manage users, system analytics

### Restaurant Admin Access
- **URL**: `https://yourdomain.com/[restaurant-slug]/admin`
- **Created**: Through super admin panel
- **Features**: Menu management, orders, payments, settings

### Customer Interface
- **URL**: `https://yourdomain.com/[restaurant-slug]`
- **Features**: Browse menu, place orders, track delivery

### API Health Check
- **URL**: `https://yourdomain.com/api/health`
- **Purpose**: Monitor system status and database connectivity

---

## 🆘 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check credentials in .env file
# Verify database server is running
# Test connection manually
```

**Build Errors**
```bash
# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

**Permission Errors**
```bash
# Set proper file permissions
chmod 755 folders/
chmod 644 files
```

### Manual Database Setup
If automatic setup fails, visit: `https://yourdomain.com/api/setup`

---

## 📞 Support

### System Monitoring
- **Health Check**: `/api/health`
- **Database Status**: Included in health endpoint
- **Error Logs**: Check server logs for details

### Technical Support
- **Documentation**: This README file
- **API Reference**: `/api/health` for system status
- **Manual Setup**: `/api/setup` for database initialization

---

## 📋 System Requirements

### Minimum Requirements
- **Node.js**: 18 or higher
- **Database**: MySQL 8.0+ or MariaDB 10.5+
- **Memory**: 512MB RAM (2GB recommended)
- **Storage**: 1GB disk space

### Recommended for Production
- **CPU**: 2+ cores
- **Memory**: 4GB+ RAM
- **Storage**: 10GB+ SSD
- **Network**: CDN for static assets

---

## 🏢 About OrderWeb LTD

**OrderWeb LTD** is a leading provider of restaurant technology solutions, specializing in multi-tenant ordering systems for modern food service businesses.

### Key Features
- **Enterprise-grade** multi-tenant architecture
- **Payment gateway** integrations
- **Real-time order** processing
- **Mobile-responsive** design
- **Cloud-ready** deployment

### Copyright
© 2025 OrderWeb LTD. All rights reserved.

---

**🚀 Your professional restaurant ordering system is ready for deployment!**
