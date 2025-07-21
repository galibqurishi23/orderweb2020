#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== OrderWeb Easy Setup Script ===${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required commands
echo "Checking prerequisites..."
for cmd in mysql npm node; do
    if ! command_exists "$cmd"; then
        echo -e "${RED}Error: $cmd is not installed${NC}"
        exit 1
    fi
done

# Database Configuration
DB_HOST="localhost"
DB_USER="orderWeb"
DB_PASS="orderWeb123"
DB_NAME="order_web"
DB_PORT="3306"

# Create necessary directories
echo -e "\n${GREEN}Creating necessary directories...${NC}"
mkdir -p public/uploads/logos
mkdir -p public/uploads/menus
mkdir -p public/uploads/products

# Create .env file
echo -e "\n${GREEN}Creating .env file...${NC}"
cat > .env << EOL
# Database Configuration
DB_HOST=${DB_HOST}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASS}
DB_NAME=${DB_NAME}
DB_PORT=${DB_PORT}

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Production Domain
PRODUCTION_DOMAIN=localhost

# Email Configuration
EMAIL_SERVICE=disabled

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# Security Configuration
BCRYPT_ROUNDS=12
JWT_EXPIRES_IN=24h

# System Configuration
NODE_ENV=development
PORT=3000

# Default Super Admin
DEFAULT_ADMIN_EMAIL=admin@dinedesk.com
DEFAULT_ADMIN_PASSWORD=admin123
DEFAULT_ADMIN_NAME=Super Admin
EOL

# Function to run SQL file
run_sql_file() {
    mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" "$DB_NAME" < "$1"
}

# Install dependencies
echo -e "\n${GREEN}Installing dependencies...${NC}"
npm install

# Setup database tables
echo -e "\n${GREEN}Setting up database...${NC}"
npm run setup

# Build the application
echo -e "\n${GREEN}Building the application...${NC}"
npm run build

echo -e "\n${BLUE}=== Setup Complete ===${NC}"
echo -e "${GREEN}You can now start the application with:${NC}"
echo -e "npm run dev (for development)"
echo -e "npm start (for production)"
echo -e "\n${GREEN}Default Super Admin Login:${NC}"
echo -e "Email: admin@dinedesk.com"
echo -e "Password: admin123"
echo -e "\n${RED}Important: Change the default password after first login!${NC}"
