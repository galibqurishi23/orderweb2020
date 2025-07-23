#!/usr/bin/env node

console.log('🚀 OrderWeb Email System - Quick Verification\n');

// Check if database migration file exists
const fs = require('fs');
const path = require('path');

console.log('📋 Checking Database Migration...');
const migrationFile = path.join(__dirname, 'migrations', 'add-email-system-tables.sql');
if (fs.existsSync(migrationFile)) {
  console.log('✅ Email system migration file exists');
  
  const migrationContent = fs.readFileSync(migrationFile, 'utf8');
  const requiredTables = [
    'tenant_email_settings',
    'tenant_email_branding',
    'smtp_failure_logs', 
    'super_admin_notifications',
    'email_queue'
  ];
  
  console.log('\n📊 Checking required tables in migration:');
  requiredTables.forEach(table => {
    if (migrationContent.includes(table)) {
      console.log(`✅ ${table}`);
    } else {
      console.log(`❌ ${table} - missing`);
    }
  });
  
} else {
  console.log('❌ Email system migration file not found');
}

console.log('\n🔍 Checking Email System Implementation Files...\n');

const emailSystemFiles = [
  // Phase 1
  { file: 'src/lib/tenant-email-service.ts', phase: 1, desc: 'Core Email Service' },
  { file: 'src/app/api/[tenant]/email-settings/route.ts', phase: 1, desc: 'SMTP Settings API' },
  { file: 'src/app/api/[tenant]/test-email/route.ts', phase: 1, desc: 'Test Email API' },
  { file: 'src/app/api/[tenant]/send-order-emails/route.ts', phase: 1, desc: 'Order Email Sending' },
  
  // Phase 2
  { file: 'src/app/api/[tenant]/email-branding/route.ts', phase: 2, desc: 'Template Branding API' },
  { file: 'src/app/api/[tenant]/send-preview-email/route.ts', phase: 2, desc: 'Preview Email API' },
  { file: 'src/app/super-admin/email-monitoring/page.tsx', phase: 2, desc: 'Super Admin Monitoring' },
  
  // Phase 3
  { file: 'src/app/[tenant]/admin/email-analytics/page.tsx', phase: 3, desc: 'Analytics Dashboard' },
  { file: 'src/app/api/[tenant]/email-analytics/route.ts', phase: 3, desc: 'Analytics API' },
  { file: 'src/lib/email-health-monitoring.ts', phase: 3, desc: 'Health Monitoring' },
  { file: 'src/app/api/cron/email-health-check/route.ts', phase: 3, desc: 'Automated Health Check' },
  { file: 'src/app/super-admin/health-dashboard/page.tsx', phase: 3, desc: 'Health Dashboard' }
];

const phaseStatus = { 1: [], 2: [], 3: [] };
let totalFiles = 0;
let existingFiles = 0;

emailSystemFiles.forEach(item => {
  totalFiles++;
  const exists = fs.existsSync(path.join(__dirname, item.file));
  if (exists) existingFiles++;
  
  console.log(`Phase ${item.phase} - ${item.desc}`);
  console.log(`   ${exists ? '✅' : '❌'} ${item.file}`);
  
  phaseStatus[item.phase].push(exists);
  console.log('');
});

console.log('📊 Implementation Status Summary:\n');

// Calculate phase completion
for (let phase = 1; phase <= 3; phase++) {
  const phaseFiles = phaseStatus[phase];
  const completed = phaseFiles.filter(Boolean).length;
  const total = phaseFiles.length;
  const percentage = Math.round((completed / total) * 100);
  
  console.log(`Phase ${phase}: ${completed}/${total} files (${percentage}%) ${percentage === 100 ? '✅' : '⚠️'}`);
}

console.log(`\nOverall: ${existingFiles}/${totalFiles} files (${Math.round((existingFiles/totalFiles)*100)}%)`);

// Check package.json for required dependencies
console.log('\n📦 Checking Dependencies...');
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = ['nodemailer', 'recharts', 'mysql2'];
  requiredDeps.forEach(dep => {
    if (deps[dep]) {
      console.log(`✅ ${dep} (${deps[dep]})`);
    } else {
      console.log(`❌ ${dep} - missing`);
    }
  });
}

console.log('\n🎯 Feature Checklist:');
console.log('');
console.log('📧 Phase 1 - Basic Email System:');
console.log('   - Restaurant SMTP Configuration');
console.log('   - Email Queue Processing');
console.log('   - Order Email Notifications');
console.log('   - System Fallback Support');
console.log('');
console.log('🎨 Phase 2 - Template Customization:');
console.log('   - Customer Template A & B');
console.log('   - Branding Customization Interface');
console.log('   - Super Admin Monitoring Dashboard');
console.log('');
console.log('📊 Phase 3 - Analytics & Health Monitoring:');
console.log('   - Advanced Analytics Dashboard');
console.log('   - Email Health Monitoring');
console.log('   - Automated Alerts & Notifications');
console.log('   - Real-time Performance Tracking');

console.log('\n' + '='.repeat(60));
if (existingFiles === totalFiles) {
  console.log('🎉 All email system files are in place!');
  console.log('');
  console.log('✅ Next step: Run database migration and test functionality');
  console.log('   mysql -u root -p dinedesk_db < migrations/add-email-system-tables.sql');
} else {
  console.log('⚠️  Email system implementation is incomplete');
  console.log(`   ${totalFiles - existingFiles} files are missing`);
}
console.log('='.repeat(60));
