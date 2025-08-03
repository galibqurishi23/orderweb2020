#!/usr/bin/env node

/**
 * Database update script to add specialInstructions field to orders table
 * This ensures overall order notes are properly stored and displayed everywhere
 */

const mysql = require('mysql2/promise');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
    console.log(color + message + colors.reset);
}

async function updateDatabase() {
    let connection;
    
    try {
        log('🔧 Adding specialInstructions field to orders table...', colors.blue);
        
        // Create connection - trying common database configurations
        const configs = [
            { host: 'localhost', user: 'root', password: '', database: 'dinedesk_db' },
            { host: 'localhost', user: 'root', password: 'root', database: 'dinedesk_db' },
            { host: 'localhost', user: 'root', password: 'Root@2020!', database: 'dinedesk_db' },
            { host: 'localhost', user: 'root', password: 'password', database: 'dinedesk_db' }
        ];
        
        for (const config of configs) {
            try {
                connection = await mysql.createConnection(config);
                log(`✅ Connected to database with user: ${config.user}`, colors.green);
                break;
            } catch (err) {
                log(`❌ Failed to connect with user ${config.user}: ${err.message}`, colors.red);
                continue;
            }
        }
        
        if (!connection) {
            log('❌ Could not connect to database with any configuration', colors.red);
            log('💡 Please ensure MySQL is running and update the credentials in this script', colors.yellow);
            return false;
        }
        
        // Check if column already exists
        const [columns] = await connection.query(
            `SHOW COLUMNS FROM orders LIKE 'specialInstructions'`
        );
        
        if (columns.length > 0) {
            log('✅ specialInstructions column already exists in orders table', colors.green);
            return true;
        }
        
        // Add the column
        await connection.query(`
            ALTER TABLE orders 
            ADD COLUMN specialInstructions TEXT DEFAULT NULL
            AFTER paymentMethod
        `);
        
        log('✅ Successfully added specialInstructions column to orders table', colors.green);
        
        // Verify the column was added
        const [newColumns] = await connection.query(
            `SHOW COLUMNS FROM orders LIKE 'specialInstructions'`
        );
        
        if (newColumns.length > 0) {
            log('✅ Column verification successful', colors.green);
            return true;
        } else {
            log('❌ Column verification failed', colors.red);
            return false;
        }
        
    } catch (error) {
        log(`❌ Database update failed: ${error.message}`, colors.red);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function main() {
    log('🚀 OrderWeb - Special Instructions Database Update', colors.bright + colors.cyan);
    log('================================================', colors.cyan);
    log('This script adds specialInstructions field to orders table', colors.yellow);
    log('so overall order notes can be displayed everywhere.\\n', colors.yellow);
    
    const success = await updateDatabase();
    
    if (success) {
        log('\\n🎉 Database update completed successfully!', colors.green + colors.bright);
        log('\\n📝 What this enables:', colors.cyan);
        log('✅ Order notes displayed in admin order management', colors.green);
        log('✅ Order notes shown in customer order history', colors.green);
        log('✅ Order notes included in kitchen receipts', colors.green);
        log('✅ Order notes included in customer receipts', colors.green);
        log('✅ Order notes included in bar receipts', colors.green);
        log('✅ Order notes displayed in kitchen displays', colors.green);
        log('✅ Order notes included in email confirmations', colors.green);
    } else {
        log('\\n❌ Database update failed', colors.red);
        log('Please check your database connection and try again', colors.yellow);
    }
}

if (require.main === module) {
    main();
}
