#!/bin/bash

# OrderWeb Restaurant System - Start Script
# This script ensures the application always runs on port 9002

echo "🚀 Starting OrderWeb Restaurant System on port 9002..."

# Export the PORT environment variable
export PORT=9002

# Check if we're in development or production mode
if [ "$NODE_ENV" = "production" ]; then
    echo "📦 Starting in production mode..."
    npm run build
    npm start
else
    echo "🔧 Starting in development mode..."
    npm run dev
fi
