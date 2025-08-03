const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
  console.log('🔧 Starting Tenant Email System Migration...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dinedesk_db',
    multipleStatements: true
  });

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add-tenant-email-system.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    console.log('📊 Running database migration...');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .filter(stmt => stmt.trim().length > 0)
      .filter(stmt => !stmt.trim().startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement + ';');
          console.log('✅ Executed:', statement.substring(0, 50) + '...');
        } catch (error) {
          if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('⚠️  Already exists:', statement.substring(0, 50) + '...');
          } else {
            console.error('❌ Error executing:', statement.substring(0, 50) + '...');
            console.error('Error:', error.message);
          }
        }
      }
    }
    
    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    
    // Check if columns exist
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM tenants LIKE 'smtp_%'"
    );
    
    console.log(`✅ SMTP columns added: ${columns.length} columns`);
    
    // Check if tables exist
    const [emailLogsTables] = await connection.execute(
      "SHOW TABLES LIKE 'email_logs'"
    );
    
    const [emailTemplatesTables] = await connection.execute(
      "SHOW TABLES LIKE 'email_templates'"
    );
    
    console.log(`✅ email_logs table: ${emailLogsTables.length > 0 ? 'EXISTS' : 'NOT FOUND'}`);
    console.log(`✅ email_templates table: ${emailTemplatesTables.length > 0 ? 'EXISTS' : 'NOT FOUND'}`);
    
    // Get tenant info
    const [tenants] = await connection.execute('SELECT COUNT(*) as count FROM tenants');
    console.log(`✅ Total tenants: ${tenants[0].count}`);
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('📧 Tenant email system database structure is now ready.');
    console.log('\nNext steps:');
    console.log('1. Restart your Next.js application');
    console.log('2. Configure SMTP settings for your tenants');
    console.log('3. Test the email functionality');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

// Run the migration
runMigration().catch(console.error);
