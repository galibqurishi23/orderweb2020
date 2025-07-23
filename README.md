# OrderWeb Restaurant System

Multi-tenant restaurant ordering system built with Next.js and MySQL/MariaDB.

## Quick Setup

```bash
npm install
npm run setup
npm run build
npm start
```

## Environment

Create `.env` file:
```
DB_HOST=localhost
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=dinedesk_db
```

## Access

- Super Admin: http://localhost:3000/super-admin
- Restaurant: http://localhost:3000/[tenant]/admin
- Customer: http://localhost:3000/[tenant]

## Features

- Multi-tenant architecture
- Kitchen Display System with real-time WebSocket updates
- Group Code System for multi-location management
- AI-powered menu recommendations
- Order management with status tracking
- Payment processing (Stripe, Worldpay, Global Payments)
- Professional email templates
- Analytics dashboard
