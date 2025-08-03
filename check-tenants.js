const mysql = require('mysql2/promise');

async function checkTenants() {
    console.log('🔍 Checking what tenants exist in the database...');
    
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
            console.log(`✅ Connected to database`);
            break;
        } catch (err) {
            continue;
        }
    }
    
    if (!connection) {
        console.log('❌ Could not connect to database');
        return;
    }

    try {
        // Check tenants table
        const [tenants] = await connection.execute('SELECT * FROM tenants LIMIT 10');
        console.log(`\n🏢 Found ${tenants.length} tenants:`);
        tenants.forEach(tenant => {
            console.log(`  - ${tenant.id}: ${tenant.name} (${tenant.subdomain})`);
        });

        // Check unique tenant_ids in menu_items
        const [menuTenants] = await connection.execute(
            'SELECT DISTINCT tenant_id, COUNT(*) as item_count FROM menu_items GROUP BY tenant_id'
        );
        console.log(`\n📋 Menu items by tenant:`);
        menuTenants.forEach(tenant => {
            console.log(`  - ${tenant.tenant_id}: ${tenant.item_count} items`);
        });

        // Look for any items that might be related to 7UP
        const [sevenUpLike] = await connection.execute(
            `SELECT DISTINCT tenant_id, name FROM menu_items WHERE name LIKE '%7%' OR name LIKE '%UP%' OR name LIKE '%Seven%' LIMIT 10`
        );
        console.log(`\n🥤 Items with 7UP-like names:`);
        sevenUpLike.forEach(item => {
            console.log(`  - Tenant: ${item.tenant_id}, Item: ${item.name}`);
        });

        // Check if any items have add-ons at all
        const [itemsWithAddons] = await connection.execute(
            `SELECT tenant_id, name, addons FROM menu_items WHERE addons IS NOT NULL AND addons != '' AND addons != 'null' AND addons != '[]' LIMIT 5`
        );
        console.log(`\n🔧 Items with non-empty add-ons:`);
        itemsWithAddons.forEach(item => {
            console.log(`  - Tenant: ${item.tenant_id}, Item: ${item.name}`);
            console.log(`    Addons: ${item.addons}`);
        });

    } catch (error) {
        console.error('❌ Query failed:', error);
    } finally {
        await connection.end();
    }
}

checkTenants();
