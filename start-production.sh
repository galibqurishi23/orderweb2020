#!/bin/bash

# OrderWeb Restaurant System - Production Deployment Script
# This script starts the production server with optimal settings

echo "🚀 Starting OrderWeb Restaurant System in Production Mode"
echo "=================================================="

# Check if build exists
if [ ! -d ".next" ]; then
    echo "⚠️  No build found. Building application..."
    npm run build
fi

# Set production environment
export NODE_ENV=production

# Start the production server
echo "🌟 Starting production server on port 9002..."
echo "📧 Application will be available at: http://localhost:9002"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

npm run start:prod
