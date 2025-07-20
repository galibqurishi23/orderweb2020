# Production Deployment Checklist

## Pre-Deployment ✅

- [ ] Oracle Linux server prepared
- [ ] MySQL/MariaDB installed and running
- [ ] Node.js 18+ installed
- [ ] Application files uploaded to server
- [ ] Domain name configured (if applicable)

## Configuration ✅

- [ ] `.env.production` file created and configured
- [ ] Database credentials updated
- [ ] Domain settings configured
- [ ] NEXTAUTH_SECRET changed from default
- [ ] SUPER_ADMIN_PASSWORD set to secure value
- [ ] Production environment verified

## Database Setup ✅

- [ ] Database connection tested
- [ ] Database schema initialized (`npm run setup`)
- [ ] Super admin user created
- [ ] Database backup strategy implemented

## Application Deployment ✅

- [ ] Dependencies installed (`npm ci --only=production`)
- [ ] Application built (`npm run build`)
- [ ] Health check passed (`npm run health-check`)
- [ ] Application starts successfully (`npm start`)

## System Configuration ✅

- [ ] Systemd service created (optional)
- [ ] Firewall configured (port 3000)
- [ ] Reverse proxy configured (nginx/apache)
- [ ] SSL certificate installed
- [ ] Log monitoring setup

## Security ✅

- [ ] All default passwords changed
- [ ] Environment secrets secured
- [ ] Database access restricted
- [ ] File permissions set correctly
- [ ] Regular backup schedule created

## Testing ✅

- [ ] Application accessible via domain
- [ ] Super admin login works
- [ ] Database operations functional
- [ ] Order system working
- [ ] Email notifications (if configured)

## Monitoring ✅

- [ ] Application logs monitored
- [ ] Database performance checked
- [ ] System resources monitored
- [ ] Backup verification scheduled
- [ ] Error alerting configured

## Post-Deployment ✅

- [ ] DNS settings propagated
- [ ] SSL certificate valid
- [ ] Application performance verified
- [ ] User acceptance testing completed
- [ ] Documentation updated

---

## Quick Commands

```bash
# Health check
npm run health-check

# View logs
sudo journalctl -u orderweb -f

# Backup database
./backup-database.sh

# Restart application
sudo systemctl restart orderweb

# Check application status
sudo systemctl status orderweb
```

## Emergency Contacts

- System Administrator: ___________________
- Database Administrator: _________________  
- Domain/DNS Provider: ___________________
- SSL Certificate Provider: _______________
