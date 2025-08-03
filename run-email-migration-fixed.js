const mysql = require('mysql2/promise');

async function runEmailSystemMigration() {
  console.log('🔧 Starting Tenant Email System Migration...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'dinedesk_db'
  });

  try {
    console.log('📊 Adding SMTP columns to tenants table...');
    
    // Add SMTP columns to tenants table (check if they exist first)
    const smtpColumns = [
      { name: 'smtp_host', type: 'varchar(255) DEFAULT NULL' },
      { name: 'smtp_port', type: 'int(11) DEFAULT 587' },
      { name: 'smtp_secure', type: 'tinyint(1) DEFAULT 0' },
      { name: 'smtp_user', type: 'varchar(255) DEFAULT NULL' },
      { name: 'smtp_password', type: 'varchar(500) DEFAULT NULL' },
      { name: 'smtp_from', type: 'varchar(255) DEFAULT NULL' },
      { name: 'email_enabled', type: 'tinyint(1) DEFAULT 0' }
    ];
    
    for (const column of smtpColumns) {
      try {
        await connection.execute(`ALTER TABLE tenants ADD COLUMN ${column.name} ${column.type}`);
        console.log(`✅ Added column: ${column.name}`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`ℹ️  Column already exists: ${column.name}`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('📊 Creating email_logs table...');
    
    // Create email_logs table
    try {
      await connection.execute(`
        CREATE TABLE email_logs (
          id bigint(20) NOT NULL AUTO_INCREMENT,
          tenant_slug varchar(255) NOT NULL,
          email_type varchar(50) NOT NULL,
          recipient varchar(255) DEFAULT NULL,
          subject varchar(500) DEFAULT NULL,
          status enum('sent','failed','pending','bounced') NOT NULL DEFAULT 'pending',
          error_message text DEFAULT NULL,
          message_id varchar(255) DEFAULT NULL,
          details text DEFAULT NULL,
          sent_at timestamp NOT NULL DEFAULT current_timestamp(),
          created_at timestamp NULL DEFAULT current_timestamp(),
          updated_at timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (id),
          KEY idx_email_logs_tenant (tenant_slug),
          KEY idx_email_logs_type (email_type),
          KEY idx_email_logs_status (status),
          KEY idx_email_logs_sent_at (sent_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Created email_logs table');
    } catch (error) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('ℹ️  email_logs table already exists');
      } else {
        throw error;
      }
    }
    
    console.log('📊 Creating email_templates table...');
    
    // Create email_templates table
    try {
      await connection.execute(`
        CREATE TABLE email_templates (
          id bigint(20) NOT NULL AUTO_INCREMENT,
          tenant_slug varchar(255) NOT NULL,
          template_name varchar(100) NOT NULL,
          template_type varchar(50) NOT NULL,
          subject varchar(500) NOT NULL,
          html_content longtext DEFAULT NULL,
          text_content longtext DEFAULT NULL,
          variables json DEFAULT NULL,
          is_active tinyint(1) DEFAULT 1,
          is_default tinyint(1) DEFAULT 0,
          created_at timestamp NULL DEFAULT current_timestamp(),
          updated_at timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (id),
          UNIQUE KEY unique_tenant_template_type (tenant_slug, template_type, template_name),
          KEY idx_email_templates_tenant (tenant_slug),
          KEY idx_email_templates_type (template_type),
          KEY idx_email_templates_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Created email_templates table');
    } catch (error) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('ℹ️  email_templates table already exists');
      } else {
        throw error;
      }
    }
    
    console.log('📊 Adding indexes...');
    
    // Add indexes
    try {
      await connection.execute('ALTER TABLE tenants ADD INDEX idx_tenants_email_enabled (email_enabled)');
      console.log('✅ Added email_enabled index');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  email_enabled index already exists');
      } else {
        console.warn('⚠️  Could not add email_enabled index:', error.message);
      }
    }
    
    try {
      await connection.execute('ALTER TABLE tenants ADD INDEX idx_tenants_smtp_host (smtp_host)');
      console.log('✅ Added smtp_host index');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  smtp_host index already exists');
      } else {
        console.warn('⚠️  Could not add smtp_host index:', error.message);
      }
    }
    
    console.log('📊 Updating existing tenants...');
    
    // Update existing tenants to have email system disabled by default
    await connection.execute('UPDATE tenants SET email_enabled = 0 WHERE email_enabled IS NULL');
    console.log('✅ Updated existing tenants');
    
    console.log('📊 Creating default templates...');
    
    // Insert default email templates
    const [tenants] = await connection.execute('SELECT slug FROM tenants WHERE status = ?', ['active']);
    
    for (const tenant of tenants) {
      // Order confirmation template
      try {
        await connection.execute(`
          INSERT INTO email_templates (tenant_slug, template_name, template_type, subject, html_content, text_content, variables, is_active, is_default)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          tenant.slug,
          'Order Confirmation',
          'order_confirmation',
          'Your Order Confirmation - {{orderNumber}}',
          '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h1>Order Confirmation</h1><p>Dear {{customerName}},</p><p>Thank you for your order! Your order number is: <strong>{{orderNumber}}</strong></p><h3>Order Details:</h3><div>{{orderItems}}</div><p><strong>Total: {{orderTotal}}</strong></p><p>Estimated delivery time: {{deliveryTime}}</p><p>Thank you for choosing {{restaurantName}}!</p></div>',
          'Order Confirmation\\n\\nDear {{customerName}},\\n\\nThank you for your order! Your order number is: {{orderNumber}}\\n\\nOrder Details:\\n{{orderItems}}\\n\\nTotal: {{orderTotal}}\\nEstimated delivery time: {{deliveryTime}}\\n\\nThank you for choosing {{restaurantName}}!',
          JSON.stringify(['customerName', 'orderNumber', 'orderItems', 'orderTotal', 'deliveryTime', 'restaurantName']),
          1,
          1
        ]);
        console.log(`✅ Created order confirmation template for tenant: ${tenant.slug}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`ℹ️  Order confirmation template already exists for tenant: ${tenant.slug}`);
        } else {
          console.warn(`⚠️  Could not create order confirmation template for ${tenant.slug}:`, error.message);
        }
      }
      
      // Welcome email template
      try {
        await connection.execute(`
          INSERT INTO email_templates (tenant_slug, template_name, template_type, subject, html_content, text_content, variables, is_active, is_default)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          tenant.slug,
          'Welcome Email',
          'welcome',
          'Welcome to {{restaurantName}}!',
          '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h1>Welcome to {{restaurantName}}!</h1><p>Dear {{customerName}},</p><p>Welcome to our restaurant! We are excited to serve you.</p><p>You can place orders online and track them in real-time.</p><p>Thank you for choosing {{restaurantName}}!</p></div>',
          'Welcome to {{restaurantName}}!\\n\\nDear {{customerName}},\\n\\nWelcome to our restaurant! We are excited to serve you.\\n\\nYou can place orders online and track them in real-time.\\n\\nThank you for choosing {{restaurantName}}!',
          JSON.stringify(['customerName', 'restaurantName']),
          1,
          1
        ]);
        console.log(`✅ Created welcome template for tenant: ${tenant.slug}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`ℹ️  Welcome template already exists for tenant: ${tenant.slug}`);
        } else {
          console.warn(`⚠️  Could not create welcome template for ${tenant.slug}:`, error.message);
        }
      }
    }
    
    // Verify the migration
    console.log('\\n🔍 Verifying migration...');
    
    // Check if columns exist
    const [columns] = await connection.execute("SHOW COLUMNS FROM tenants LIKE 'smtp_%'");
    console.log(`✅ SMTP columns added: ${columns.length} columns`);
    
    // Check if tables exist
    const [emailLogsTables] = await connection.execute("SHOW TABLES LIKE 'email_logs'");
    const [emailTemplatesTables] = await connection.execute("SHOW TABLES LIKE 'email_templates'");
    
    console.log(`✅ email_logs table: ${emailLogsTables.length > 0 ? 'EXISTS' : 'NOT FOUND'}`);
    console.log(`✅ email_templates table: ${emailTemplatesTables.length > 0 ? 'EXISTS' : 'NOT FOUND'}`);
    
    // Get statistics
    const [tenantStats] = await connection.execute('SELECT COUNT(*) as count FROM tenants');
    const [templateStats] = await connection.execute('SELECT COUNT(*) as count FROM email_templates');
    const [logStats] = await connection.execute('SELECT COUNT(*) as count FROM email_logs');
    
    console.log(`✅ Total tenants: ${tenantStats[0].count}`);
    console.log(`✅ Total templates: ${templateStats[0].count}`);
    console.log(`✅ Total logs: ${logStats[0].count}`);
    
    console.log('\\n🎉 Migration completed successfully!');
    console.log('📧 Tenant email system database structure is now ready.');
    console.log('\\nNext steps:');
    console.log('1. Restart your Next.js application');
    console.log('2. Configure SMTP settings for your tenants');
    console.log('3. Test the email functionality');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

// Run the migration
runEmailSystemMigration().catch(console.error);
