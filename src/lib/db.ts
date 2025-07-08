// NOTE: This file cannot use 'use server' because it exports an object

import mysql from 'mysql2/promise';

// Use MariaDB/MySQL exclusively
const dbType = 'mariadb';

// Check if we're running on the server
let mysqlPool: mysql.Pool | null = null;

// Only create the pool if running on the server
if (typeof window === 'undefined') {
  // MariaDB/MySQL connection pool
  mysqlPool = mysql.createPool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || 'root',
    database: process.env.DATABASE_NAME || 'dinedesk_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true, // Allow multiple SQL statements for initialization
  });
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
