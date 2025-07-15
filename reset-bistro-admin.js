const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'dinedesk_db',
  port: process.env.DB_PORT || 3306,
};

async function resetBistroAdmin() {
  let connection;
  
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    
    // Get bistro admin user
    const [adminRows] = await connection.execute(
      `SELECT tu.id, tu.email, tu.name, tu.role, tu.active 
       FROM tenant_users tu 
       JOIN tenants t ON tu.tenant_id = t.id 
       WHERE t.slug = 'bistro' AND tu.role = 'owner'`
    );
    
    if (adminRows.length > 0) {
      const admin = adminRows[0];
      console.log('✅ Bistro admin user found:', admin);
      
      // Reset password
      const newPassword = 'admin123';
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      await connection.execute(
        'UPDATE tenant_users SET password = ? WHERE id = ?',
        [hashedPassword, admin.id]
      );
      
      console.log('✅ Password reset successfully!');
      console.log('');
      console.log('🔑 Login Credentials:');
      console.log('====================');
      console.log('URL: http://localhost:3000/bistro/admin');
      console.log('Email:', admin.email);
      console.log('Password: admin123');
      
    } else {
      console.log('❌ No admin user found for bistro restaurant');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

resetBistroAdmin();
