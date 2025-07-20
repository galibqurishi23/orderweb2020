#!/bin/bash

# OrderWeb Restaurant System - Production Deployment Script for Oracle Linux
# This script sets up and deploys the application on Oracle Linux

set -e  # Exit on any error

echo "🚀 OrderWeb Restaurant System - Production Deployment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    log_error "Please do not run this script as root. Use a regular user with sudo privileges."
    exit 1
fi

# Step 1: System Requirements Check
log_info "Checking system requirements..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 18+ first."
    echo "To install Node.js on Oracle Linux:"
    echo "sudo dnf install -y nodejs npm"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

log_success "Node.js $(node -v) detected"

# Check if MySQL/MariaDB client is available
if ! command -v mysql &> /dev/null; then
    log_warning "MySQL client not found. Please install it for database access:"
    echo "sudo dnf install -y mysql"
fi

# Step 2: Environment Configuration
log_info "Setting up environment configuration..."

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    log_error ".env.production file not found!"
    echo "Please create .env.production with your database credentials."
    exit 1
fi

# Copy production environment to .env
cp .env.production .env
log_success "Environment configuration loaded"

# Step 3: Install Dependencies
log_info "Installing dependencies..."
npm ci --only=production
log_success "Dependencies installed"

# Step 4: Database Setup
log_info "Setting up database..."

# Check if we can connect to the database
if node -e "
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });
        await connection.end();
        console.log('✅ Database connection successful');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

testConnection();
" 2>/dev/null; then
    log_success "Database connection verified"
else
    log_error "Database connection failed. Please check your credentials in .env.production"
    echo "Make sure:"
    echo "1. MySQL/MariaDB is running"
    echo "2. Database credentials are correct"
    echo "3. Database user has proper permissions"
    echo "4. Database exists or user can create it"
    exit 1
fi

# Run database setup
log_info "Initializing database schema..."
npm run setup
log_success "Database schema initialized"

# Step 5: Build Application
log_info "Building application for production..."
npm run build
log_success "Application built successfully"

# Step 6: Create systemd service (optional)
read -p "Do you want to create a systemd service for auto-start? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Creating systemd service..."
    
    SERVICE_FILE="/tmp/orderweb.service"
    cat > $SERVICE_FILE << EOF
[Unit]
Description=OrderWeb Restaurant System
After=network.target mysql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
ExecStart=$(which npm) start
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=orderweb

[Install]
WantedBy=multi-user.target
EOF

    sudo mv $SERVICE_FILE /etc/systemd/system/orderweb.service
    sudo systemctl daemon-reload
    sudo systemctl enable orderweb
    
    log_success "Systemd service created and enabled"
    echo "You can now control the service with:"
    echo "  sudo systemctl start orderweb"
    echo "  sudo systemctl stop orderweb"
    echo "  sudo systemctl status orderweb"
fi

# Step 7: Setup firewall (if applicable)
if command -v firewall-cmd &> /dev/null; then
    read -p "Do you want to open port 3000 in firewall? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo firewall-cmd --permanent --add-port=3000/tcp
        sudo firewall-cmd --reload
        log_success "Firewall configured to allow port 3000"
    fi
fi

# Step 8: Final Instructions
echo
echo "🎉 Deployment completed successfully!"
echo "=================================="
echo
echo "Next steps:"
echo "1. Update your .env.production with actual production values"
echo "2. Configure your reverse proxy (nginx/apache) if needed"
echo "3. Set up SSL certificate for HTTPS"
echo
echo "To start the application:"
echo "  npm start"
echo
echo "Or if you created the systemd service:"
echo "  sudo systemctl start orderweb"
echo
echo "The application will be available at: http://localhost:3000"
echo
echo "Default super admin credentials:"
echo "  Email: admin@yourdomain.com (update in .env.production)"
echo "  Password: (set in .env.production SUPER_ADMIN_PASSWORD)"
echo
echo "🔒 Security reminders:"
echo "- Change default passwords"
echo "- Update NEXTAUTH_SECRET to a secure random string"
echo "- Configure proper SSL/TLS"
echo "- Set up regular database backups"
echo "- Monitor application logs"

log_success "Deployment script completed!"
