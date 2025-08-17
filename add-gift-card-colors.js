const mysql = require('mysql2/promise');

async function addGiftCardColors() {
    let connection;
    
    try {
        // Create connection for MariaDB (compatible with mysql2)
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '', // MariaDB default
            database: 'dinedesk_db', // Correct database name
            multipleStatements: true,
            charset: 'utf8mb4'
        });

        console.log('Connected to MariaDB successfully');

        // Check if columns already exist
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'dinedesk_db' 
            AND TABLE_NAME = 'shop_settings' 
            AND COLUMN_NAME IN ('gift_card_background_color', 'gift_card_border_color', 'gift_card_button_color')
        `);

        const existingColumns = columns.map(col => col.COLUMN_NAME);
        
        // Add columns that don't exist
        if (!existingColumns.includes('gift_card_background_color')) {
            await connection.execute(`
                ALTER TABLE shop_settings 
                ADD COLUMN gift_card_background_color VARCHAR(7) DEFAULT '#dbeafe'
            `);
            console.log('Added gift_card_background_color column');
        } else {
            console.log('gift_card_background_color column already exists');
        }

        if (!existingColumns.includes('gift_card_border_color')) {
            await connection.execute(`
                ALTER TABLE shop_settings 
                ADD COLUMN gift_card_border_color VARCHAR(7) DEFAULT '#3b82f6'
            `);
            console.log('Added gift_card_border_color column');
        } else {
            console.log('gift_card_border_color column already exists');
        }

        if (!existingColumns.includes('gift_card_button_color')) {
            await connection.execute(`
                ALTER TABLE shop_settings 
                ADD COLUMN gift_card_button_color VARCHAR(7) DEFAULT '#1d4ed8'
            `);
            console.log('Added gift_card_button_color column');
        } else {
            console.log('gift_card_button_color column already exists');
        }

        console.log('Gift card color columns migration completed successfully!');

    } catch (error) {
        console.error('Error adding gift card color columns:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

addGiftCardColors();
