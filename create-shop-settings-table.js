const mysql = require('mysql2/promise');

async function createShopSettingsTable() {
    let connection;
    
    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'dinedesk_db',
            port: process.env.DB_PORT || 3306,
            multipleStatements: true
        });

        console.log('Connected to database successfully!');

        // Check if shop_settings table exists
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'shop_settings'
        `, [process.env.DB_NAME || 'dinedesk_db']);

        if (tables.length > 0) {
            console.log('shop_settings table already exists');
            
            // Check current structure
            const [columns] = await connection.execute('DESCRIBE shop_settings');
            console.log('Current table structure:');
            console.table(columns);
            
            // Check for missing columns and add them
            const currentColumns = columns.map(col => col.Field);
            const requiredColumns = [
                'cover_image_url',
                'logo_url', 
                'display_name',
                'description',
                'front_color',
                'card_background',
                'border_color',
                'color_theme',
                'gift_card_background_color',
                'gift_card_border_color',
                'gift_card_button_color'
            ];

            const missingColumns = requiredColumns.filter(col => !currentColumns.includes(col));
            
            if (missingColumns.length > 0) {
                console.log(`Adding missing columns: ${missingColumns.join(', ')}`);
                
                for (const column of missingColumns) {
                    let defaultValue = 'NULL';
                    
                    // Set appropriate defaults for color columns
                    if (column === 'front_color') defaultValue = "'#3b82f6'";
                    if (column === 'card_background') defaultValue = "'#ffffff'";
                    if (column === 'border_color') defaultValue = "'#e5e7eb'";
                    if (column === 'color_theme') defaultValue = "'blue'";
                    if (column === 'gift_card_background_color') defaultValue = "'#dbeafe'";
                    if (column === 'gift_card_border_color') defaultValue = "'#3b82f6'";
                    if (column === 'gift_card_button_color') defaultValue = "'#1d4ed8'";
                    
                    const dataType = column.includes('color') || column === 'color_theme' ? 'VARCHAR(7)' : 'VARCHAR(500)';
                    
                    await connection.execute(`
                        ALTER TABLE shop_settings 
                        ADD COLUMN ${column} ${dataType} DEFAULT ${defaultValue}
                    `);
                    console.log(`✅ Added column: ${column}`);
                }
            }
        } else {
            console.log('Creating shop_settings table...');
            
            // Create the table with all required columns
            await connection.execute(`
                CREATE TABLE shop_settings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    tenant_id VARCHAR(255) NOT NULL,
                    cover_image_url VARCHAR(500) DEFAULT NULL,
                    logo_url VARCHAR(500) DEFAULT NULL,
                    display_name VARCHAR(255) DEFAULT NULL,
                    description TEXT DEFAULT NULL,
                    front_color VARCHAR(7) DEFAULT '#3b82f6',
                    card_background VARCHAR(7) DEFAULT '#ffffff',
                    border_color VARCHAR(7) DEFAULT '#e5e7eb',
                    color_theme VARCHAR(7) DEFAULT 'blue',
                    gift_card_background_color VARCHAR(7) DEFAULT '#dbeafe',
                    gift_card_border_color VARCHAR(7) DEFAULT '#3b82f6',
                    gift_card_button_color VARCHAR(7) DEFAULT '#1d4ed8',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_tenant (tenant_id),
                    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            
            console.log('✅ shop_settings table created successfully');
        }

        // Show final table structure
        console.log('\n--- Final shop_settings table structure ---');
        const [finalStructure] = await connection.execute('DESCRIBE shop_settings');
        console.table(finalStructure);

        console.log('\n✅ Shop settings table setup completed successfully!');

    } catch (error) {
        console.error('❌ Error setting up shop_settings table:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

createShopSettingsTable();
