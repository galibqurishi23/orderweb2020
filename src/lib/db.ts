// NOTE: This file cannot use 'use server' because it exports an object

import mysql from 'mysql2/promise';

// Use MariaDB/MySQL exclusively
const dbType = 'mariadb';

// Check if we're running on the server
let mysqlPool: mysql.Pool | null = null;

// Only create the pool if running on the server
if (typeof window === 'undefined') {
  // MariaDB/MySQL connection pool with environment variables and optimized settings
  mysqlPool = mysql.createPool({
    host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DB_PORT || process.env.DATABASE_PORT) || 3306,
    user: process.env.DB_USER || process.env.DATABASE_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || 'root',
    database: process.env.DB_NAME || process.env.DATABASE_NAME || 'dinedesk_db',
    waitForConnections: true,
    connectionLimit: 20, // Increased for better performance
    queueLimit: 0,
    multipleStatements: true, // Allow multiple SQL statements for initialization
    charset: 'utf8mb4',
    // Additional optimizations
    dateStrings: false,
    supportBigNumbers: true,
    bigNumberStrings: false
  });
  
  // Test connection on startup (only in development)
  async function testConnection() {
    try {
      if (mysqlPool) {
        const connection = await mysqlPool.getConnection();
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Database connected successfully');
        }
        connection.release();
      }
    } catch (error) {
      console.error('❌ Database connection failed:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Please check your database configuration in .env file');
      if (process.env.NODE_ENV === 'development') {
        console.error('Run: npm run setup-db to initialize the database');
      }
    }
  }
  
  // Initialize connection test
  if (process.env.NODE_ENV !== 'test') {
    testConnection();
  }
}

// Create a unified database interface that works with MariaDB/MySQL
const db = {
  async execute(sql: string, params?: any[]) {
    if (!mysqlPool) throw new Error('Database access is only available on the server');
    return mysqlPool.execute(sql, params || []);
  },
  
  async query(sql: string, params?: any[]) {
    if (!mysqlPool) throw new Error('Database access is only available on the server');
    return mysqlPool.query(sql, params || []);
  },
  
  async getConnection() {
    if (!mysqlPool) throw new Error('Database access is only available on the server');
    return mysqlPool.getConnection();
  }
};

export default db;
