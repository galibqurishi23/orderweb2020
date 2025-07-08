import mysql from 'mysql2/promise';

// Use MariaDB/MySQL exclusively
const dbType = 'mariadb';

// MariaDB/MySQL connection pool
const mysqlPool = mysql.createPool({
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

// Create a unified database interface that works with MariaDB/MySQL
const db = {
  async execute(sql: string, params?: any[]) {
    return mysqlPool.execute(sql, params || []);
  },
  
  async query(sql: string, params?: any[]) {
    return mysqlPool.query(sql, params || []);
  },
  
  async getConnection() {
    return mysqlPool.getConnection();
  }
};

export default db;
