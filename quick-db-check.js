#!/usr/bin/env node

/**
 * Quick database structure check and simple menu item test
 */

const mysql = require('mysql2/promise');

async function quickDatabaseCheck() {
  console.log('🔍 Quick Database Check...');
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'dinedesk_db'
    });

    // Check table structure
    console.log('\n📋 Checking menu_items table structure...');
    const [columns] = await connection.execute('DESCRIBE menu_items');
    
    const columnNames = columns.map(col => col.Field);
    console.log('Columns:', columnNames.join(', '));
    
    // Required columns for our service
    const requiredColumns = [
      'id', 'tenant_id', 'name', 'description', 'price', 'image_url',
      'available', 'is_featured', 'is_set_menu', 'preparation_time',
      'characteristics', 'nutrition', 'set_menu_items', 'tags',
      'created_at', 'updated_at'
    ];
    
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('❌ Missing columns:', missingColumns);
    } else {
      console.log('✅ All required columns present');
    }

    // Check tenant
    const [tenants] = await connection.execute('SELECT id, slug, name FROM tenants WHERE slug = ?', ['tikka']);
    if (tenants.length > 0) {
      console.log('✅ Tikka tenant exists:', tenants[0]);
    } else {
      console.log('⚠️  Creating tikka tenant...');
      await connection.execute(`
        INSERT INTO tenants (id, slug, name, email, phone, address, status, subscription_plan, subscription_status, trial_ends_at) 
        VALUES ('tikka-tenant-id-123', 'tikka', 'Tikka Restaurant', 'tikka@example.com', '+1234567890', '123 Main Street', 'active', 'starter', 'active', '2025-12-31 23:59:59')
      `);
      console.log('✅ Tikka tenant created');
    }

    // Try simple insert
    console.log('\n📝 Testing simple menu item insert...');
    const testId = `simple_test_${Date.now()}`;
    
    await connection.execute(`
      INSERT INTO menu_items (
        id, tenant_id, name, description, price, available, 
        is_featured, is_set_menu, preparation_time, characteristics, 
        nutrition, set_menu_items, tags, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      testId,
      'tikka-tenant-id-123',
      'Simple Test Item',
      'Test description',
      9.99,
      true,
      false,
      false,
      15,
      '[]',
      'null',
      '[]',
      '[]'
    ]);
    
    console.log('✅ Simple insert successful');
    
    // Cleanup
    await connection.execute('DELETE FROM menu_items WHERE id = ?', [testId]);
    
    await connection.end();
    console.log('✅ Database check completed successfully');
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

quickDatabaseCheck();
