#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function main() {
  console.log('Starting database initialization...');
  
  try {
    // Create connection to MariaDB
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      port: Number(process.env.DATABASE_PORT) || 3306,
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || 'root',
      multipleStatements: true
    });

    console.log('Connected to MariaDB/MySQL server');
    
    // Create database if it doesn't exist
    const dbName = process.env.DATABASE_NAME || 'dinedesk_db';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`Ensured database '${dbName}' exists`);
    
    // Use the database
    await connection.query(`USE \`${dbName}\`;`);
    
    // Check if tables already exist
    const [tables] = await connection.query('SHOW TABLES');
    const tableExists = tables.length > 0;
    
    if (tableExists) {
      console.log('Database tables already exist, skipping schema creation');
    } else {
      // Read the multi-tenant SQL schema
      const schemaPath = path.join(__dirname, '../init-multitenant.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      try {
        // Execute the schema
        console.log('Applying multi-tenant schema...');
        await connection.query(schema);
        console.log('Schema applied successfully');
      } catch (error) {
        console.error('Error applying schema:', error.message);
        
        // Continue execution, we'll check for super admin user anyway
        console.log('Continuing with database setup...');
      }
    }
    
    // Create a default super admin user if it doesn't exist
    const superAdminEmail = 'admin@dinedesk.com';
    const [rows] = await connection.query('SELECT * FROM super_admin_users WHERE email = ?', [superAdminEmail]);
    
    if (rows.length === 0) {
      // Hash password using the same algorithm as bcrypt
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Create super admin user
      await connection.query(
        'INSERT INTO super_admin_users (id, email, password, name, role, active) VALUES (UUID(), ?, ?, ?, ?, ?)',
        [superAdminEmail, hashedPassword, 'Super Admin', 'super_admin', true]
      );
      console.log('Created default super admin user: admin@dinedesk.com / admin123');
    } else {
      console.log('Default super admin user already exists');
    }
    
    console.log('Database initialization complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

main();
