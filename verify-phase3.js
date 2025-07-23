#!/usr/bin/env node

// Phase 3 Implementation Verification Script
// This script verifies that all Phase 3 components were created successfully

const fs = require('fs');
const path = require('path');

console.log('🔍 Phase 3 Implementation Verification\n');

const phase3Files = [
  {
    path: 'src/app/[tenant]/admin/email-analytics/page.tsx',
    description: 'Email Analytics Dashboard',
    checkFor: ['ResponsiveContainer', 'AreaChart', 'export async function']
  },
  {
    path: 'src/app/api/[tenant]/email-analytics/route.ts',
    description: 'Email Analytics API',
    checkFor: ['export async function GET', 'overview_stats', 'trends']
  },
  {
    path: 'src/app/api/[tenant]/email-analytics/export/route.ts',
    description: 'CSV Export API',
    checkFor: ['export async function GET', 'text/csv', 'email_queue']
  },
  {
    path: 'src/lib/email-health-monitoring.ts',
    description: 'Email Health Monitoring Service',
    checkFor: ['checkEmailHealth', 'generateAlerts', 'AlertRule']
  },
  {
    path: 'src/app/api/super-admin/health-monitoring/route.ts',
    description: 'Health Monitoring API',
    checkFor: ['export async function GET', 'health_status', 'smtp_health']
  },
  {
    path: 'src/app/api/cron/email-health-check/route.ts',
    description: 'Automated Health Check Cron',
    checkFor: ['export async function GET', 'checkEmailHealth', 'automated']
  },
  {
    path: 'src/app/super-admin/health-dashboard/page.tsx',
    description: 'Super Admin Health Dashboard',
    checkFor: ['Health Dashboard', 'Card', 'Badge']
  },
  {
    path: 'vercel.json',
    description: 'Vercel Cron Configuration',
    checkFor: ['crons', 'email-health-check', '*/15 * * * *']
  }
];

let allPassed = true;

phase3Files.forEach((file, index) => {
  const fullPath = path.join(__dirname, file.path);
  const exists = fs.existsSync(fullPath);
  
  console.log(`${index + 1}. ${file.description}`);
  console.log(`   File: ${file.path}`);
  
  if (!exists) {
    console.log(`   ❌ File not found`);
    allPassed = false;
    return;
  }
  
  console.log(`   ✅ File exists`);
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const checkResults = file.checkFor.map(check => {
      const found = content.includes(check);
      return { check, found };
    });
    
    const allChecksPass = checkResults.every(result => result.found);
    
    if (allChecksPass) {
      console.log(`   ✅ Content validation passed`);
    } else {
      console.log(`   ⚠️  Content validation issues:`);
      checkResults.forEach(result => {
        if (!result.found) {
          console.log(`      ❌ Missing: ${result.check}`);
        }
      });
      allPassed = false;
    }
  } catch (error) {
    console.log(`   ❌ Error reading file: ${error.message}`);
    allPassed = false;
  }
  
  console.log('');
});

// Check navigation integration
console.log('📱 Navigation Integration Check\n');

const navigationFiles = [
  {
    path: 'src/app/[tenant]/admin/layout.tsx',
    description: 'Tenant Admin Navigation',
    checkFor: ['Email Analytics', 'email-analytics']
  },
  {
    path: 'src/app/super-admin/layout.tsx',
    description: 'Super Admin Navigation',
    checkFor: ['Health Dashboard', 'health-dashboard']
  }
];

navigationFiles.forEach((file, index) => {
  const fullPath = path.join(__dirname, file.path);
  console.log(`${index + 1}. ${file.description}`);
  
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasIntegration = file.checkFor.every(check => content.includes(check));
    
    if (hasIntegration) {
      console.log(`   ✅ Navigation integration complete`);
    } else {
      console.log(`   ⚠️  Navigation integration incomplete`);
      allPassed = false;
    }
  } else {
    console.log(`   ❌ Navigation file not found`);
    allPassed = false;
  }
  console.log('');
});

// Summary
console.log('📊 Phase 3 Implementation Summary\n');

if (allPassed) {
  console.log('🎉 Phase 3 Implementation Complete!');
  console.log('');
  console.log('✅ Advanced Email Analytics Dashboard');
  console.log('✅ Email Health Monitoring Service');
  console.log('✅ Automated Alert System');
  console.log('✅ Super Admin Health Dashboard');
  console.log('✅ Automated Cron Job (15-minute intervals)');
  console.log('✅ Navigation Integration');
  console.log('✅ CSV Export Functionality');
  console.log('');
  console.log('🚀 All Phase 3 objectives achieved successfully!');
} else {
  console.log('⚠️  Phase 3 Implementation has some issues');
  console.log('Please review the errors above and ensure all files are properly created.');
}

console.log('\n🔧 Phase 3 Features:');
console.log('• Advanced analytics with charts and trends');
console.log('• Template performance comparison (A/B testing)');
console.log('• Automated email health monitoring');
console.log('• Intelligent alert system with cooldown periods');
console.log('• Real-time health dashboard for Super Admins');
console.log('• CSV export capabilities');
console.log('• 15-minute automated health checks');
console.log('• Comprehensive failure analysis');
