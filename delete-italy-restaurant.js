const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'dinedesk_db',
  port: process.env.DB_PORT || 3306,
};

async function deleteItalyRestaurant() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    
    console.log('🔍 Finding Italy restaurant...');
    
    // First, find the Italy restaurant
    const [tenantRows] = await connection.execute(
      'SELECT id, name, slug FROM tenants WHERE slug = ?',
      ['italy']
    );
    
    if (tenantRows.length === 0) {
      console.log('ℹ️  Italy restaurant not found in database');
      return;
    }
    
    const tenant = tenantRows[0];
    console.log('✅ Found Italy restaurant:', tenant);
    
    console.log('🗑️  Starting deletion process...');
    
    // Start transaction for safe deletion
    await connection.beginTransaction();
    
    try {
      // Delete all related data in correct order (respecting foreign key constraints)
      // Each deletion is wrapped in try-catch to handle missing tables
      
      // 1. Delete orders and order items
      console.log('  - Deleting orders and order items...');
      try {
        await connection.execute('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE tenant_id = ?)', [tenant.id]);
        await connection.execute('DELETE FROM orders WHERE tenant_id = ?', [tenant.id]);
      } catch (e) {
        console.log('    ⚠️  Orders tables may not exist, skipping...');
      }
      
      // 2. Delete menu items
      console.log('  - Deleting menu items...');
      try {
        await connection.execute('DELETE FROM menu_items WHERE tenant_id = ?', [tenant.id]);
      } catch (e) {
        console.log('    ⚠️  Menu items table may not exist, skipping...');
      }
      
      // 3. Delete categories
      console.log('  - Deleting categories...');
      try {
        await connection.execute('DELETE FROM categories WHERE tenant_id = ?', [tenant.id]);
      } catch (e) {
        console.log('    ⚠️  Categories table may not exist, skipping...');
      }
      
      // 4. Delete vouchers
      console.log('  - Deleting vouchers...');
      try {
        await connection.execute('DELETE FROM vouchers WHERE tenant_id = ?', [tenant.id]);
      } catch (e) {
        console.log('    ⚠️  Vouchers table may not exist, skipping...');
      }
      
      // 5. Delete zones
      console.log('  - Deleting zones...');
      try {
        await connection.execute('DELETE FROM zones WHERE tenant_id = ?', [tenant.id]);
      } catch (e) {
        console.log('    ⚠️  Zones table may not exist, skipping...');
      }
      
      // 6. Delete customers and their addresses
      console.log('  - Deleting customer addresses...');
      try {
        await connection.execute('DELETE FROM addresses WHERE customer_id IN (SELECT id FROM customers WHERE tenant_id = ?)', [tenant.id]);
      } catch (e) {
        console.log('    ⚠️  Addresses table may not exist, skipping...');
      }
      
      console.log('  - Deleting customers...');
      try {
        await connection.execute('DELETE FROM customers WHERE tenant_id = ?', [tenant.id]);
      } catch (e) {
        console.log('    ⚠️  Customers table may not exist, skipping...');
      }
      
      // 7. Delete tenant users (admin accounts)
      console.log('  - Deleting tenant users...');
      try {
        await connection.execute('DELETE FROM tenant_users WHERE tenant_id = ?', [tenant.id]);
      } catch (e) {
        console.log('    ⚠️  Tenant users table may not exist, skipping...');
      }
      
      // 8. Delete tenant settings
      console.log('  - Deleting tenant settings...');
      try {
        await connection.execute('DELETE FROM tenant_settings WHERE tenant_id = ?', [tenant.id]);
      } catch (e) {
        console.log('    ⚠️  Tenant settings table may not exist, skipping...');
      }
      
      // 9. Finally, delete the tenant itself
      console.log('  - Deleting tenant record...');
      await connection.execute('DELETE FROM tenants WHERE id = ?', [tenant.id]);
      
      // Commit the transaction
      await connection.commit();
      
      console.log('✅ Italy restaurant and all associated data deleted successfully!');
      console.log('');
      console.log('🗑️  Deleted data includes:');
      console.log('  - Tenant record (italy)');
      console.log('  - Admin user accounts');
      console.log('  - Menu categories and items');
      console.log('  - Customer accounts and addresses');
      console.log('  - Orders and order items');
      console.log('  - Vouchers and zones');
      console.log('  - Tenant settings');
      console.log('');
      console.log('🎉 Italy restaurant has been completely removed from the system!');
      
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error deleting Italy restaurant:', error.message);
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('💡 Some database tables may not exist. This is normal if the database is not fully set up.');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the deletion
deleteItalyRestaurant();
