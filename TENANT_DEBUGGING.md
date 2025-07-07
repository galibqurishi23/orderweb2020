# OrderWeb Multi-Tenant Debugging Guide

This document outlines the debugging tools available for testing the multi-tenant functionality of the OrderWeb system.

## Debugging Tools Overview

### 1. Tenant Session Debug API
**Endpoint**: `/api/debug/tenant-session`

This API provides detailed information about the current tenant context, including:
- Tenant slug and context type
- Tenant database information
- User and order counts
- Settings and configuration

#### Usage Examples:

```bash
# Test without specific tenant (relies on middleware)
curl http://localhost:9002/api/debug/tenant-session | jq

# Test with specific tenant slug
curl "http://localhost:9002/api/debug/tenant-session?tenant=demo-restaurant" | jq

# Test with headers (simulating middleware)
curl -H "x-tenant-slug: demo-restaurant" -H "x-tenant-context: admin" \
     http://localhost:9002/api/debug/tenant-session | jq
```

### 2. Command Line Testing Script
**File**: `tools/test-tenant-session.sh`

A comprehensive shell script that tests tenant functionality from the command line.

#### Usage:

```bash
# Test general tenant session API
./tools/test-tenant-session.sh

# Test specific tenant
./tools/test-tenant-session.sh demo-restaurant

# Test another tenant
./tools/test-tenant-session.sh my-restaurant
```

The script will test:
- Tenant session debug API
- Tenant information endpoint
- Provide links to test admin and customer interfaces

### 3. In-App Debug Panel
**Component**: `TenantDebugPanel`

A React component that displays tenant debug information directly in the admin dashboard.

- **Location**: Visible in tenant admin dashboards during development
- **Toggle**: Click "Show Debug" button to expand the panel
- **Features**: Real-time tenant context, statistics, and technical details

## Testing Multi-Tenant Isolation

### Step 1: Create Test Restaurants

1. Go to http://localhost:9002/super-admin
2. Create multiple test restaurants (e.g., "Demo Restaurant", "Test Cafe")
3. Note the slugs generated (e.g., "demo-restaurant", "test-cafe")

### Step 2: Test Tenant Access

For each restaurant created:

```bash
# Test restaurant 1
./tools/test-tenant-session.sh demo-restaurant

# Test restaurant 2
./tools/test-tenant-session.sh test-cafe
```

### Step 3: Verify Data Isolation

1. Access each restaurant's admin interface:
   - http://localhost:9002/demo-restaurant/admin
   - http://localhost:9002/test-cafe/admin

2. In each admin dashboard:
   - Click "Show Debug" to see the debug panel
   - Verify the tenant slug and context are correct
   - Check that user/order counts are isolated

3. Create orders or menu items in one restaurant and verify they don't appear in the other

### Step 4: Test Customer Interfaces

1. Access customer interfaces:
   - http://localhost:9002/demo-restaurant
   - http://localhost:9002/test-cafe

2. Verify each shows only that restaurant's menu and branding

## Common Testing Scenarios

### Scenario 1: Tenant Context Verification
```bash
# Should show tenant context headers
curl -v http://localhost:9002/demo-restaurant/admin/api/debug/tenant-session
```

### Scenario 2: Database Isolation Test
```bash
# Get order count for restaurant 1
curl "http://localhost:9002/api/debug/tenant-session?tenant=demo-restaurant" | jq '.tenantDetails.orders.count'

# Get order count for restaurant 2  
curl "http://localhost:9002/api/debug/tenant-session?tenant=test-cafe" | jq '.tenantDetails.orders.count'
```

### Scenario 3: Middleware Testing
```bash
# Test if middleware sets correct headers
curl -v http://localhost:9002/demo-restaurant/admin 2>&1 | grep x-tenant
```

## Troubleshooting

### Issue: "Tenant not found" Error
- **Cause**: Tenant slug doesn't exist in database
- **Solution**: Check super-admin dashboard for correct slug, or create the tenant

### Issue: Empty Debug Response
- **Cause**: Database connection issues or tenant service errors
- **Solution**: Check server logs, verify database connectivity

### Issue: Headers Not Set
- **Cause**: Middleware not working correctly
- **Solution**: Check middleware.ts configuration, verify route patterns

### Issue: Cross-Tenant Data Leakage
- **Cause**: Database queries not filtering by tenant_id
- **Solution**: Review all database queries to ensure they include tenant_id filter

## Development Notes

- The debug panel only appears in development mode (`NODE_ENV=development`)
- All debug endpoints should be removed or protected in production
- Use the testing script regularly during development to catch tenant isolation issues
- Monitor server logs when testing for additional debugging information

## Production Checklist

Before deploying to production:

- [ ] Remove or protect all `/api/debug/*` endpoints
- [ ] Ensure debug panel doesn't appear (`NODE_ENV=production`)
- [ ] Remove or protect the testing script
- [ ] Verify all database queries filter by tenant_id
- [ ] Test with real domain names and tenant routing
- [ ] Audit all API endpoints for tenant isolation
