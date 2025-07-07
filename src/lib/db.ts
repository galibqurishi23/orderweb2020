import mysql from 'mysql2/promise';
import * as sqlite from 'sqlite3';
import { open, Database } from 'sqlite';
import fs from 'fs';
import path from 'path';

// Determine if we're using SQLite or MariaDB/MySQL
const dbType = process.env.DATABASE_TYPE || 'mariadb';

// SQLite connection for development/testing
let sqliteDb: Database | null = null;

async function getSqliteConnection() {
  if (!sqliteDb) {
    const dbPath = process.env.DATABASE_FILE || 'restaurant.db';
    
    // Ensure the database file exists
    const dbFilePath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
    
    if (!fs.existsSync(dbFilePath)) {
      // Create empty file if it doesn't exist
      fs.writeFileSync(dbFilePath, '');
    }
    
    sqliteDb = await open({
      filename: dbFilePath,
      driver: sqlite.Database
    });
    
    console.log(`Connected to SQLite database at ${dbFilePath}`);
  }
  
  return sqliteDb;
}

// MariaDB/MySQL connection pool for production
const mysqlPool = (dbType === 'mysql' || dbType === 'mariadb') ? mysql.createPool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 3306,
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'orderwebdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true, // Allow multiple SQL statements for initialization
}) : null;

// Create a unified database interface that works with either SQLite or MariaDB/MySQL
const db = {
  async execute(sql: string, params?: any[]) {
    if (dbType === 'sqlite') {
      const db = await getSqliteConnection();
      try {
        const result = await db.all(sql, params || []);
        return [result];
      } catch (err) {
        console.error('SQLite error:', err);
        throw err;
      }
    } else if (dbType === 'mysql' || dbType === 'mariadb') {
      return mysqlPool!.execute(sql, params || []);
    } else {
      throw new Error(`Unsupported database type: ${dbType}`);
    }
  },
  
  async query(sql: string, params?: any[]) {
    if (dbType === 'sqlite') {
      const db = await getSqliteConnection();
      try {
        const result = await db.all(sql, params || []);
        return [result];
      } catch (err) {
        console.error('SQLite error:', err);
        throw err;
      }
    } else if (dbType === 'mysql' || dbType === 'mariadb') {
      return mysqlPool!.query(sql, params || []);
    } else {
      throw new Error(`Unsupported database type: ${dbType}`);
    }
  },
  
  async getConnection() {
    if (dbType === 'sqlite') {
      // For SQLite, we simulate a connection object with transaction methods
      const db = await getSqliteConnection();
      return {
        execute: async (sql: string, params?: any[]) => {
          const result = await db.all(sql, params || []);
          return [result];
        },
        query: async (sql: string, params?: any[]) => {
          const result = await db.all(sql, params || []);
          return [result];
        },
        beginTransaction: async () => {
          await db.run('BEGIN TRANSACTION');
        },
        commit: async () => {
          await db.run('COMMIT');
        },
        rollback: async () => {
          await db.run('ROLLBACK');
        },
        release: () => {
          // No-op for SQLite
        }
      };
    } else if (dbType === 'mysql' || dbType === 'mariadb') {
      return mysqlPool!.getConnection();
    } else {
      throw new Error(`Unsupported database type: ${dbType}`);
    }
  }
};

export default db;
