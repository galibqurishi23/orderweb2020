#!/usr/bin/env node

/**
 * Check Addresses Table Structure
 */

const mysql = require('mysql2/promise');

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
            console.log('✅ Connected to database');
            return connection;
        } catch (err) {
            continue;
        }
    }
    
    throw new Error('Could not connect to database');
}

async function main() {
    let connection;
    
    try {
        connection = await connectToDatabase();
        
        // Check if addresses table exists
        const [tables] = await connection.query("SHOW TABLES LIKE 'addresses'");
        if (tables.length === 0) {
            console.log('❌ Addresses table does not exist');
            return;
        }
        
        console.log('\n📋 Addresses table structure:');
        const [columns] = await connection.query("DESCRIBE addresses");
        columns.forEach(col => {
            console.log(`   ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`);
        });
        
        // Check sample data
        const [sample] = await connection.query("SELECT * FROM addresses LIMIT 3");
        if (sample.length > 0) {
            console.log('\n📄 Sample data:');
            console.log(JSON.stringify(sample[0], null, 2));
        }
        
        // Check all tables that might have customer references
        console.log('\n🔍 All tables with potential customer references:');
        const [allTables] = await connection.query("SHOW TABLES");
        
        for (const table of allTables) {
            const tableName = table[Object.keys(table)[0]];
            try {
                const [cols] = await connection.query(`DESCRIBE ${tableName}`);
                const customerCols = cols.filter(col => 
                    col.Field.toLowerCase().includes('customer') ||
                    col.Field.toLowerCase().includes('user_id')
                );
                
                if (customerCols.length > 0) {
                    console.log(`\n📋 ${tableName}:`);
                    customerCols.forEach(col => {
                        console.log(`   ${col.Field} | ${col.Type}`);
                    });
                }
            } catch (err) {
                // Skip tables we can't access
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

main();
