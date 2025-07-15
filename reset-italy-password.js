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

async function resetItalyAdminPassword() {
  let connection;
  
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update the admin user password for italy restaurant
    const [result] = await connection.execute(
      `UPDATE tenant_users 
       SET password = ?, updated_at = NOW() 
       WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'italy') 
       AND role = 'owner'`,
      [hashedPassword]
    );
    
    if (result.affectedRows > 0) {
      console.log('✅ Italy admin password reset successfully!');
      console.log('');
      console.log('🔑 Login Credentials:');
      console.log('====================');
      console.log('URL: http://localhost:3000/italy/admin');
      console.log('Email: admin@gmail.com');
      console.log('Password: admin123');
    } else {
      console.log('❌ Failed to reset password');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

resetItalyAdminPassword();
