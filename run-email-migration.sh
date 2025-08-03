#!/bin/bash

# Tenant Email System Migration Script
# This script adds the necessary database tables and columns for the tenant email system

echo "🔧 Starting Tenant Email System Migration..."

# Database configuration
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-dinedesk_db}"

# Check if mysql command is available
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL client not found. Please install MySQL client."
    exit 1
fi

# Run the migration
echo "📊 Running database migration..."
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < migrations/add-tenant-email-system.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo "📧 Tenant email system database structure is now ready."
    echo ""
    echo "Next steps:"
    echo "1. Restart your Next.js application"
    echo "2. Configure SMTP settings for your tenants"
    echo "3. Test the email functionality"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
