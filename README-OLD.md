# OrderWeb Restaurant Management System

## Quick Setup (Easy Way)

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
```bash
npm run setup
```

This will ask you for:
- Database Host (usually `localhost`)
- Database Port (usually `3306`)
- Database User (usually `root`)
- Database Password
- Database Name (any name you want)

The setup will:
- Create the database and all required tables
- Create a default super admin account
- Generate your `.env` file automatically

### 3. Start the Application
```bash
npm run dev
```

### 4. Access the Application
- Main App: http://localhost:9002
- Super Admin: http://localhost:9002/super-admin
  - Email: admin@restaurant.com
  - Password: admin123
- Health Check: http://localhost:9002/api/health (should return `{"status": "healthy"}`)

### 5. Create Your First Restaurant
1. Login to super admin panel
2. Go to "Restaurants" section
3. Click "Add Restaurant"
4. Fill in restaurant details
5. Your restaurant admin panel will be available at: http://localhost:9002/[restaurant-slug]/admin

## Production Deployment

### 1. Build for Production
```bash
npm run build
```

### 2. Start Production Server
```bash
npm start
```

### 3. Environment Variables
Make sure to update your `.env` file with production values:
- Set `NODE_ENV=production`
- Update `NEXTAUTH_URL` to your domain
- Change `PRODUCTION_DOMAIN` to your actual domain
- Update database credentials for production

## Features

- ✅ Multi-tenant restaurant management
- ✅ Order management system
- ✅ Menu management with categories
- ✅ Customer management
- ✅ Voucher system
- ✅ Delivery zones
- ✅ Printer integration
- ✅ Dashboard and reports
- ✅ Super admin panel
- ✅ Responsive design

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MySQL
- **Authentication**: Custom JWT-based auth
- **UI Components**: Radix UI

## Support

For issues or questions, please check the application logs in the console or contact support.
