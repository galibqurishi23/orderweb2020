const CompleteDatabaseSetup = require('./src/lib/complete-database-setup').default;

async function runSetup() {
    console.log('🚀 OrderWeb Database Setup');
    console.log('==========================');
    
    try {
        const setup = new CompleteDatabaseSetup();
        const success = await setup.setupCompleteDatabase();
        
        if (success) {
            console.log('✅ Database setup completed successfully!');
            process.exit(0);
        } else {
            console.error('❌ Database setup failed');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Setup error:', error);
        process.exit(1);
    }
}

runSetup();
