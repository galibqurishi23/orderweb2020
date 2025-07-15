#!/usr/bin/env node

console.log('🌐 Web Hosting Setup Guide');
console.log('=========================');
console.log('');

const fs = require('fs');
const path = require('path');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Please run this script from the project root directory');
  process.exit(1);
}

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.log('📋 Step 1: Create .env file');
  console.log('Copy the .env.example file to .env and update it with your hosting database credentials:');
  console.log('');
  fs.copyFileSync('.env.example', '.env');
  console.log('✅ .env file created from template');
  console.log('');
  console.log('🔧 Required configuration:');
  console.log('1. Get database credentials from your hosting control panel');
  console.log('2. Update these variables in .env file:');
  console.log('   - DB_HOST (usually localhost or provided by host)');
  console.log('   - DB_USER (database username from hosting panel)');
  console.log('   - DB_PASSWORD (database password from hosting panel)');
  console.log('   - DB_NAME (database name you created)');
  console.log('   - NEXTAUTH_URL (your domain: https://yourdomain.com)');
  console.log('   - PRODUCTION_DOMAIN (your domain name)');
  console.log('');
  console.log('3. After updating .env, run: npm run setup-hosting');
  console.log('');
  process.exit(0);
}

// Load environment variables
require('dotenv').config();

console.log('📋 Step 2: Verify Environment Configuration');
console.log('');

// Check required environment variables
const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('');
  console.error('Please update your .env file with these variables from your hosting control panel');
  process.exit(1);
}

console.log('✅ Environment variables configured');
console.log('');

console.log('📋 Step 3: Installation Instructions');
console.log('');
console.log('Run these commands in your hosting terminal/SSH:');
console.log('');
console.log('1. Install dependencies:');
console.log('   npm install');
console.log('');
console.log('2. Setup database and build application:');
console.log('   npm run setup-production');
console.log('');
console.log('3. Start the application:');
console.log('   npm start');
console.log('');
console.log('📋 Step 4: After Setup');
console.log('');
console.log('1. Visit: https://yourdomain.com/api/health (should show "healthy")');
console.log('2. Access super admin: https://yourdomain.com/super-admin');
console.log(`3. Login with: ${process.env.DEFAULT_ADMIN_EMAIL || 'admin@yourdomain.com'}`);
console.log(`4. Password: ${process.env.DEFAULT_ADMIN_PASSWORD || 'changeme123'}`);
console.log('');
console.log('🔒 Security Reminders:');
console.log('- Change the default admin password immediately');
console.log('- Ensure SSL certificate is installed');
console.log('- Keep your hosting control panel secure');
console.log('- Regular backups of database and files');
console.log('');
console.log('🚀 Your OrderWeb application is ready for web hosting!');

console.log('');
console.log('📋 Popular Web Hosting Platforms:');
console.log('');
console.log('• Hostinger: Enable Node.js in control panel');
console.log('• GoDaddy: Use shared hosting with Node.js support');
console.log('• A2 Hosting: Enable Node.js in cPanel');
console.log('• Bluehost: Requires VPS or dedicated for Node.js');
console.log('• SiteGround: Use cloud hosting for Node.js');
console.log('');
console.log('⚠️  Note: Shared hosting may have limitations. VPS recommended for better performance.');
