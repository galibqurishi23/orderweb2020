const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
require('dotenv').config();

// Database configuration
const DB_CONFIG = {
  host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
  user: process.env.DATABASE_USER || process.env.DB_USER || 'root',
  password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'root',
  database: process.env.DATABASE_NAME || process.env.DB_NAME || 'dinedesk_db',
  port: process.env.DATABASE_PORT || process.env.DB_PORT || 3306,
};

async function resetSuperAdminPassword() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    
    // New credentials
    const newEmail = 'admin@dinedesk.com';
    const newPassword = 'admin123';
    const newName = 'Super Admin';
    
    console.log('🔍 Checking for existing super admin...');
    
    // Check if super admin exists
    const [existingAdmin] = await connection.execute(
      'SELECT id, email FROM super_admin_users WHERE role = "super_admin" LIMIT 1'
    );
    
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    if (existingAdmin.length > 0) {
      console.log('👤 Updating existing super admin...');
      await connection.execute(
        'UPDATE super_admin_users SET email = ?, password = ?, name = ?, active = TRUE WHERE id = ?',
        [newEmail, hashedPassword, newName, existingAdmin[0].id]
      );
      console.log('✅ Super admin credentials updated!');
    } else {
      console.log('👤 Creating new super admin...');
      await connection.execute(
        'INSERT INTO super_admin_users (id, email, password, name, role, active) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), newEmail, hashedPassword, newName, 'super_admin', true]
      );
      console.log('✅ New super admin created!');
    }
    
    console.log('');
    console.log('📋 Super Admin Login Credentials:');
    console.log('==================================');
    console.log(`Email: ${newEmail}`);
    console.log(`Password: ${newPassword}`);
    console.log('');
    console.log('🌐 Access URL: http://localhost:3000/super-admin');
    console.log('');
    console.log('⚠️  IMPORTANT: Please change this password after first login!');
    
  } catch (error) {
    console.error('❌ Error resetting super admin password:', error.message);
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('');
      console.log('💡 It looks like the database tables haven\'t been created yet.');
      console.log('   Please run: npm run setup-db');
      console.log('   This will create all necessary tables and the super admin user.');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the reset
resetSuperAdminPassword();
