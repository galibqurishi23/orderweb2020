#!/bin/bash

# Automatic Database Setup for OrderWeb Restaurant System
# This script will create all necessary database tables and configurations automatically

echo "🚀 OrderWeb Restaurant System - Automatic Database Setup"
echo "========================================================="

# Function to prompt for database information
prompt_database_info() {
    echo ""
    echo "📝 Please provide your database connection information:"
    echo ""
    
    read -p "Database Host (default: localhost): " DB_HOST
    DB_HOST=${DB_HOST:-localhost}
    
    read -p "Database Port (default: 3306): " DB_PORT
    DB_PORT=${DB_PORT:-3306}
    
    read -p "Database Username: " DB_USER
    
    read -s -p "Database Password: " DB_PASSWORD
    echo ""
    
    read -p "Database Name (default: orderweb_db): " DB_NAME
    DB_NAME=${DB_NAME:-orderweb_db}
    
    echo ""
    read -p "Super Admin Email (default: admin@orderweb.com): " SUPER_ADMIN_EMAIL
    SUPER_ADMIN_EMAIL=${SUPER_ADMIN_EMAIL:-admin@orderweb.com}
    
    read -s -p "Super Admin Password (default: admin123456): " SUPER_ADMIN_PASSWORD
    SUPER_ADMIN_PASSWORD=${SUPER_ADMIN_PASSWORD:-admin123456}
    echo ""
    echo ""
}

# Function to create .env.production file
create_env_file() {
    echo "📝 Creating production environment configuration..."
    
    cat > .env.production << EOL
# Production Environment Configuration
NODE_ENV=production
PORT=9002

# Database Configuration
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}

# Alternative database variable names (for compatibility)
DATABASE_HOST=${DB_HOST}
DATABASE_PORT=${DB_PORT}
DATABASE_USER=${DB_USER}
DATABASE_PASSWORD=${DB_PASSWORD}
DATABASE_NAME=${DB_NAME}

# Super Admin Configuration
SUPER_ADMIN_EMAIL=${SUPER_ADMIN_EMAIL}
SUPER_ADMIN_PASSWORD=${SUPER_ADMIN_PASSWORD}

# JWT Secret (auto-generated)
JWT_SECRET=$(openssl rand -base64 32)

# Application Settings
APP_NAME=OrderWeb Restaurant System
APP_URL=http://localhost:9002

# Email Settings (configure for production)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
FROM_EMAIL=noreply@orderweb.com
FROM_NAME=OrderWeb System

# Payment Gateway Settings (configure for production)
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Security Settings
BCRYPT_SALT_ROUNDS=12
SESSION_SECRET=$(openssl rand -base64 32)

# File Upload Settings
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./public/uploads

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
EOL

    echo "✅ Environment configuration created: .env.production"
}

# Function to test database connection
test_database_connection() {
    echo "🔍 Testing database connection..."
    
    # Create a temporary test script
    cat > test-db-connection.js << 'EOL'
const mysql = require('mysql2/promise');

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });
        
        await connection.execute('SELECT 1');
        console.log('✅ Database connection successful');
        await connection.end();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

testConnection().then(success => {
    process.exit(success ? 0 : 1);
});
EOL

    # Run the test with environment variables
    if env $(cat .env.production | grep -v '^#' | xargs) node test-db-connection.js; then
        rm test-db-connection.js
        return 0
    else
        rm test-db-connection.js
        return 1
    fi
}

# Function to run database setup
run_database_setup() {
    echo "🗄️ Creating database and tables..."
    
    # Load environment variables and run setup
    if env $(cat .env.production | grep -v '^#' | xargs) node -e "
        const DatabaseSetup = require('./src/lib/database-setup.ts').default;
        const setup = new DatabaseSetup();
        setup.setupDatabase().then(success => {
            process.exit(success ? 0 : 1);
        }).catch(error => {
            console.error('Setup failed:', error);
            process.exit(1);
        });
    "; then
        echo "✅ Database setup completed successfully"
        return 0
    else
        echo "❌ Database setup failed"
        return 1
    fi
}

# Function to install dependencies if needed
check_dependencies() {
    echo "📦 Checking dependencies..."
    
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install
    fi
    
    echo "✅ Dependencies ready"
}

# Function to create logs directory
create_directories() {
    echo "📁 Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p public/uploads
    mkdir -p public/images
    
    echo "✅ Directories created"
}

# Function to build the application
build_application() {
    echo "🏗️ Building application for production..."
    
    if env $(cat .env.production | grep -v '^#' | xargs) npm run build; then
        echo "✅ Application built successfully"
        return 0
    else
        echo "❌ Application build failed"
        return 1
    fi
}

# Function to create startup script
create_startup_script() {
    echo "📜 Creating startup script..."
    
    cat > start-orderweb.sh << 'EOL'
#!/bin/bash

# OrderWeb Restaurant System Startup Script

echo "🚀 Starting OrderWeb Restaurant System..."

# Load environment variables
set -a
source .env.production
set +a

# Start the application
npm run start:prod
EOL

    chmod +x start-orderweb.sh
    echo "✅ Startup script created: ./start-orderweb.sh"
}

# Main setup process
main() {
    echo "Welcome to the OrderWeb Restaurant System setup!"
    echo ""
    
    # Get database information
    prompt_database_info
    
    # Create environment file
    create_env_file
    
    # Check dependencies
    check_dependencies
    
    # Test database connection
    if ! test_database_connection; then
        echo ""
        echo "❌ Database connection failed. Please check your database information and try again."
        exit 1
    fi
    
    # Create directories
    create_directories
    
    # Run database setup
    if ! run_database_setup; then
        echo ""
        echo "❌ Database setup failed. Please check the error messages above."
        exit 1
    fi
    
    # Build application
    if ! build_application; then
        echo ""
        echo "❌ Application build failed. Please check the error messages above."
        exit 1
    fi
    
    # Create startup script
    create_startup_script
    
    # Success message
    echo ""
    echo "🎉 OrderWeb Restaurant System setup completed successfully!"
    echo "========================================================="
    echo ""
    echo "📋 Setup Summary:"
    echo "✅ Database connection tested and working"
    echo "✅ All database tables created"
    echo "✅ Super admin account created"
    echo "✅ Environment configuration saved"
    echo "✅ Application built for production"
    echo "✅ Startup script created"
    echo ""
    echo "🚀 To start your restaurant system:"
    echo "   ./start-orderweb.sh"
    echo ""
    echo "🌐 Your application will be available at:"
    echo "   Main Application: http://localhost:9002"
    echo "   Super Admin Panel: http://localhost:9002/super-admin"
    echo ""
    echo "🔐 Super Admin Login:"
    echo "   Email: ${SUPER_ADMIN_EMAIL}"
    echo "   Password: ${SUPER_ADMIN_PASSWORD}"
    echo ""
    echo "⚠️  IMPORTANT: Please change the super admin password after first login!"
    echo ""
    echo "📖 For more information, see README-PRODUCTION.md"
}

# Run the main setup
main
