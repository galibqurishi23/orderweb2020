#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production setup for web hosting...');
console.log('');

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.log('📋 Creating .env file from template...');
  fs.copyFileSync('.env.example', '.env');
  console.log('✅ .env file created');
  console.log('');
  console.log('⚠️  IMPORTANT: Please update your .env file with your hosting database credentials');
  console.log('');
  console.log('Required variables (get from your hosting control panel):');
  console.log('- DB_HOST (usually localhost or provided by hosting)');
  console.log('- DB_USER (database username)');
  console.log('- DB_PASSWORD (database password)');
  console.log('- DB_NAME (database name)');
  console.log('- NEXTAUTH_URL (your domain: https://yourdomain.com)');
  console.log('- PRODUCTION_DOMAIN (your domain name)');
  console.log('');
  console.log('After updating .env, run: npm run setup-production');
  process.exit(0);
}

// Load environment variables
require('dotenv').config();

// Check required environment variables
const requiredEnvVars = [
  'DB_HOST',
  'DB_USER', 
  'DB_PASSWORD',
  'DB_NAME'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  console.error('');
  console.error('Please update your .env file with the missing variables from your hosting control panel');
  process.exit(1);
}

// Generate NEXTAUTH_SECRET if not provided
if (!process.env.NEXTAUTH_SECRET) {
  console.log('🔑 Generating NEXTAUTH_SECRET...');
  const crypto = require('crypto');
  const secret = crypto.randomBytes(32).toString('hex');
  
  // Update .env file
  const envContent = fs.readFileSync('.env', 'utf8');
  const updatedContent = envContent.replace(/NEXTAUTH_SECRET=.*/, `NEXTAUTH_SECRET=${secret}`);
  fs.writeFileSync('.env', updatedContent);
  
  console.log('✅ NEXTAUTH_SECRET generated and saved');
}

async function setupProduction() {
  try {
    console.log('📦 Installing dependencies...');
    console.log('This may take a few minutes...');
    execSync('npm install --production', { stdio: 'pipe' });
    console.log('✅ Dependencies installed');
    
    console.log('🗄️ Setting up database...');
    execSync('npm run setup-db', { stdio: 'inherit' });
    console.log('✅ Database setup completed');
    
    console.log('🏗️ Building application...');
    console.log('This may take a few minutes...');
    execSync('npm run build', { stdio: 'pipe' });
    console.log('✅ Application built successfully');
    
    console.log('');
    console.log('🎉 Production setup completed successfully!');
    console.log('');
    console.log('📋 Web Hosting Next Steps:');
    console.log('1. Start the application: npm start');
    console.log('2. Check health: https://yourdomain.com/api/health');
    console.log('3. Access super admin: https://yourdomain.com/super-admin');
    console.log(`4. Login with: ${process.env.DEFAULT_ADMIN_EMAIL || 'admin@yourdomain.com'}`);
    console.log(`5. Password: ${process.env.DEFAULT_ADMIN_PASSWORD || 'changeme123'}`);
    console.log('');
    console.log('🔒 Security reminders for web hosting:');
    console.log('- Change the default super admin password immediately');
    console.log('- Ensure SSL certificate is installed on your domain');
    console.log('- Keep your hosting control panel secure');
    console.log('- Set up regular database backups through hosting panel');
    console.log('- Monitor your hosting resource usage');
    console.log('');
    console.log('🌐 Web Hosting Tips:');
    console.log('- Use your hosting control panel to manage the application');
    console.log('- Check hosting logs if you encounter issues');
    console.log('- Contact hosting support for server-related problems');
    console.log('- Consider upgrading to VPS for better performance');
    
  } catch (error) {
    console.error('❌ Production setup failed:', error.message);
    console.error('');
    console.error('Troubleshooting steps:');
    console.error('1. Check your database credentials in .env file');
    console.error('2. Ensure your hosting supports Node.js 18+');
    console.error('3. Verify database server is accessible');
    console.error('4. Check hosting control panel for error logs');
    console.error('5. Contact your hosting provider support if needed');
    process.exit(1);
  }
}

setupProduction();
