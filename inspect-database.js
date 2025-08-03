#!/usr/bin/env node

/**
 * Database Schema Inspector
 * Check the actual structure of customers and orders tables
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

async function connectToDatabase() {
    const configs = [
        { host: 'localhost', user: 'root', password: '', database: 'dinedesk_db' },
        { host: 'localhost', user: 'root', password: 'root', database: 'dinedesk_db' },
        { host: 'localhost', user: 'root', password: 'Root@2020!', database: 'dinedesk_db' },
        { host: 'localhost', user: 'root', password: 'password', database: 'dinedesk_db' }
    ];
    
    for (const config of configs) {
        try {
            const connection = await mysql.createConnection(config);
            log(`✅ Connected to database with user: ${config.user}`, colors.green);
            return connection;
        } catch (err) {
            continue;
        }
    }
    
    throw new Error('Could not connect to database');
}

async function inspectTable(connection, tableName) {
    log(`\n📋 Inspecting ${tableName} table structure:`, colors.blue);
    
    try {
        const [columns] = await connection.query(`DESCRIBE ${tableName}`);
        columns.forEach(col => {
            log(`   ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`, colors.cyan);
        });
        
        const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        log(`   📊 Total records: ${count[0].count}`, colors.yellow);
        
    } catch (error) {
        log(`❌ Error inspecting ${tableName}: ${error.message}`, colors.red);
    }
}

async function listCustomers(connection) {
    log('\n👥 Current customers:', colors.blue);
    
    try {
        const [customers] = await connection.query(`
            SELECT id, name, email, phone, tenant_id, created_at
            FROM customers 
            ORDER BY created_at DESC 
            LIMIT 10
        `);

        if (customers.length === 0) {
            log('📭 No customers found', colors.yellow);
        } else {
            customers.forEach((customer, index) => {
                log(`${index + 1}. ID: ${customer.id} | ${customer.name} | ${customer.email}`, colors.cyan);
            });
        }
        
    } catch (error) {
        log(`❌ Error listing customers: ${error.message}`, colors.red);
    }
}

async function checkOrdersTable(connection) {
    log('\n📋 Checking orders table for customer references:', colors.blue);
    
    try {
        // Check if there's a customer_id column or similar
        const [columns] = await connection.query(`DESCRIBE orders`);
        const customerColumns = columns.filter(col => 
            col.Field.toLowerCase().includes('customer') ||
            col.Field.toLowerCase().includes('user')
        );
        
        if (customerColumns.length > 0) {
            log('🔍 Found potential customer reference columns:', colors.green);
            customerColumns.forEach(col => {
                log(`   ${col.Field} | ${col.Type}`, colors.cyan);
            });
        } else {
            log('⚠️ No customer reference columns found in orders table', colors.yellow);
        }
        
        // Sample some orders to see the structure
        const [orders] = await connection.query(`SELECT * FROM orders LIMIT 3`);
        if (orders.length > 0) {
            log('\n📄 Sample order structure:', colors.blue);
            log(JSON.stringify(orders[0], null, 2), colors.cyan);
        }
        
    } catch (error) {
        log(`❌ Error checking orders table: ${error.message}`, colors.red);
    }
}

async function main() {
    log('🔍 Database Schema Inspector', colors.bright + colors.cyan);
    log('==========================', colors.cyan);
    
    let connection;
    
    try {
        connection = await connectToDatabase();
        
        // Inspect main tables
        await inspectTable(connection, 'customers');
        await inspectTable(connection, 'orders');
        await inspectTable(connection, 'tenants');
        
        // List current customers
        await listCustomers(connection);
        
        // Check orders table for customer references
        await checkOrdersTable(connection);
        
    } catch (error) {
        log(`❌ Inspection failed: ${error.message}`, colors.red);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

if (require.main === module) {
    main();
}
