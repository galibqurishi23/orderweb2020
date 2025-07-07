'use server';

import fs from 'fs/promises';
import path from 'path';
import db from './db';

// Determine if we're using SQLite or MySQL
const dbType = process.env.DATABASE_TYPE || 'sqlite';

/**
 * Checks if the database is already initialized.
 * @returns {Promise<boolean>} - True if initialized, false otherwise.
 */
async function isDatabaseInitialized(): Promise<boolean> {
  try {
    if (dbType === 'sqlite') {
      // For SQLite, check if restaurant_settings table exists
      const [rows] = await db.query(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='restaurant_settings'
      `);
      return (rows as any[]).length > 0;
    } else {
      // For MySQL
      const [rows] = await db.query("SHOW TABLES LIKE 'restaurant_settings'");
      return (rows as any[]).length > 0;
    }
  } catch (error) {
    console.error('Error checking database initialization:', error);
    return false;
  }
}

/**
 * Reads the init.sql file and executes it to set up the database schema and data.
 */
async function runInitializationScript(): Promise<void> {
  try {
    console.log('Database not initialized. Running setup script...');
    
    // Choose the appropriate schema file based on database type
    let sqlFilePath;
    if (dbType === 'sqlite') {
      sqlFilePath = path.join(process.cwd(), 'init-sqlite.sql');
      console.log('Using SQLite schema file');
    } else {
      sqlFilePath = path.join(process.cwd(), 'init.sql');
      console.log('Using MySQL schema file');
    }
    
    const sqlScript = await fs.readFile(sqlFilePath, 'utf-8');
    
    if (dbType === 'sqlite') {
      // For SQLite, execute statement by statement
      const statements = sqlScript
        .replace(/^\s*--.*$/gm, '') // Remove comments
        .split(';')
        .filter(statement => statement.trim().length > 0);
      
      for (const statement of statements) {
        try {
          await db.execute(statement);
        } catch (err) {
          console.error('Failed to execute statement:', statement);
          console.error('Error:', err);
          // Continue to next statement rather than failing completely
        }
      }
    } else {
      // For MySQL, execute the script as a whole
      await db.query(sqlScript);
    }
    
    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Failed to execute initialization script:', error);
    throw new Error('Database setup failed.');
  }
}

/**
 * Main function to ensure the database is initialized before the app uses it.
 */
export async function initializeDatabase(): Promise<void> {
  const isInitialized = await isDatabaseInitialized();
  if (!isInitialized) {
    await runInitializationScript();
  } else {
    console.log('Database is already initialized.');
  }
}
