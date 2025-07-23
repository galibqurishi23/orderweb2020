// Database and Email System Verification Script
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...\n');
  
  try {
    // Read database config from environment or use defaults
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'dinedesk_db'
    };

    console.log(`Connecting to: ${dbConfig.host}/${dbConfig.database}`);
    
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection successful');
    
    // Check if email system tables exist
    const emailTables = [
      'tenant_email_settings',
      'tenant_email_branding', 
      'smtp_failure_logs',
      'super_admin_notifications',
      'email_queue'
    ];

    console.log('\n📋 Checking Email System Tables...');
    
    for (const table of emailTables) {
      try {
        const [rows] = await connection.execute(`SHOW TABLES LIKE '${table}'`);
        if (rows.length > 0) {
          console.log(`✅ Table ${table} exists`);
          
          // Get table structure
          const [structure] = await connection.execute(`DESCRIBE ${table}`);
          console.log(`   📊 Columns: ${structure.length}`);
        } else {
          console.log(`❌ Table ${table} missing`);
        }
      } catch (error) {
        console.log(`❌ Error checking table ${table}: ${error}`);
      }
    }

    // Check for sample data
    console.log('\n📊 Checking Sample Data...');
    
    try {
      const [tenants] = await connection.execute('SELECT COUNT(*) as count FROM tenants');
      console.log(`✅ Tenants in database: ${tenants[0].count}`);
      
      const [emailSettings] = await connection.execute('SELECT COUNT(*) as count FROM tenant_email_settings');
      console.log(`📧 Email settings configured: ${emailSettings[0].count}`);
      
      const [emailBranding] = await connection.execute('SELECT COUNT(*) as count FROM tenant_email_branding');
      console.log(`🎨 Email branding configured: ${emailBranding[0].count}`);
      
    } catch (error) {
      console.log(`⚠️ Error checking sample data: ${error}`);
    }

    await connection.end();
    return true;
    
  } catch (error) {
    console.log(`❌ Database connection failed: ${error}`);
    return false;
  }
}

async function checkEmailSystemFiles() {
  console.log('\n🔍 Checking Email System Files...\n');
  
  const requiredFiles = [
    // Phase 1 Files
    { path: 'src/lib/tenant-email-service.ts', phase: 1, description: 'Email Service' },
    { path: 'src/app/api/[tenant]/email-settings/route.ts', phase: 1, description: 'Email Settings API' },
    { path: 'src/app/api/[tenant]/test-email/route.ts', phase: 1, description: 'Test Email API' },
    { path: 'src/app/api/[tenant]/send-order-emails/route.ts', phase: 1, description: 'Order Email API' },
    
    // Phase 2 Files  
    { path: 'src/app/api/[tenant]/email-branding/route.ts', phase: 2, description: 'Email Branding API' },
    { path: 'src/app/api/[tenant]/send-preview-email/route.ts', phase: 2, description: 'Preview Email API' },
    { path: 'src/app/super-admin/email-monitoring/page.tsx', phase: 2, description: 'Super Admin Monitoring' },
    
    // Phase 3 Files
    { path: 'src/app/[tenant]/admin/email-analytics/page.tsx', phase: 3, description: 'Analytics Dashboard' },
    { path: 'src/lib/email-health-monitoring.ts', phase: 3, description: 'Health Monitoring Service' },
    { path: 'src/app/api/cron/email-health-check/route.ts', phase: 3, description: 'Automated Health Check' },
    { path: 'src/app/super-admin/health-dashboard/page.tsx', phase: 3, description: 'Health Dashboard' }
  ];

  let allFilesExist = true;
  const phaseStatus = { 1: true, 2: true, 3: true };

  for (const file of requiredFiles) {
    const fullPath = path.resolve(file.path);
    const exists = fs.existsSync(fullPath);
    
    console.log(`Phase ${file.phase} - ${file.description}`);
    console.log(`   File: ${file.path}`);
    console.log(`   Status: ${exists ? '✅ Exists' : '❌ Missing'}`);
    
    if (!exists) {
      allFilesExist = false;
      phaseStatus[file.phase] = false;
    }
    console.log('');
  }

  console.log('📊 Phase Summary:');
  console.log(`Phase 1 (Basic Email): ${phaseStatus[1] ? '✅ Complete' : '❌ Incomplete'}`);
  console.log(`Phase 2 (Templates & Monitoring): ${phaseStatus[2] ? '✅ Complete' : '❌ Incomplete'}`);
  console.log(`Phase 3 (Analytics & Health): ${phaseStatus[3] ? '✅ Complete' : '❌ Incomplete'}`);
  
  return allFilesExist;
}

async function testAPIEndpoints() {
  console.log('\n🌐 Testing API Endpoints...\n');
  
  const endpoints = [
    { url: 'http://localhost:3000/api/health', description: 'Health Check' },
    { url: 'http://localhost:3000/api/db-status', description: 'Database Status' },
    // Note: Tenant-specific endpoints need a real tenant ID
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint.description}`);
      console.log(`URL: ${endpoint.url}`);
      
      const response = await fetch(endpoint.url);
      console.log(`Status: ${response.status} ${response.status === 200 ? '✅' : '❌'}`);
      
      if (response.status === 200) {
        const data = await response.text();
        console.log(`Response: ${data.substring(0, 100)}${data.length > 100 ? '...' : ''}`);
      }
      
    } catch (error) {
      console.log(`❌ Failed: ${error}`);
    }
    console.log('');
  }
}

// Main execution
async function runFullSystemCheck() {
  console.log('🚀 OrderWeb Email System - Full Verification\n');
  console.log('=' .repeat(60));
  
  const dbConnected = await testDatabaseConnection();
  const filesExist = await checkEmailSystemFiles();
  await testAPIEndpoints();
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 OVERALL SYSTEM STATUS');
  console.log('=' .repeat(60));
  
  console.log(`Database Connection: ${dbConnected ? '✅ Working' : '❌ Failed'}`);
  console.log(`Email System Files: ${filesExist ? '✅ Complete' : '❌ Incomplete'}`);
  
  if (dbConnected && filesExist) {
    console.log('\n🎉 Email System appears to be properly configured!');
    console.log('\n📋 Next Steps:');
    console.log('1. Configure SMTP settings for a restaurant');
    console.log('2. Test email sending functionality');
    console.log('3. Verify template customization');
    console.log('4. Check Super Admin monitoring');
    console.log('5. Test analytics and health monitoring');
  } else {
    console.log('\n⚠️ System has configuration issues that need to be addressed.');
  }
}

runFullSystemCheck().catch(console.error);
