const mysql = require('mysql2/promise');

async function migrateColorScheme() {
    let connection;
    
    try {
        // Database connection config - use the same as in your app
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'root',
            database: process.env.DB_NAME || 'dinedesk_db',
            port: process.env.DB_PORT || 3306,
            multipleStatements: true
        });

        console.log('Connected to database successfully!');

        // Check current table structure
        console.log('\n--- Current shop_settings table structure ---');
        const [currentStructure] = await connection.query('DESCRIBE shop_settings');
        console.table(currentStructure);

        // Check if new columns already exist
        const columnNames = currentStructure.map(row => row.Field);
        const newColumns = ['front_color', 'button_color', 'button_border_color'];
        const existingNewColumns = newColumns.filter(col => columnNames.includes(col));
        const missingColumns = newColumns.filter(col => !columnNames.includes(col));

        if (existingNewColumns.length > 0) {
            console.log(`\nNew columns already exist: ${existingNewColumns.join(', ')}`);
        }

        if (missingColumns.length === 0) {
            console.log('\nAll new color columns already exist. Migration not needed.');
            return;
        }

        console.log(`\nMissing columns to add: ${missingColumns.join(', ')}`);

        // Add new color columns
        const alterQueries = [];
        
        if (missingColumns.includes('front_color')) {
            alterQueries.push("ALTER TABLE shop_settings ADD COLUMN front_color VARCHAR(7) DEFAULT '#3b82f6'");
        }
        
        if (missingColumns.includes('button_color')) {
            alterQueries.push("ALTER TABLE shop_settings ADD COLUMN button_color VARCHAR(7) DEFAULT '#10b981'");
        }
        
        if (missingColumns.includes('button_border_color')) {
            alterQueries.push("ALTER TABLE shop_settings ADD COLUMN button_border_color VARCHAR(7) DEFAULT '#10b981'");
        }

        // Execute migration queries
        for (const query of alterQueries) {
            console.log(`\nExecuting: ${query}`);
            await connection.query(query);
            console.log('✅ Column added successfully');
        }

        // Migrate existing data from old columns to new columns
        console.log('\n--- Migrating existing data ---');
        
        const [existingRows] = await connection.query('SELECT * FROM shop_settings');
        console.log(`Found ${existingRows.length} existing shop settings records`);

        for (const row of existingRows) {
            const updates = [];
            const values = [];
            
            // Map old colors to new colors
            if (row.primary_color && !row.front_color) {
                updates.push('front_color = ?');
                values.push(row.primary_color);
            }
            
            if (row.secondary_color && !row.button_color) {
                updates.push('button_color = ?');
                values.push(row.secondary_color);
            }
            
            if (row.accent_color && !row.button_border_color) {
                updates.push('button_border_color = ?');
                values.push(row.accent_color);
            }

            if (updates.length > 0) {
                values.push(row.id);
                const updateQuery = `UPDATE shop_settings SET ${updates.join(', ')} WHERE id = ?`;
                console.log(`Updating record ${row.id}: ${updates.join(', ')}`);
                await connection.query(updateQuery, values);
            }
        }

        // Show final table structure
        console.log('\n--- Final shop_settings table structure ---');
        const [finalStructure] = await connection.query('DESCRIBE shop_settings');
        console.table(finalStructure);

        console.log('\n🎉 Color scheme migration completed successfully!');
        console.log('\nNew color columns added:');
        console.log('- front_color: Main accent color for text and icons');
        console.log('- button_color: Primary button background color');
        console.log('- button_border_color: Button border and secondary elements color');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nDatabase connection closed.');
        }
    }
}

// Run migration
migrateColorScheme()
    .then(() => {
        console.log('\n✅ Migration script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration script failed:', error);
        process.exit(1);
    });
