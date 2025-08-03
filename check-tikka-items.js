const mysql = require('mysql2/promise');

async function checkTikkaItems() {
    console.log('🔍 Checking menu items for Tikka tenant...');
    
    const tikkaTenantId = 'aaf6377d-3b12-4da5-80bb-c5bc2b7de555';
    
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

    try {
        // Check Tikka tenant items
        const [tikkaItems] = await connection.execute(
            'SELECT id, name, addons FROM menu_items WHERE tenant_id = ? ORDER BY name',
            [tikkaTenantId]
        );
        
        console.log(`\n📋 Tikka tenant menu items (${tikkaItems.length} items):`);
        tikkaItems.forEach((item, index) => {
            console.log(`\n${index + 1}. 📦 ${item.name} (ID: ${item.id})`);
            console.log(`   🔧 Addons: ${item.addons || 'null'}`);
            
            if (item.addons && item.addons !== 'null' && item.addons !== '[]') {
                try {
                    const parsed = JSON.parse(item.addons);
                    console.log(`   ✅ Parsed addons: ${Array.isArray(parsed) ? parsed.length : 'Not array'} items`);
                    if (Array.isArray(parsed)) {
                        parsed.forEach((addon, i) => {
                            console.log(`      ${i + 1}. ${addon.name} - $${addon.price}`);
                        });
                    }
                } catch (e) {
                    console.log(`   ❌ Parse error: ${e.message}`);
                }
            }
        });

        // Move 7UP item with add-ons to Tikka tenant
        console.log(`\n🔄 Moving 7UP item with add-ons to Tikka tenant...`);
        
        const [moveResult] = await connection.execute(
            'UPDATE menu_items SET tenant_id = ? WHERE tenant_id = ? AND name = ?',
            [tikkaTenantId, '99e4c43c-134b-4ee5-8b9c-fa27b6660bf0', '7Up']
        );
        
        console.log(`✅ Moved 7Up item to Tikka tenant (affected rows: ${moveResult.affectedRows})`);
        
        // Verify the move
        const [verifyItems] = await connection.execute(
            'SELECT id, name, addons FROM menu_items WHERE tenant_id = ? AND name LIKE ?',
            [tikkaTenantId, '%7%']
        );
        
        console.log(`\n🥤 7UP items now in Tikka tenant:`);
        verifyItems.forEach(item => {
            console.log(`  - ${item.name} (ID: ${item.id})`);
            if (item.addons && item.addons !== 'null' && item.addons !== '[]') {
                const parsed = JSON.parse(item.addons);
                console.log(`    ✅ Has ${parsed.length} add-ons`);
            } else {
                console.log(`    ❌ No add-ons`);
            }
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await connection.end();
    }
}

checkTikkaItems();
