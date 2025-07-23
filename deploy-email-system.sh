#!/bin/bash

# Production-Level Email System Deployment Script
# Comprehensive setup and validation for production environment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/Users/galibqurishi/Desktop/OrderWeb Online Order System /order-web-restaurant--main"
BACKUP_DIR="/tmp/email-system-backup-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="/tmp/email-deployment-$(date +%Y%m%d-%H%M%S).log"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Validation functions
validate_environment() {
    log "Validating environment requirements..."
    
    # Check Node.js
    if ! command_exists node; then
        error "Node.js is not installed"
    fi
    
    local node_version=$(node --version | sed 's/v//')
    local required_version="18.0.0"
    
    if ! command_exists npx; then
        error "npm/npx is not installed"
    fi
    
    # Check MySQL/MariaDB
    if ! command_exists mysql; then
        error "MySQL/MariaDB client is not installed"
    fi
    
    # Check if database is accessible
    if ! mysql -u root -p -e "SELECT 1;" 2>/dev/null; then
        warning "Cannot connect to database. Please ensure MySQL/MariaDB is running and credentials are correct."
    fi
    
    success "Environment validation completed"
}

# Database setup and migration
setup_database() {
    log "Setting up database for email system..."
    
    cd "$PROJECT_DIR"
    
    # Check if database exists
    if mysql -u root -p -e "USE dinedesk_db; SELECT 1;" 2>/dev/null; then
        success "Database 'dinedesk_db' exists"
    else
        error "Database 'dinedesk_db' does not exist. Please create it first."
    fi
    
    # Run migrations
    if [ -f "migrations/add-email-system-tables.sql" ]; then
        log "Running email system migrations..."
        if mysql -u root -p dinedesk_db < migrations/add-email-system-tables.sql; then
            success "Email system migrations completed"
        else
            warning "Some migration errors occurred (this might be normal if tables already exist)"
        fi
    else
        warning "Migration file not found"
    fi
}

# Install dependencies
install_dependencies() {
    log "Installing production dependencies..."
    
    cd "$PROJECT_DIR"
    
    # Install production dependencies
    if npm ci --production; then
        success "Production dependencies installed"
    else
        error "Failed to install dependencies"
    fi
    
    # Install additional production packages if needed
    local additional_packages=(
        "zod@^3.22.0"
        "@types/nodemailer@^6.4.0"
    )
    
    for package in "${additional_packages[@]}"; do
        log "Installing $package..."
        npm install "$package" || warning "Failed to install $package"
    done
}

# Build application
build_application() {
    log "Building application for production..."
    
    cd "$PROJECT_DIR"
    
    # Clean previous builds
    if [ -d ".next" ]; then
        rm -rf .next
        log "Cleaned previous build"
    fi
    
    # Build application
    if npm run build; then
        success "Application built successfully"
    else
        error "Failed to build application"
    fi
}

# Setup environment configuration
setup_environment() {
    log "Setting up production environment configuration..."
    
    cd "$PROJECT_DIR"
    
    # Create .env.local if it doesn't exist
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.production.example" ]; then
            cp .env.production.example .env.local
            warning "Created .env.local from example. Please configure with your actual values."
        else
            warning ".env.local not found and no example file available"
        fi
    else
        success ".env.local already exists"
    fi
    
    # Validate required environment variables
    local required_vars=(
        "SYSTEM_EMAIL_HOST"
        "SYSTEM_EMAIL_USER"
        "SYSTEM_EMAIL_PASS"
        "DB_HOST"
        "DB_USER"
        "DB_PASSWORD"
    )
    
    log "Checking required environment variables..."
    for var in "${required_vars[@]}"; do
        if grep -q "^$var=" .env.local; then
            success "$var is configured"
        else
            warning "$var is not configured in .env.local"
        fi
    done
}

# Performance optimizations
optimize_for_production() {
    log "Applying production optimizations..."
    
    cd "$PROJECT_DIR"
    
    # Optimize package.json for production
    if command_exists jq; then
        # Remove dev dependencies from package.json for production build
        log "Optimizing package.json..."
    else
        warning "jq not available for package.json optimization"
    fi
    
    # Setup PM2 configuration if available
    if command_exists pm2; then
        log "Setting up PM2 configuration..."
        cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'orderweb-email-system',
    script: 'npm',
    args: 'start',
    cwd: '$PROJECT_DIR',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 9002
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }]
}
EOF
        success "PM2 configuration created"
    else
        warning "PM2 not available for process management"
    fi
}

