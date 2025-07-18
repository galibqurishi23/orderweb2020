# OrderWeb - Multi-Tenant Restaurant Ordering System

A comprehensive multi-tenant restaurant ordering system with advanced features for modern food service businesses.

## 🚀 Quick Start

### For Production Deployment

```bash
# Quick production setup
./start-production.sh
```

### Manual Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database and settings

# Setup database
npm run setup

# Build and start
npm run build
npm start
```

## 🏗️ Architecture

- **Framework**: Next.js 15 with App Router
- **Database**: MySQL/MariaDB with connection pooling
- **Authentication**: Custom JWT-based multi-tenant auth
- **Payment Gateways**: Stripe, Global Payments, Worldpay
- **UI**: Tailwind CSS with Radix UI components
- **TypeScript**: Full type safety

## 🎯 Key Features

### Multi-Tenant System
- **Super Admin**: Manage all restaurants and users
- **Restaurant Admin**: Full restaurant management
- **Customer Interface**: Responsive ordering experience

### Restaurant Management
- **Menu Management**: Categories, items, variants, allergens
- **Order Management**: Real-time order processing
- **Payment Processing**: Multiple gateway support
- **Zone Management**: Delivery area configuration
- **Printer Integration**: Kitchen receipt printing

### Advanced Features
- **Real-time Updates**: Live order status
- **Responsive Design**: Mobile-first approach
- **Performance Optimized**: Database connection pooling
- **Secure**: JWT authentication with role-based access
- **Scalable**: Multi-tenant architecture

## 🔧 Configuration

### Environment Variables

```env
# Database
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=dinedesk_db

# Application
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key

# Optional: SSL Database Connection
DB_SSL=true
```

### Payment Gateway Setup

Configure payment gateways through the admin interface:

1. **Stripe**: Add publishable key, secret key, and webhook secret
2. **Global Payments**: Add application ID, key, and merchant ID
3. **Worldpay**: Add username, password, and merchant ID

## 🚀 Deployment Options

### Cloud Hosting

#### Vercel (Recommended)
```bash
# Deploy to Vercel
vercel --prod
```

#### Docker
```bash
# Build and run with Docker
docker build -t order-web-restaurant .
docker run -p 3000:3000 order-web-restaurant
```

#### Docker Compose
```bash
# Run with database
docker-compose up -d
```

### Traditional Hosting

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📊 Monitoring

- **Health Check**: `/api/health`
- **Database Status**: Included in health check
- **Error Logging**: Console and file logs
- **Performance**: Connection pool monitoring

## 🛠️ Development

```bash
# Start development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Role-based Access**: Multi-level permissions
- **SQL Injection Protection**: Parameterized queries
- **Environment Variables**: Secure configuration
- **HTTPS Ready**: SSL/TLS support

## 📈 Performance

- **Database Connection Pooling**: Optimized connections
- **Next.js Optimization**: Built-in performance features
- **Efficient Queries**: Indexed database operations
- **Image Optimization**: Automatic image handling

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database credentials in .env
   # Ensure MySQL server is running
   # Run: npm run setup
   ```

2. **Build Errors**
   ```bash
   # Clear cache and reinstall
   rm -rf .next node_modules package-lock.json
   npm install
   npm run build
   ```

3. **Payment Gateway Issues**
   ```bash
   # Test connections in admin panel
   # Check API keys and environment settings
   ```

## 📞 Support

- **Documentation**: See `/DEPLOYMENT.md` for detailed setup
- **Health Check**: Monitor `/api/health` endpoint
- **Logs**: Check server logs for error details

## 🔄 Updates

```bash
# Update dependencies
npm update

# Run database migrations
npm run setup
```

## 📋 System Requirements

- **Node.js**: 18 or higher
- **Database**: MySQL 8.0+ or MariaDB 10.5+
- **Memory**: 512MB minimum (2GB recommended)
- **Storage**: 1GB minimum

## 🌟 Production Checklist

- [ ] Configure production database
- [ ] Set secure NEXTAUTH_SECRET
- [ ] Enable SSL/HTTPS
- [ ] Configure payment gateways
- [ ] Set up domain and DNS
- [ ] Configure monitoring
- [ ] Set up backups
- [ ] Test all functionality

---

**Version**: 1.0.0  
**License**: Private  
**Last Updated**: July 2025
