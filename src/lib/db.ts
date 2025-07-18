// NOTE: This file cannot use 'use server' because it exports an object

import mysql, { RowDataPacket } from 'mysql2/promise';

// Use MariaDB/MySQL exclusively
const dbType = 'mariadb';

// Check if we're running on the server
let mysqlPool: mysql.Pool | null = null;

// Only create the pool if running on the server
if (typeof window === 'undefined') {
  // MariaDB/MySQL connection pool with environment variables and optimized settings
  const poolConfig: mysql.PoolOptions = {
    host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DB_PORT || process.env.DATABASE_PORT) || 3306,
    user: process.env.DB_USER || process.env.DATABASE_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || 'root',
    database: process.env.DB_NAME || process.env.DATABASE_NAME || 'dinedesk_db',
    waitForConnections: true,
    connectionLimit: process.env.NODE_ENV === 'production' ? 25 : 10, // Reduced to prevent connection exhaustion
    queueLimit: 20, // Limit queued connections
    multipleStatements: true, // Allow multiple SQL statements for initialization
    charset: 'utf8mb4',
    // Additional optimizations
    dateStrings: false,
    supportBigNumbers: true,
    bigNumberStrings: false
  };

  // Add SSL configuration only if enabled
  if (process.env.DB_SSL === 'true') {
    poolConfig.ssl = {
      rejectUnauthorized: false
    };
  }

  mysqlPool = mysql.createPool(poolConfig);
  
  // Test connection and auto-initialize on startup
  async function testConnection() {
    try {
      if (mysqlPool) {
        const connection = await mysqlPool.getConnection();
        
        // Check if database is initialized
        try {
          await connection.execute('SELECT 1 FROM super_admin_users LIMIT 1');
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Database connected and initialized');
          }
        } catch (tableError) {
          // Database not initialized, try to auto-initialize
          console.log('🔄 Database not initialized, attempting auto-setup...');
          
          // Import and run database setup
          try {
            const { default: DatabaseSetup } = await import('./database-setup');
            const setup = new DatabaseSetup();
            const success = await setup.setupDatabase();
            
            if (success) {
              console.log('✅ Database auto-initialization completed');
            } else {
              console.error('❌ Database auto-initialization failed');
              console.error('💡 Please run: npm run setup or call /api/setup');
            }
          } catch (setupError) {
            console.error('❌ Database setup import failed:', setupError);
            console.error('💡 Please run: npm run setup or call /api/setup');
          }
        }
        
        connection.release();
      }
    } catch (error) {
      console.error('❌ Database connection failed:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Please check your database configuration in .env file');
      if (process.env.NODE_ENV === 'development') {
        console.error('Run: npm run setup to initialize the database');
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
    try {
      return await mysqlPool.execute(sql, params || []);
    } catch (error) {
      console.error('Database execute error:', error);
      throw error;
    }
  },
  
  async query<T extends RowDataPacket[]>(sql: string, params?: any[]) {
    if (!mysqlPool) throw new Error('Database access is only available on the server');
    try {
      return await mysqlPool.query<T>(sql, params || []);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },
  
  async getConnection() {
    if (!mysqlPool) throw new Error('Database access is only available on the server');
    try {
      return await mysqlPool.getConnection();
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  },

  // Add method to safely use connections with automatic cleanup
  async withConnection<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
    if (!mysqlPool) throw new Error('Database access is only available on the server');
    
    const connection = await mysqlPool.getConnection();
    try {
      return await callback(connection);
    } finally {
      connection.release();
    }
  },

  // Method to check pool status
  getPoolStatus() {
    if (!mysqlPool) return null;
    
    // TypeScript doesn't have these properties in the type definitions, but they exist at runtime
    const pool = mysqlPool as any;
    return {
      allConnections: pool._allConnections?.length || 0,
      freeConnections: pool._freeConnections?.length || 0,
      connectionQueue: pool._connectionQueue?.length || 0,
      acquiringConnections: pool._acquiringConnections?.length || 0
    };
  }
};

export default db;