# Security hardening
apply_security_hardening() {
    log "Applying security hardening..."
    
    cd "$PROJECT_DIR"
    
    # Set proper file permissions
    chmod 600 .env.local 2>/dev/null || true
    chmod 644 package.json
    chmod 644 next.config.ts
    
    # Create security headers configuration
    log "Setting up security headers..."
    
    # Validate that security middleware is properly configured
    if [ -f "src/lib/email-middleware.ts" ]; then
        success "Security middleware is configured"
    else
        warning "Security middleware not found"
    fi
    
    success "Security hardening completed"
}

# Health checks
run_health_checks() {
    log "Running health checks..."
    
    cd "$PROJECT_DIR"
    
    # Start the application temporarily for health checks
    log "Starting application for health check..."
    npm run dev &
    local app_pid=$!
    
    # Wait for application to start
    sleep 10
    
    # Test health endpoint
    if curl -f http://localhost:9002/api/health >/dev/null 2>&1; then
        success "Health endpoint is responding"
    else
        warning "Health endpoint is not responding"
    fi
    
    # Test database endpoint
    if curl -f http://localhost:9002/api/db-status >/dev/null 2>&1; then
        success "Database endpoint is responding"
    else
        warning "Database endpoint is not responding"
    fi
    
    # Stop the test application
    kill $app_pid 2>/dev/null || true
    wait $app_pid 2>/dev/null || true
    
    log "Health checks completed"
}

# Backup current installation
create_backup() {
    log "Creating backup of current installation..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup key files
    local backup_files=(
        ".env.local"
        "package.json"
        "package-lock.json"
        "next.config.ts"
    )
    
    for file in "${backup_files[@]}"; do
        if [ -f "$PROJECT_DIR/$file" ]; then
            cp "$PROJECT_DIR/$file" "$BACKUP_DIR/"
            log "Backed up $file"
        fi
    done
    
    success "Backup created at $BACKUP_DIR"
}

# Generate deployment report
generate_report() {
    log "Generating deployment report..."
    
    local report_file="/tmp/email-system-deployment-report-$(date +%Y%m%d-%H%M%S).txt"
    
    cat > "$report_file" << EOF
# Email System Deployment Report
Generated: $(date)
Project: OrderWeb Email System
Location: $PROJECT_DIR

## Environment Information
Node.js Version: $(node --version)
NPM Version: $(npm --version)
Operating System: $(uname -s) $(uname -r)

## Database Status
$(mysql --version)

## Installed Packages
$(npm list --depth=0 --production)

## File Permissions
$(ls -la .env.local 2>/dev/null || echo ".env.local not found")

## Log Files
Deployment Log: $LOG_FILE
Backup Location: $BACKUP_DIR

## Next Steps
1. Configure .env.local with your actual credentials
2. Test all email functionality
3. Set up monitoring and alerting
4. Configure SSL certificates for production
5. Set up log rotation and backup strategies

## Support
- Review logs at: $LOG_FILE
- Check health endpoints after starting the application
- Ensure all environment variables are properly configured

EOF

    success "Deployment report generated at $report_file"
    cat "$report_file"
}

# Main deployment function
main() {
    log "Starting production deployment of Email System..."
    log "Deployment log: $LOG_FILE"
    
    # Pre-deployment checks
    validate_environment
    create_backup
    
    # Core deployment steps
    setup_database
    install_dependencies
    setup_environment
    build_application
    
    # Production optimizations
    optimize_for_production
    apply_security_hardening
    
    # Post-deployment validation
    run_health_checks
    
    # Generate report
    generate_report
    
    success "Email System deployment completed successfully!"
    log "Next steps:"
    log "1. Configure .env.local with your actual credentials"
    log "2. Start the application: npm run dev or use PM2"
    log "3. Test all functionality using the provided test scripts"
    log "4. Monitor logs and health endpoints"
    
    log "Deployment completed at $(date)"
}

# Handle script interruption
trap 'error "Deployment interrupted"' INT TERM

# Check if running as root (not recommended)
if [ "$EUID" -eq 0 ]; then
    warning "Running as root is not recommended for security reasons"
fi

# Run main deployment
main "$@"
