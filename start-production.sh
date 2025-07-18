#!/bin/bash

# Production Quick Start Script
# This script helps you quickly deploy the application

set -e

echo "🚀 Starting production deployment setup..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check if MySQL is available
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL client not found. Please ensure MySQL server is running."
fi

# Install dependencies
echo "📦 Installing production dependencies..."
npm ci --production

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created from .env.example"
    echo "⚠️  Please edit .env file with your configuration before continuing"
    exit 1
fi

# Check if database is configured
if grep -q "your_password_here" .env; then
    echo "⚠️  Please configure your database credentials in .env file"
    exit 1
fi

# Setup database
echo "🗄️  Setting up database..."
npm run setup

# Build the application
echo "🏗️  Building application..."
npm run build

# Start the production server
echo "🎉 Starting production server..."
echo "Application will be available at: http://localhost:3000"
echo "Health check: http://localhost:3000/api/health"
echo ""
echo "Press Ctrl+C to stop the server"

npm start
