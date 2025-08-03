const mysql = require('mysql2/promise');

async function checkMenuItems() {
    console.log('🔍 Checking all menu items for 7UP tenant...');
    
    const configs = [
        { host: 'localhost', user: 'root', password: '', database: 'dinedesk_db' },
        { host: 'localhost', user: 'root', password: 'root', database: 'dinedesk_db' },
        { host: 'localhost', user: 'root', password: 'Root@2020!', database: 'dinedesk_db' },
        { host: 'localhost', user: 'root', password: 'password', database: 'dinedesk_db' }
    ];
    
    let connection;
    
    for (const config of configs) {
        try {
            connection = await mysql.createConnection(config);
            console.log(`✅ Connected to database with user: ${config.user}`);
            break;
        } catch (err) {
            console.log(`❌ Failed to connect with user ${config.user}: ${err.message}`);
            continue;
        }
    }
    
    if (!connection) {
        console.log('❌ Could not connect to database');
        return;
    }

    try {
        // Check all menu items for 7UP
        const [allItems] = await connection.execute(
            `SELECT id, name, addons FROM menu_items WHERE tenant_id = '7UP' ORDER BY name`
        );
        
        console.log(`\n📋 Found ${allItems.length} menu items for 7UP:`);
        allItems.forEach((item, index) => {
            console.log(`\n${index + 1}. 📦 ${item.name} (ID: ${item.id})`);
            console.log(`   🔧 Addons field: ${item.addons}`);
            console.log(`   📏 Addons length: ${item.addons ? item.addons.length : 'null'}`);
            
            if (item.addons && item.addons !== 'null' && item.addons !== '[]') {
                try {
                    const parsed = JSON.parse(item.addons);
                    console.log(`   ✅ Parsed: ${JSON.stringify(parsed)}`);
                    console.log(`   📊 Count: ${Array.isArray(parsed) ? parsed.length : 'Not array'}`);
                } catch (e) {
                    console.log(`   ❌ Parse error: ${e.message}`);
                }
            }
        });

        // Specifically look for the 7UP item
        const [sevenUpItems] = await connection.execute(
            `SELECT id, name, addons FROM menu_items WHERE tenant_id = '7UP' AND (name LIKE '%7UP%' OR name LIKE '%Seven%')`
        );
        
        console.log(`\n🥤 7UP specific items found: ${sevenUpItems.length}`);
        sevenUpItems.forEach(item => {
            console.log(`\n📦 ${item.name} (ID: ${item.id})`);
            console.log(`🔧 Addons: ${item.addons}`);
        });

    } catch (error) {
        console.error('❌ Query failed:', error);
    } finally {
        await connection.end();
    }
}

checkMenuItems();
