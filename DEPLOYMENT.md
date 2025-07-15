# Production Deployment Guide for Web Hosting

## Quick Start for Web Hosting (Hostinger, GoDaddy, etc.)

### 1. Prerequisites
- Node.js 18+ support on your hosting provider
- MySQL/MariaDB database access
- FTP/SFTP access or Git deployment
- Domain name

### 2. Upload Files

#### Option A: FTP/SFTP Upload
1. Download or clone the project
2. Upload all files to your hosting's public_html or equivalent directory
3. Make sure node_modules is excluded (will install on server)

#### Option B: Git Deployment (if supported)
```bash
git clone <your-repo-url>
cd order-web-restaurant--main
```

### 3. Configure Environment Variables

Create `.env` file on your server with your database credentials:

```env
# Database Configuration (from your hosting control panel)
DB_HOST=localhost
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_PORT=3306

# Application Configuration
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
PRODUCTION_DOMAIN=yourdomain.com

# Default Super Admin
DEFAULT_ADMIN_EMAIL=admin@yourdomain.com
DEFAULT_ADMIN_PASSWORD=changeme123
DEFAULT_ADMIN_NAME=Super Admin
```

### 4. Install Dependencies & Setup

SSH into your hosting server or use hosting control panel terminal:

```bash
# Install dependencies
npm install

# Setup database and build application
npm run setup-production
```

### 5. Start the Application

```bash
# Start the application
npm start
```

## Popular Web Hosting Platforms

### Hostinger
1. **Enable Node.js** in control panel
2. **Create MySQL database** in control panel
3. **Upload files** via File Manager or FTP
4. **Set environment variables** in Node.js settings
5. **Run setup commands** in terminal

### GoDaddy
1. **Enable Node.js hosting**
2. **Create database** in cPanel
3. **Upload files** via cPanel File Manager
4. **Configure environment** in Node.js settings
5. **Start application**

### A2 Hosting
1. **Enable Node.js** in control panel
2. **Create MySQL database**
3. **Upload files** and configure
4. **Run setup script**

### Shared Hosting Limitations
- Some shared hosting providers may not support Node.js
- Check for Node.js 18+ support before purchasing
- Ensure MySQL/MariaDB access is available

## Environment Variables for Web Hosting

### Required Variables (Get from hosting control panel)
- `DB_HOST` - Usually 'localhost' or specific host
- `DB_USER` - Database username from hosting panel
- `DB_PASSWORD` - Database password from hosting panel
- `DB_NAME` - Database name you created

### Application Variables
- `NEXTAUTH_URL` - Your domain (https://yourdomain.com)
- `NEXTAUTH_SECRET` - Random secret key
- `PRODUCTION_DOMAIN` - Your domain name
- `DEFAULT_ADMIN_EMAIL` - Super admin email
- `DEFAULT_ADMIN_PASSWORD` - Super admin password

## Manual Setup Steps

### 1. Create Database
In your hosting control panel:
1. Go to MySQL Databases
2. Create a new database
3. Create a database user
4. Assign user to database with all privileges
5. Note down the connection details

### 2. Upload Files
- Upload all project files to your domain's root folder
- Ensure `.env` file is created with correct settings
- Make sure `node_modules` is not uploaded (too large)

### 3. Install and Setup
```bash
# Install dependencies
npm install

# Setup database tables and build app
npm run setup-production
```

### 4. Configure Domain
- Point your domain to the hosting server
- Ensure SSL certificate is installed
- Test the application

## File Structure on Server
```
yourdomain.com/
├── src/
├── public/
├── scripts/
├── .env
├── package.json
├── next.config.ts
└── ... (other files)
```

## Common Web Hosting Issues & Solutions

### 1. Node.js Version
- Ensure hosting supports Node.js 18+
- Check in hosting control panel
- Some hosts require version selection

### 2. Database Connection
- Use exact credentials from hosting panel
- Host might be IP address instead of 'localhost'
- Check database user permissions

### 3. File Permissions
- Ensure proper file permissions (755 for folders, 644 for files)
- Check that `.env` file is readable by application

### 4. Port Configuration
- Most web hosting uses port 80/443
- Application will detect and use appropriate port
- No need to specify port in most cases

### 5. SSL Certificate
- Enable SSL in hosting control panel
- Update `NEXTAUTH_URL` to use https://
- Ensure domain points to correct server

## Backup Strategy for Web Hosting

### Database Backup
```bash
# Create backup (run on server)
mysqldump -u username -p database_name > backup_$(date +%Y%m%d).sql
```

### File Backup
- Download files via FTP/SFTP
- Use hosting control panel backup feature
- Regular backups of uploads folder

## Monitoring & Maintenance

### Check Application Status
Visit: `https://yourdomain.com/api/health`

### Log Files
- Check hosting control panel for error logs
- Monitor application logs if available
- Set up uptime monitoring

## Performance Optimization

### For Shared Hosting
- Optimize images before upload
- Use CDN for static assets
- Enable compression in hosting settings
- Monitor resource usage

### Database Optimization
- Regular database maintenance
- Monitor query performance
- Set up database optimization in hosting panel

## Security for Web Hosting

### Essential Security Steps
- [ ] Change default admin password immediately
- [ ] Use strong database passwords
- [ ] Enable SSL certificate
- [ ] Keep application updated
- [ ] Regular backups
- [ ] Monitor access logs

### Hosting Security Features
- Enable firewall if available
- Use hosting security features
- Regular security scans
- Keep hosting control panel secure

## Troubleshooting

### Application Won't Start
1. Check Node.js version compatibility
2. Verify database connection
3. Check file permissions
4. Review error logs in hosting panel

### Database Connection Issues
1. Verify database credentials
2. Check database user permissions
3. Ensure database server is running
4. Test connection from hosting terminal

### Domain Issues
1. Check DNS settings
2. Verify domain pointing to correct server
3. Ensure SSL certificate is active
4. Check hosting name servers

## Support Resources

### For Hosting Issues
- Contact your hosting provider support
- Check hosting documentation
- Review hosting control panel tutorials

### For Application Issues
- Check `/api/health` endpoint
- Review application logs
- Verify environment configuration
- Test database connectivity

## Cost Optimization

### Hosting Selection
- Choose hosting with Node.js support
- Consider VPS for better performance
- Monitor resource usage
- Plan for growth

### Database Optimization
- Regular cleanup of old data
- Optimize database queries
- Monitor database size
- Use indexing appropriately
