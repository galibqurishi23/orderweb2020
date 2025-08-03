#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    // Import the database connection
    const dbPath = path.join(__dirname, 'src', 'lib', 'db.ts');
    
    console.log('🚀 Starting address table migration...');
    
    // Read the migration SQL
    const migrationPath = path.join(__dirname, 'migrations', 'ensure-addresses-table.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.log('❌ Migration file not found:', migrationPath);
      return;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration SQL loaded');
    
    // For now, just log what we would run
    console.log('📋 Migration SQL to run:');
    console.log(migrationSQL);
    
    console.log('✅ Address table migration prepared');
    console.log('🔧 To run this migration, execute the SQL in your MySQL database');
    console.log('💡 Or run: mysql -u root dinedesk_db < migrations/ensure-addresses-table.sql');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  }
}

// Check for specific error scenarios
console.log('🔍 Checking address API configuration...');

// Check if the addresses API files exist
const apiFiles = [
  'src/app/api/customer/addresses/route.ts',
  'src/app/api/customer/addresses/[id]/route.ts',
  'src/app/api/customer/addresses/[id]/set-default/route.ts'
];

apiFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
  }
});

// Check frontend component
const frontendPath = path.join(__dirname, 'src/app/[tenant]/customer/addresses/page.tsx');
if (fs.existsSync(frontendPath)) {
  console.log('✅ Frontend addresses page exists');
} else {
  console.log('❌ Frontend addresses page missing');
}

runMigration();
