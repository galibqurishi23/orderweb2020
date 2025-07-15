const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'dinedesk_db',
  port: process.env.DB_PORT || 3306,
};

async function checkItalyAdmin() {
  let connection;
  
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    
    // Get italy tenant admin user
    const [adminRows] = await connection.execute(
      `SELECT tu.id, tu.email, tu.name, tu.role, tu.active 
       FROM tenant_users tu 
       JOIN tenants t ON tu.tenant_id = t.id 
       WHERE t.slug = 'italy' AND tu.role = 'owner'`
    );
    
    if (adminRows.length > 0) {
      const admin = adminRows[0];
      console.log('✅ Italy admin user found:', admin);
      console.log('Login URL: http://localhost:3000/italy/admin');
      console.log('Email:', admin.email);
    } else {
      console.log('❌ No admin user found for italy restaurant');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkItalyAdmin();
