# Production Deployment Guide

## Prerequisites
- Node.js 18+ installed
- MySQL/MariaDB database server
- Domain name and SSL certificate (for production)

## Environment Setup

1. **Database Setup**
   ```bash
   # Create database
   mysql -u root -p
   CREATE DATABASE dinedesk_db;
   CREATE USER 'dinedesk_user'@'%' IDENTIFIED BY 'secure_password';
   GRANT ALL PRIVILEGES ON dinedesk_db.* TO 'dinedesk_user'@'%';
   FLUSH PRIVILEGES;
   ```

2. **Environment Variables**
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Edit .env with your production values
   nano .env
   ```

3. **Install Dependencies**
   ```bash
   npm install --production
   ```

4. **Initialize Database**
   ```bash
   npm run setup
   ```

5. **Build Application**
   ```bash
   npm run build
   ```

6. **Start Production Server**
   ```bash
   npm start
   ```

## Cloud Hosting Options

### Vercel (Recommended)
1. Push to GitHub repository
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### DigitalOcean App Platform
1. Create new app from GitHub
2. Set environment variables
3. Configure build and run commands
4. Deploy

### AWS/Google Cloud
1. Use Docker container (see Dockerfile)
2. Set up RDS/Cloud SQL database
3. Configure environment variables
4. Deploy using container service

## Database Migrations
The application includes automatic database setup. For existing databases:
```bash
npm run setup  # Safe to run multiple times
```

## Security Checklist
- [ ] Change default NEXTAUTH_SECRET
- [ ] Use strong database passwords
- [ ] Enable SSL/HTTPS
- [ ] Configure firewall rules
- [ ] Set up regular backups
- [ ] Configure monitoring

## Performance Optimization
- [ ] Enable database connection pooling
- [ ] Configure CDN for static assets
- [ ] Set up caching (Redis recommended)
- [ ] Enable compression
- [ ] Monitor database performance

## Backup Strategy
1. Database backups: Daily automated backups
2. File uploads: Cloud storage with versioning
3. Configuration: Environment variables backup
4. Code: Git repository with tags

## Support
- Application logs: Check server logs for errors
- Database: Monitor connection pool and query performance
- Payment gateways: Check webhook endpoints
- Email: Verify SMTP configuration
