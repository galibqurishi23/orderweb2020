const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'dinedesk_db',
  port: process.env.DB_PORT || 3306,
};

async function testCategoriesQuery() {
  let connection;
  
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    
    // Get italy tenant ID
    const [tenantRows] = await connection.execute(
      'SELECT id FROM tenants WHERE slug = ?',
      ['italy']
    );
    
    if (tenantRows.length === 0) {
      console.log('❌ Italy tenant not found');
      return;
    }
    
    const tenantId = tenantRows[0].id;
    console.log('✅ Italy tenant ID:', tenantId);
    
    // Test the corrected categories query
    console.log('🔍 Testing categories query with display_order...');
    const [categoryRows] = await connection.execute(
      'SELECT * FROM categories WHERE tenant_id = ? ORDER BY display_order ASC',
      [tenantId]
    );
    
    console.log('✅ Categories query successful!');
    console.log('Found', categoryRows.length, 'categories');
    
    if (categoryRows.length > 0) {
      console.log('Sample category:', categoryRows[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testCategoriesQuery();
