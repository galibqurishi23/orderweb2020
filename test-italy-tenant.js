const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'dinedesk_db',
  port: process.env.DB_PORT || 3306,
};

async function testItalyTenant() {
  let connection;
  
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    
    console.log('🔍 Testing italy tenant lookup...');
    
    // Test tenant lookup
    const [tenantRows] = await connection.execute(
      'SELECT * FROM tenants WHERE slug = ?',
      ['italy']
    );
    
    if (tenantRows.length > 0) {
      console.log('✅ Italy tenant found:', tenantRows[0]);
      
      // Test admin user lookup
      const [adminRows] = await connection.execute(
        'SELECT id, email, password, name, role, active FROM tenant_users WHERE tenant_id = ? AND role = "owner"',
        [tenantRows[0].id]
      );
      
      if (adminRows.length > 0) {
        console.log('✅ Italy admin user found:', {
          id: adminRows[0].id,
          email: adminRows[0].email,
          name: adminRows[0].name,
          role: adminRows[0].role,
          active: adminRows[0].active
        });
      } else {
        console.log('❌ No admin user found');
      }
    } else {
      console.log('❌ Italy tenant not found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testItalyTenant();
