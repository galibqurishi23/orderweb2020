/**
 * Database Migration: Add display_order columns for menu management
 * This script adds display_order columns to categories and menu_items tables if they don't exist
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'dinedesk_db'
  });

  try {
    console.log('🔄 Starting menu ordering migration...');

    // Check if display_order exists in categories table
    const [categoriesColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'display_order'
    `, [process.env.DB_NAME || 'dinedesk_db']);

    if (categoriesColumns.length === 0) {
      console.log('Adding display_order column to categories table...');
      await connection.execute(`
        ALTER TABLE categories 
        ADD COLUMN display_order INT DEFAULT 0 AFTER active
      `);
      console.log('✅ Added display_order to categories table');
    } else {
      console.log('✅ display_order already exists in categories table');
    }

    // Check if display_order exists in menu_items table
    const [itemsColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'menu_items' AND COLUMN_NAME = 'display_order'
    `, [process.env.DB_NAME || 'dinedesk_db']);

    if (itemsColumns.length === 0) {
      console.log('Adding display_order column to menu_items table...');
      await connection.execute(`
        ALTER TABLE menu_items 
        ADD COLUMN display_order INT DEFAULT 0 AFTER preparation_time
      `);
      console.log('✅ Added display_order to menu_items table');
    } else {
      console.log('✅ display_order already exists in menu_items table');
    }

    // Initialize display_order values for existing records
    console.log('🔄 Initializing display_order values...');
    
    // For categories
    await connection.execute(`
      UPDATE categories 
      SET display_order = (
        SELECT ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at)
        FROM (SELECT * FROM categories) as c2 
        WHERE c2.id = categories.id
      ) - 1
      WHERE display_order = 0
    `);

    // For menu items
    await connection.execute(`
      UPDATE menu_items 
      SET display_order = (
        SELECT ROW_NUMBER() OVER (PARTITION BY tenant_id, category_id ORDER BY created_at)
        FROM (SELECT * FROM menu_items) as m2 
        WHERE m2.id = menu_items.id
      ) - 1
      WHERE display_order = 0
    `);

    console.log('✅ Migration completed successfully!');
    console.log('🎉 Drag-and-drop ordering is now available for categories and menu items.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
