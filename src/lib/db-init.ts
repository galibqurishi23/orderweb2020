'use server';

import fs from 'fs/promises';
import path from 'path';
import pool from './db';

/**
 * Checks if the database is already initialized.
 * @returns {Promise<boolean>} - True if initialized, false otherwise.
 */
async function isDatabaseInitialized(): Promise<boolean> {
  try {
    // Check if a key table (e.g., restaurant_settings) exists.
    const [rows] = await pool.query("SHOW TABLES LIKE 'restaurant_settings'");
    return (rows as any[]).length > 0;
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
    const sqlFilePath = path.join(process.cwd(), 'init.sql');
    const sqlScript = await fs.readFile(sqlFilePath, 'utf-8');
    
    // Execute the entire script. The `multipleStatements: true` in db.ts allows this.
    await pool.query(sqlScript);
    
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
