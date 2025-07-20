#!/usr/bin/env node

// OrderWeb System Health Check
// Run this to verify your production setup

const mysql = require('mysql2/promise');
const http = require('http');
require('dotenv').config();

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function log(message, color = colors.reset) {
    console.log(color + message + colors.reset);
}

async function checkDatabase() {
    log('\n🔍 Checking Database Connection...', colors.blue);
    
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || process.env.DATABASE_HOST,
            port: Number(process.env.DB_PORT || process.env.DATABASE_PORT) || 3306,
            user: process.env.DB_USER || process.env.DATABASE_USER,
            password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD,
            database: process.env.DB_NAME || process.env.DATABASE_NAME
        });

        // Test basic connection
        await connection.execute('SELECT 1');
        log('✅ Database connection successful', colors.green);

        // Check if tables exist
        const [tables] = await connection.execute(
            "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ?"
            , [process.env.DB_NAME || process.env.DATABASE_NAME]
        );
        
        const tableCount = tables[0].count;
        if (tableCount > 0) {
            log(`✅ Database initialized with ${tableCount} tables`, colors.green);
        } else {
            log('⚠️  Database is empty. Run: npm run setup', colors.yellow);
        }

        // Check critical tables
        try {
            await connection.execute('SELECT COUNT(*) FROM super_admin_users');
            log('✅ Super admin table exists', colors.green);
        } catch (error) {
            log('⚠️  Super admin table missing. Run: npm run setup', colors.yellow);
        }

        await connection.end();
        
    } catch (error) {
        log('❌ Database connection failed: ' + error.message, colors.red);
        log('Check your .env.production database settings', colors.yellow);
        return false;
    }
    
    return true;
}

async function checkEnvironment() {
    log('\n🔍 Checking Environment Configuration...', colors.blue);
    
    const requiredVars = [
        'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
        'NEXTAUTH_URL', 'NEXTAUTH_SECRET'
    ];
    
    let allOk = true;
    
    requiredVars.forEach(varName => {
        const value = process.env[varName] || process.env[varName.replace('DB_', 'DATABASE_')];
        if (value) {
            log(`✅ ${varName} is set`, colors.green);
        } else {
            log(`❌ ${varName} is missing`, colors.red);
            allOk = false;
        }
    });
    
    // Check for production values
    if (process.env.NEXTAUTH_SECRET === 'your-secret-key-here-1752666079408') {
        log('⚠️  NEXTAUTH_SECRET is using default value - change for production!', colors.yellow);
    }
    
    if (process.env.SUPER_ADMIN_PASSWORD === 'your_secure_admin_password') {
        log('⚠️  SUPER_ADMIN_PASSWORD is using default value - change for production!', colors.yellow);
    }
    
    return allOk;
}

async function checkApplication() {
    log('\n🔍 Checking Application...', colors.blue);
    
    // Check if application is running
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: process.env.PORT || 3000,
            path: '/api/health',
            method: 'GET',
            timeout: 5000
        }, (res) => {
            if (res.statusCode === 200) {
                log('✅ Application is running and responding', colors.green);
                resolve(true);
            } else {
                log(`⚠️  Application responded with status ${res.statusCode}`, colors.yellow);
                resolve(false);
            }
        });
        
        req.on('error', () => {
            log('⚠️  Application is not running on port ' + (process.env.PORT || 3000), colors.yellow);
            log('Start with: npm start', colors.blue);
            resolve(false);
        });
        
        req.on('timeout', () => {
            log('⚠️  Application health check timed out', colors.yellow);
            resolve(false);
        });
        
        req.end();
    });
}

async function checkSystem() {
    log('\n🔍 Checking System Requirements...', colors.blue);
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion >= 18) {
        log(`✅ Node.js ${nodeVersion} (compatible)`, colors.green);
    } else {
        log(`❌ Node.js ${nodeVersion} (requires 18+)`, colors.red);
        return false;
    }
    
    return true;
}

async function main() {
    log('🏥 OrderWeb System Health Check', colors.blue);
    log('================================', colors.blue);
    
    const systemOk = await checkSystem();
    const envOk = await checkEnvironment();
    const dbOk = await checkDatabase();
    const appOk = await checkApplication();
    
    log('\n📊 Health Check Summary:', colors.blue);
    log('========================', colors.blue);
    
    if (systemOk && envOk && dbOk && appOk) {
        log('🎉 All systems operational!', colors.green);
        process.exit(0);
    } else {
        log('⚠️  Some issues detected. Please review above.', colors.yellow);
        
        if (!systemOk) log('- Fix Node.js version', colors.red);
        if (!envOk) log('- Check environment variables in .env.production', colors.red);
        if (!dbOk) log('- Fix database connection and run setup', colors.red);
        if (!appOk) log('- Start the application', colors.red);
        
        process.exit(1);
    }
}

main().catch(error => {
    log('❌ Health check failed: ' + error.message, colors.red);
    process.exit(1);
});
