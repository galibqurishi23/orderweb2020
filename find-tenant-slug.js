const mysql = require('mysql2/promise');

async function findTenantSlug() {
    console.log('🔍 Finding tenant slug for tenant with 7UP add-ons...');
    
    const targetTenantId = '99e4c43c-134b-4ee5-8b9c-fa27b6660bf0';
    
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
        // Find the tenant info for our target tenant ID
        const [tenantInfo] = await connection.execute(
            'SELECT id, name, subdomain, business_name, description FROM tenants WHERE id = ?',
            [targetTenantId]
        );
        
        if (tenantInfo.length > 0) {
            const tenant = tenantInfo[0];
            console.log(`\n🏢 Found tenant with 7UP add-ons:`);
            console.log(`  - ID: ${tenant.id}`);
            console.log(`  - Name: ${tenant.name}`);
            console.log(`  - Subdomain: ${tenant.subdomain}`);
            console.log(`  - Business Name: ${tenant.business_name}`);
            console.log(`  - Description: ${tenant.description}`);
            
            console.log(`\n🌐 You should access this tenant at:`);
            console.log(`  http://localhost:3000/${tenant.subdomain || tenant.name || tenant.id}`);
        } else {
            console.log(`❌ No tenant found with ID: ${targetTenantId}`);
        }

        // Also check all tenants to see URL mapping
        const [allTenants] = await connection.execute(
            'SELECT id, name, subdomain, business_name FROM tenants'
        );
        
        console.log(`\n📋 All tenants and their URL slugs:`);
        allTenants.forEach(tenant => {
            const slug = tenant.subdomain || tenant.name || tenant.id;
            console.log(`  - ${tenant.business_name || tenant.name}: http://localhost:3000/${slug}`);
            if (tenant.id === targetTenantId) {
                console.log(`    ⭐ This is the one with 7UP add-ons!`);
            }
        });

    } catch (error) {
        console.error('❌ Query failed:', error);
    } finally {
        await connection.end();
    }
}

findTenantSlug();
