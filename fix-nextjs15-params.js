#!/usr/bin/env node

/**
 * Next.js 15 Params Fix Script
 * This script updates files to use React.use() for params in Next.js 15.3.3+
 */

const fs = require('fs');
const path = require('path');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
    console.log(color + message + colors.reset);
}

async function fixNextJsParamsInFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;

        // Check if file has params prop type definition that needs updating
        const paramsTypePattern = /\{ params \}: \{ params: \{ tenant: string \} \}/g;
        if (paramsTypePattern.test(content)) {
            content = content.replace(paramsTypePattern, '{ params }: { params: Promise<{ tenant: string }> }');
            changed = true;
            log(`✅ Updated params type definition in ${filePath}`, colors.green);
        }

        // Check if we need to add React.use() for params
        const functionDefPattern = /export default function (\w+)\(\{ params \}: \{ params: Promise<\{ tenant: string \}> \}\) \{[\s\S]*?(?=const [^=]*= useRouter\(\))/;
        const match = content.match(functionDefPattern);
        
        if (match && !content.includes('React.use(params)')) {
            // Add React.use() after useRouter
            const routerPattern = /(const router = useRouter\(\);)/;
            content = content.replace(routerPattern, '$1\n  const resolvedParams = React.use(params);');
            changed = true;
            log(`✅ Added React.use(params) in ${filePath}`, colors.green);
        }

        // Replace all instances of params.tenant with resolvedParams.tenant
        if (content.includes('params.tenant') && content.includes('resolvedParams = React.use(params)')) {
            content = content.replace(/params\.tenant/g, 'resolvedParams.tenant');
            changed = true;
            log(`✅ Replaced params.tenant with resolvedParams.tenant in ${filePath}`, colors.green);
        }

        if (changed) {
            fs.writeFileSync(filePath, content, 'utf8');
            return true;
        }
        return false;
    } catch (error) {
        log(`❌ Error processing ${filePath}: ${error.message}`, colors.red);
        return false;
    }
}

async function findAndFixFiles() {
    const appDir = path.join(__dirname, 'src', 'app');
    let filesFixed = 0;

    function walkDir(dir) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                walkDir(filePath);
            } else if (file.endsWith('.tsx') && file === 'page.tsx') {
                // Check if this file has the pattern we need to fix
                const content = fs.readFileSync(filePath, 'utf8');
                if (content.includes('{ params }: { params:') && content.includes('params.tenant')) {
                    log(`🔧 Processing: ${filePath}`, colors.blue);
                    if (fixNextJsParamsInFile(filePath)) {
                        filesFixed++;
                    }
                }
            }
        }
    }

    if (fs.existsSync(appDir)) {
        walkDir(appDir);
    }

    return filesFixed;
}

async function main() {
    log('🚀 Next.js 15 Params Migration Tool', colors.bright + colors.cyan);
    log('=====================================', colors.cyan);
    log('Fixing params Promise unwrapping for Next.js 15.3.3+\\n', colors.yellow);
    
    const filesFixed = await findAndFixFiles();
    
    if (filesFixed > 0) {
        log(`\\n🎉 Successfully fixed ${filesFixed} file(s)!`, colors.green + colors.bright);
        log('\\n📝 Changes made:', colors.cyan);
        log('✅ Updated params type to Promise<{ tenant: string }>', colors.green);
        log('✅ Added React.use(params) for Promise unwrapping', colors.green);
        log('✅ Replaced params.tenant with resolvedParams.tenant', colors.green);
        log('\\n🔄 Please restart your development server to see changes.', colors.yellow);
    } else {
        log('\\n✅ No files needed fixing - all up to date!', colors.green);
    }
}

if (require.main === module) {
    main();
}
