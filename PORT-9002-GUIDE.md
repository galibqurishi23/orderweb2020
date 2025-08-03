# 🚀 Port 9002 Configuration Guide

## Overview
Your OrderWeb Restaurant System is now configured to **ALWAYS** run on port 9002. This applies to both development and production modes.

## ✅ What Was Changed

### 1. Package.json Scripts
- **Development**: `npm run dev` → runs on port 9002
- **Production**: `npm start` → runs on port 9002

### 2. Environment Variables (.env.local)
```env
PORT=9002
NEXT_PUBLIC_PORT=9002
NEXT_PUBLIC_APP_URL=http://localhost:9002
```

### 3. Deployment Script Updates
- Updated firewall configuration to open port 9002
- Changed application URL references from 3000 to 9002

### 4. Custom Start Script
- Created `start-port-9002.sh` for guaranteed port 9002 startup

## 🖥️ How to Run the Application

### Development Mode
```bash
# Method 1: Using npm
npm run dev

# Method 2: Using custom script
./start-port-9002.sh

# Method 3: Direct command
npx next dev -p 9002
```

### Production Mode
```bash
# Method 1: Using npm
npm run build
npm start

# Method 2: Using custom script
NODE_ENV=production ./start-port-9002.sh

# Method 3: Direct command
npx next build
npx next start -p 9002
```

## 🌐 Access URLs

The application will ALWAYS be available at:
- **Local**: http://localhost:9002
- **Network**: http://YOUR_IP_ADDRESS:9002

## 🔧 Multiple Ways Port 9002 is Enforced

1. **npm scripts** specify `-p 9002`
2. **Environment variable** `PORT=9002`
3. **Custom start script** exports `PORT=9002`
4. **Deployment scripts** reference port 9002

## 🔥 Firewall Configuration (Production)

For production servers, the deployment script will:
- Open port 9002 in the firewall
- Configure iptables/firewalld rules
- Ensure external access to port 9002

## 📱 Current Status

✅ **Application is currently running on**: http://localhost:9002

The development server started successfully and is ready for use!

## 🚨 Important Notes

1. **Always use port 9002** - No matter how you start the application
2. **Environment variables** ensure consistent port usage
3. **Multiple safeguards** prevent accidental port changes
4. **Production deployment** automatically configures port 9002

## 🛠️ Troubleshooting

If port 9002 is already in use:
```bash
# Check what's using port 9002
lsof -i :9002

# Kill the process if needed
sudo kill -9 <PID>

# Then start the application
npm run dev
```

---

**Your application will now ALWAYS run on port 9002! 🎉**
