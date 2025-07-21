# SSH Update Guide for Oracle VM

## How to Update Files on Your Oracle VM

### 1. Connect to your Oracle VM
```bash
ssh username@your-oracle-vm-ip
```

### 2. Navigate to your application directory
```bash
cd /path/to/your/orderweb-application
```

### 3. Files You Need to Update

#### A. Update .env file
```bash
# Edit the .env file
nano .env
```

**Replace these lines:**
```
DB_HOST=localhost
DB_USER=orderWeb
DB_PASSWORD=orderWeb123
DB_NAME=order_web
DB_PORT=3306

DEFAULT_ADMIN_EMAIL=admin@dinedesk.com
DEFAULT_ADMIN_PASSWORD=admin123
DEFAULT_ADMIN_NAME=Super Admin
```

#### B. Update setup-database.js
```bash
# Edit the setup database file
nano setup-database.js
```

**Add this line at the top (after line 3):**
```javascript
// Load environment variables
require('dotenv').config();
```

**Find the super admin creation section (around line 365) and replace:**
```javascript
// OLD:
const hashedPassword = await bcrypt.hash('admin123', 12);
await connection.query(
    `INSERT IGNORE INTO ${database}.super_admin_users (id, name, email, password) VALUES (?, ?, ?, ?)`,
    [adminId, 'Super Admin', 'admin@restaurant.com', hashedPassword]
);

// NEW:
const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@dinedesk.com';
const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
const adminName = process.env.DEFAULT_ADMIN_NAME || 'Super Admin';
const hashedPassword = await bcrypt.hash(adminPassword, 12);

await connection.query(
    `INSERT IGNORE INTO ${database}.super_admin_users (id, name, email, password) VALUES (?, ?, ?, ?)`,
    [adminId, adminName, adminEmail, hashedPassword]
);

log('✅ Default super admin created!', colors.green);
log(`   Email: ${adminEmail}`, colors.cyan);
log(`   Password: ${adminPassword}`, colors.cyan);
```

#### C. Create API endpoint for updating credentials
```bash
# Create the directory
mkdir -p src/app/api/super-admin/update-credentials

# Create the API file
nano src/app/api/super-admin/update-credentials/route.ts
```

**Add this content to the file:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, currentPassword, newPassword } = await request.json();

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Email, current password, and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Get current super admin user
    const [userRows] = await db.execute(
      'SELECT * FROM super_admin_users ORDER BY created_at ASC LIMIT 1'
    );

    const users = userRows as any[];
    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'No super admin user found' },
        { status: 404 }
      );
    }

    const user = users[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update user credentials
    await db.execute(
      'UPDATE super_admin_users SET email = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [email, hashedNewPassword, user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Super admin credentials updated successfully'
    });

  } catch (error) {
    console.error('Error updating super admin credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4. Run the Setup
```bash
# Stop the application first
pm2 stop all  # or however you're running it

# Run the database setup
npm run setup

# Start the application
npm run build && npm start
# or
pm2 start ecosystem.config.js  # if using PM2
```

### 5. Access Your Application
- Visit: `http://your-oracle-vm-ip:3000/super-admin`
- Login with: `admin@dinedesk.com` / `admin123`
- Go to Settings tab to change your credentials

## Quick Commands Reference

### To edit files:
```bash
nano filename.ext        # Edit file
ctrl + x, then y, enter  # Save and exit
```

### To restart services:
```bash
pm2 restart all          # Restart PM2 processes
systemctl restart nginx  # Restart Nginx (if using)
```

### To check logs:
```bash
pm2 logs                 # View application logs
tail -f /var/log/nginx/error.log  # View Nginx errors
```

## Important Notes:
1. Always backup files before editing: `cp filename filename.backup`
2. The default credentials will work across all new databases
3. You can change credentials anytime from the Super Admin Settings page
4. Make sure your Oracle VM firewall allows port 3000 (or your app port)
