const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

async function setupKitchenTenant() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'orderweb_db',
        charset: 'utf8mb4'
    };

    let connection;
    try {
        console.log('🔗 Connecting to database...');
        connection = await mysql.createConnection(config);
        console.log('✅ Connected to database');

        // Check if kitchen tenant already exists
        const [existingTenant] = await connection.execute(
            'SELECT id FROM tenants WHERE slug = ?',
            ['kitchen']
        );
        
        let tenantId;
        if (existingTenant && existingTenant.length > 0) {
            tenantId = existingTenant[0].id;
            console.log('✅ Kitchen tenant already exists with ID:', tenantId);
        } else {
            // Generate UUID for kitchen tenant
            tenantId = uuidv4();
            
            // Insert kitchen tenant
            const tenantSql = `
                INSERT INTO tenants (id, name, slug, email, status, subscription_plan, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
            `;
            
            await connection.execute(tenantSql, [
                tenantId,
                'Kitchen Restaurant',
                'kitchen',
                'admin@kitchenrestaurant.com',
                'active',
                'starter'
            ]);
            
            console.log('✅ Kitchen tenant created');
        }

        // Create default settings for the tenant
        const defaultSettings = {
            name: "Kitchen Restaurant",
            description: "A modern kitchen restaurant serving delicious meals",
            address: "123 Kitchen Street, Food City, FC 12345",
            phone: "+1 (555) 123-4567",
            email: "info@kitchenrestaurant.com",
            website: "https://kitchenrestaurant.com",
            logo: "",
            coverImage: "",
            coverImageHint: "Modern restaurant interior with elegant dining setup",
            favicon: "",
            openingHours: {
                monday: { closed: false, timeMode: "single", openTime: "09:00", closeTime: "22:00" },
                tuesday: { closed: false, timeMode: "single", openTime: "09:00", closeTime: "22:00" },
                wednesday: { closed: false, timeMode: "single", openTime: "09:00", closeTime: "22:00" },
                thursday: { closed: false, timeMode: "single", openTime: "09:00", closeTime: "22:00" },
                friday: { closed: false, timeMode: "single", openTime: "09:00", closeTime: "22:00" },
                saturday: { closed: false, timeMode: "single", openTime: "09:00", closeTime: "22:00" },
                sunday: { closed: false, timeMode: "single", openTime: "09:00", closeTime: "22:00" }
            },
            paymentSettings: {
                cash: { enabled: true },
                stripe: { enabled: false, apiKey: "", apiSecret: "", merchantId: "" }
            },
            orderTypeSettings: {
                collectionEnabled: true,
                deliveryEnabled: true,
                advanceOrderEnabled: true
            },
            theme: {
                primary: "224 82% 57%",
                primaryForeground: "210 40% 98%",
                background: "210 40% 98%",
                accent: "210 40% 94%"
            }
        };

        const settingsSql = `
            INSERT INTO tenant_settings (tenant_id, settings_json, created_at, updated_at)
            VALUES (?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE 
                settings_json = VALUES(settings_json),
                updated_at = NOW()
        `;
        
        await connection.execute(settingsSql, [
            tenantId,
            JSON.stringify(defaultSettings)
        ]);
        
        console.log('✅ Kitchen tenant settings created/updated');

        // Create some sample menu categories and items
        const categoryId1 = uuidv4();
        const categoryId2 = uuidv4();
        
        const categoriesSql = `
            INSERT INTO menu_categories (id, tenant_id, name, description, sort_order, is_active, created_at, updated_at)
            VALUES 
                (?, ?, 'Appetizers', 'Delicious starters to begin your meal', 1, 1, NOW(), NOW()),
                (?, ?, 'Main Courses', 'Hearty main dishes', 2, 1, NOW(), NOW())
            ON DUPLICATE KEY UPDATE 
                name = VALUES(name),
                description = VALUES(description),
                updated_at = NOW()
        `;
        
        await connection.execute(categoriesSql, [
            categoryId1, tenantId,
            categoryId2, tenantId
        ]);
        
        console.log('✅ Sample menu categories created');

        // Create sample menu items
        const item1Id = uuidv4();
        const item2Id = uuidv4();
        const item3Id = uuidv4();
        
        const itemsSql = `
            INSERT INTO menu_items (id, tenant_id, category_id, name, description, price, is_active, sort_order, created_at, updated_at)
            VALUES 
                (?, ?, ?, 'Caesar Salad', 'Fresh romaine lettuce with parmesan cheese and croutons', 12.99, 1, 1, NOW(), NOW()),
                (?, ?, ?, 'Grilled Chicken', 'Perfectly grilled chicken breast with herbs', 18.99, 1, 1, NOW(), NOW()),
                (?, ?, ?, 'Pasta Carbonara', 'Classic Italian pasta with bacon and parmesan', 16.99, 1, 2, NOW(), NOW())
            ON DUPLICATE KEY UPDATE 
                name = VALUES(name),
                description = VALUES(description),
                price = VALUES(price),
                updated_at = NOW()
        `;
        
        await connection.execute(itemsSql, [
            item1Id, tenantId, categoryId1,
            item2Id, tenantId, categoryId2,
            item3Id, tenantId, categoryId2
        ]);
        
        console.log('✅ Sample menu items created');
        
        console.log('\n🎉 Kitchen tenant setup completed successfully!');
        console.log('📍 Access the kitchen restaurant at: http://localhost:9002/kitchen/shop');
        console.log('📍 Admin panel: http://localhost:9002/kitchen/admin');
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupKitchenTenant();
