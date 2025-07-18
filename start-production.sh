#!/bin/bash

# Hostinger Production Deployment Script
# This script automatically sets up your restaurant ordering system

set -e

echo "🚀 Starting Hostinger deployment setup..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created from .env.example"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env file with your Hostinger database credentials:"
    echo "   - DB_HOST (usually localhost)"
    echo "   - DB_USER (your Hostinger database username)"
    echo "   - DB_PASSWORD (your Hostinger database password)"
    echo "   - DB_NAME (your Hostinger database name)"
    echo "   - NEXTAUTH_URL (your domain: https://yourdomain.com)"
    echo "   - NEXTAUTH_SECRET (generate a random 32-character string)"
    echo ""
    echo "After editing .env, run this script again!"
    exit 1
fi

# Check if basic credentials are configured
if grep -q "your_hostinger_db_user" .env; then
    echo "⚠️  Please configure your database credentials in .env file first!"
    echo "   Edit the .env file and replace placeholder values with your actual Hostinger credentials."
    exit 1
fi

# Install dependencies
echo "� Installing dependencies..."
npm install --production

# Build the application
echo "🏗️  Building application..."
npm run build

echo "🗄️  Database will be automatically initialized on first run..."

# Start the production server
echo "🎉 Starting production server..."
echo ""
echo "🌟 Your restaurant ordering system is ready!"
echo "📍 Application: http://localhost:3000"
echo "📍 Super Admin: http://localhost:3000/super-admin"
echo "📍 Health Check: http://localhost:3000/api/health"
echo "📍 Manual Setup: http://localhost:3000/api/setup (if needed)"
echo ""
echo "🔒 Default Super Admin Login:"
echo "   Email: admin@dinedesk.com (or check your SUPER_ADMIN_EMAIL)"
echo "   Password: admin123456 (or check your SUPER_ADMIN_PASSWORD)"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start
