const mysql = require('mysql2/promise');

async function checkTenantStructure() {
    console.log('🔍 Checking tenant table structure...');
    
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
        // Check table structure
        const [columns] = await connection.execute('DESCRIBE tenants');
        console.log(`\n📋 Tenants table structure:`);
        columns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'nullable' : 'not null'})`);
        });

        // Get tenant data with actual columns
        const [tenants] = await connection.execute('SELECT * FROM tenants');
        console.log(`\n🏢 All tenants:`);
        tenants.forEach(tenant => {
            console.log(`\n  Tenant: ${tenant.name || tenant.id}`);
            Object.keys(tenant).forEach(key => {
                if (tenant[key] !== null) {
                    console.log(`    ${key}: ${tenant[key]}`);
                }
            });
        });

        // Check which tenant has our target ID
        const targetTenantId = '99e4c43c-134b-4ee5-8b9c-fa27b6660bf0';
        const [targetTenant] = await connection.execute(
            'SELECT * FROM tenants WHERE id = ?',
            [targetTenantId]
        );
        
        if (targetTenant.length > 0) {
            console.log(`\n⭐ Found target tenant with 7UP add-ons:`);
            Object.keys(targetTenant[0]).forEach(key => {
                console.log(`  ${key}: ${targetTenant[0][key]}`);
            });
        } else {
            console.log(`\n❌ Target tenant ${targetTenantId} not found in tenants table`);
            console.log(`This means the tenant with 7UP add-ons might not be properly registered.`);
        }

    } catch (error) {
        console.error('❌ Query failed:', error);
    } finally {
        await connection.end();
    }
}

checkTenantStructure();
