#!/usr/bin/env node

const mysql = require('mysql2/promise');

// Database configuration from your .env
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'dinedesk_db',
  connectionLimit: 5, // Small limit for testing
  queueLimit: 10
};

async function diagnoseDatabaseConnections() {
  console.log('🔍 Database Connection Diagnostics');
  console.log('===================================');
  
  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database
    });
    
    await connection.execute('SELECT 1 as test');
    console.log('   ✅ Basic connection successful');
    await connection.end();
    
    // Test connection pool
    console.log('2. Testing connection pool...');
    const pool = mysql.createPool(dbConfig);
    
    // Check current connections
    console.log('3. Checking active connections...');
    const [processRows] = await pool.execute('SHOW PROCESSLIST');
    const activeConnections = processRows.filter(row => 
      row.User === dbConfig.user && row.db === dbConfig.database
    );
    
    console.log(`   📊 Active connections: ${activeConnections.length}`);
    console.log(`   🎯 Connection limit: ${dbConfig.connectionLimit}`);
    
    if (activeConnections.length >= dbConfig.connectionLimit) {
      console.log('   ⚠️  CONNECTION POOL EXHAUSTED!');
      console.log('   💡 Recommendations:');
      console.log('      - Restart your application');
      console.log('      - Check for connection leaks in your code');
      console.log('      - Increase connection limit if needed');
    } else {
      console.log('   ✅ Connection pool has available connections');
    }
    
    // Show connection details
    console.log('4. Connection details:');
    activeConnections.forEach((conn, index) => {
      console.log(`   ${index + 1}. ID: ${conn.Id}, Command: ${conn.Command}, Time: ${conn.Time}s, State: ${conn.State}`);
    });
    
    await pool.end();
    
    console.log('\n🎯 Next Steps:');
    if (activeConnections.length > 5) {
      console.log('   1. Restart your Next.js application');
      console.log('   2. Use the improved connection management in db.ts');
      console.log('   3. Monitor /api/db-status endpoint');
    } else {
      console.log('   1. Your connection pool looks healthy');
      console.log('   2. Monitor /api/db-status for ongoing status');
    }
    
  } catch (error) {
    console.error('❌ Database diagnosis failed:', error.message);
    console.error('\n💡 Common solutions:');
    console.error('   1. Check your .env database credentials');
    console.error('   2. Ensure MySQL/MariaDB server is running');
    console.error('   3. Verify database name exists');
    console.error('   4. Check firewall/network connectivity');
  }
}

// Load environment variables
require('dotenv').config();

// Run diagnosis
diagnoseDatabaseConnections().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
