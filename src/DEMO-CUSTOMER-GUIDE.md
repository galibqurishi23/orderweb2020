# 🎯 Demo Customer - Complete Testing Guide

## 🔐 Login Credentials
- **Email:** `demo.customer@orderweb.com`
- **Password:** `demo123456`
- **Tenant:** Tikka Restaurant

## 🏆 Customer Features to Test

### 1. **Customer Dashboard**
- Navigate to: `/tikka/customer/dashboard`
- **Features to check:**
  - ✅ Gold tier loyalty status with 2,450 points
  - ✅ Total orders: 15 orders placed
  - ✅ Total spent: £485.75
  - ✅ Recent order history
  - ✅ Loyalty tier progress bar
  - ✅ Quick action buttons

### 2. **Customer Profile** 
- Navigate to: `/tikka/customer/profile`
- **Features to check:**
  - ✅ Personal information (name, email, phone, birthday)
  - ✅ Communication preferences (email/SMS settings)
  - ✅ Dietary restrictions and preferences
  - ✅ Account security settings
  - ✅ Profile editing functionality

### 3. **Order History**
- Navigate to: `/tikka/customer/orders`
- **Features to check:**
  - ✅ Complete order history with details
  - ✅ Order status tracking
  - ✅ Search and filter functionality
  - ✅ Order item breakdown
  - ✅ Reorder functionality

### 4. **Address Management**
- Navigate to: `/tikka/customer/addresses`
- **Features to check:**
  - ✅ 6 pre-saved addresses (Home, Office, Sister's House, etc.)
  - ✅ Default address setting
  - ✅ Address editing and deletion
  - ✅ Delivery instructions
  - ✅ Add new address functionality

### 5. **Loyalty Program**
- Navigate to: `/tikka/customer/loyalty` (if available)
- **Features to check:**
  - ✅ Current tier: **Gold** (2,450 points balance)
  - ✅ Total earned: 3,200 points
  - ✅ Total redeemed: 750 points
  - ✅ Points needed for Platinum: 1,800 more points
  - ✅ Transaction history (14 transactions)
  - ✅ Tier benefits and progression

## 📊 Demo Customer Data Overview

### **Personal Information:**
- **Name:** Demo Customer
- **Email:** demo.customer@orderweb.com
- **Phone:** +44 7890 123456
- **Birthday:** March 15, 1988
- **Customer Segment:** VIP
- **Member Since:** 6 months ago

### **Loyalty Status:**
- **Current Tier:** Gold
- **Points Balance:** 2,450 points
- **Total Earned:** 3,200 points
- **Total Redeemed:** 750 points
- **Transaction History:** 14 transactions including:
  - Welcome signup bonus (100 points)
  - Order points earned (multiple orders)
  - Birthday bonus (250 points)
  - Points redemptions for discounts

### **Saved Addresses:**
1. **Home** (Default) - 42 Baker Street, Flat 2B, London NW1 6XE
2. **Office** - 10 Downing Street, London SW1A 2AA
3. **Sister's House** - 221B Baker Street, London NW1 6XE
4. *(3 additional addresses for testing)*

### **Preferences:**
- **Dietary:** Vegetarian, No nuts, Gluten-free options preferred
- **Communication:** Email notifications enabled, SMS disabled
- **Delivery:** Evening preference, special instructions included

### **Order History:**
- **Total Orders:** 15 orders
- **Total Spent:** £485.75
- **Average Order Value:** £32.38
- **Last Order:** 3 days ago
- **Customer Since:** 6 months ago

## 🧪 Testing Scenarios

### **Login Testing:**
1. Go to `/tikka/customer/login`
2. Use credentials above
3. Should redirect to customer dashboard

### **Profile Management:**
1. Edit personal information
2. Change communication preferences
3. Update dietary restrictions
4. Test form validation

### **Address Management:**
1. Add a new address
2. Set different default address
3. Edit existing address
4. Delete an address

### **Loyalty System:**
1. View points balance and tier
2. Check transaction history
3. Test tier progression display
4. Verify points calculations

### **Order History:**
1. Browse past orders
2. Filter by date/status
3. Search for specific orders
4. View order details

## 🔍 Navigation Paths

- **Main Menu:** `/tikka/`
- **Customer Login:** `/tikka/customer/login`
- **Dashboard:** `/tikka/customer/dashboard`
- **Profile:** `/tikka/customer/profile`
- **Orders:** `/tikka/customer/orders`
- **Addresses:** `/tikka/customer/addresses`
- **Settings:** `/tikka/customer/settings`

## 📝 Notes

- This demo customer is **permanent** and can be used for ongoing testing
- All customer portal features are fully populated with realistic data
- The customer has a rich history for comprehensive testing
- Password is simple for easy testing: `demo123456`
- Customer is linked to the "Tikka" restaurant tenant

## 🛠️ Reset Demo Customer

If you need to reset or recreate the demo customer, simply run:
```bash
mysql -u root -p dinedesk_db < database-updates/create-comprehensive-demo-customer.sql
```

---
**Demo Customer Ready for Testing!** 🚀
