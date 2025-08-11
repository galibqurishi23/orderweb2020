#!/bin/bash

# Production Cleanup Script for OrderWeb Restaurant System
# This script removes unnecessary files and prepares the application for production

echo "🧹 Starting production cleanup..."

# Remove all Markdown documentation files (no documentation needed in production)
echo "📋 Removing all documentation files..."
find . -name "*.md" -type f -delete
rm -f *.txt

# Remove all debug and test files
echo "🔍 Removing debug and test files..."
rm -f debug-*.js
rm -f test-*.js
rm -f test-*.sh
rm -f check-*.js
rm -f check-*.sh
rm -f *-test.js
rm -f *-test.md

# Remove database setup and migration files (keep only essential ones)
echo "🗄️ Removing development database files..."
rm -f add-*.js
rm -f add-*.sql
rm -f create-test-*.js
rm -f create-bistro-tenant.js
rm -f create-tikka-tenant.js
rm -f setup-*.js
rm -f migrate-*.js
rm -f cleanup-*.js
rm -f remove-*.js
rm -f delete-*.js
rm -f fix-*.js
rm -f reset-*.js
rm -f simple-*.js
rm -f quick-*.js
rm -f generate-*.js
rm -f set-*.js
rm -f ensure-*.js
rm -f final-*.js
rm -f run-*.js
rm -f verify-*.js

# Remove SQL backup and development files
echo "💾 Removing development SQL files..."
rm -f *.sql
rm -f dinedesk_db_backup.sql

# Remove shell scripts except essential ones
echo "🐚 Removing development shell scripts..."
rm -f *.sh
# Keep only production deployment script
mv deploy-production.sh deploy-production.sh.keep 2>/dev/null || true

# Remove log files and temporary files
echo "📝 Removing log and temporary files..."
rm -f *.log
rm -f *.txt
rm -f cookies.txt
rm -f temp-*.txt

# Remove TypeScript build info
echo "🔨 Removing build artifacts..."
rm -f tsconfig.tsbuildinfo

# Remove .DS_Store files (macOS)
echo "🍎 Removing macOS system files..."
find . -name ".DS_Store" -delete

# Remove development environment files (keep production ones)
echo "🔐 Cleaning environment files..."
rm -f .env.local

# Remove unnecessary configuration files
echo "⚙️ Removing development configurations..."
rm -f enhanced-image-handlers.ts

# Remove the migrations directory if it exists and is for development
echo "📦 Cleaning migration files..."
if [ -d "migrations" ]; then
    rm -rf migrations
fi

if [ -d "database-updates" ]; then
    rm -rf database-updates
fi

# Restore essential files
if [ -f "deploy-production.sh.keep" ]; then
    mv deploy-production.sh.keep deploy-production.sh
fi

# Clean up node_modules and reinstall for production
echo "📦 Cleaning and reinstalling dependencies..."
rm -rf node_modules
rm -f package-lock.json
npm install --production

# Build the application
echo "🏗️ Building application for production..."
npm run build

echo "✅ Production cleanup completed!"
echo ""
echo "📋 Summary of changes:"
echo "- Removed all documentation and README files"
echo "- Removed all debug and test scripts"
echo "- Removed development database setup files"
echo "- Removed log files and temporary files"
echo "- Cleaned up environment files"
echo "- Reinstalled dependencies for production"
echo "- Built the application"
echo ""
echo "🚀 Application is now production-ready!"
