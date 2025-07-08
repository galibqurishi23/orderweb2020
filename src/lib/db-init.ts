'use server';
// This file contains server-only code for database initialization

import fs from 'fs/promises';
import path from 'path';
import db from './db';

// Use MariaDB/MySQL exclusively
const dbType = 'mariadb';

/**
 * Checks if the database is already initialized.
 * @returns {Promise<boolean>} - True if initialized, false otherwise.
 */
async function isDatabaseInitialized(): Promise<boolean> {
  try {
    // For MariaDB/MySQL
    const [rows] = await db.query("SHOW TABLES LIKE 'restaurant_settings'");
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
    
    // Use MySQL/MariaDB schema file
    const sqlFilePath = path.join(process.cwd(), 'init.sql');
    console.log('Using MariaDB/MySQL schema file');
    const sqlScript = await fs.readFile(sqlFilePath, 'utf-8');
    
    // For MariaDB/MySQL, execute the script as a whole
    await db.query(sqlScript);
    
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
