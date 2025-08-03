# Tenant Email System API Documentation

## Overview
The tenant email system has been redesigned with dedicated API endpoints for each tenant, providing better isolation, security, and management. This system allows each restaurant tenant to configure their own email settings and templates independently.

## New API Endpoints

### 1. Tenant Email Settings
**Endpoint**: `/api/[tenant]/email/settings`

#### GET - Retrieve Email Settings
- **URL**: `GET /api/[tenant]/email/settings`
- **Description**: Get current email configuration for the tenant
- **Response**:
  ```json
  {
    "success": true,
    "emailSettings": {
      "name": "Restaurant Name",
      "smtpHost": "smtp.gmail.com",
      "smtpPort": 587,
      "smtpSecure": false,
      "smtpUser": "user@example.com",
      "smtpFrom": "noreply@restaurant.com",
      "emailEnabled": true,
      "hasPassword": true,
      "isConfigured": true,
      "lastUpdated": "2025-01-24T10:30:00.000Z"
    }
  }
  ```

#### POST - Save Email Settings
- **URL**: `POST /api/[tenant]/email/settings`
- **Body**:
  ```json
  {
    "smtpSettings": {
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false,
      "username": "your-email@gmail.com",
      "password": "your-app-password",
      "fromEmail": "noreply@restaurant.com",
      "fromName": "Restaurant Name"
    }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Email settings saved successfully!",
    "settings": {
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false,
      "username": "your-email@gmail.com",
      "fromEmail": "noreply@restaurant.com",
      "fromName": "Restaurant Name",
      "timestamp": "2025-01-24T10:30:00.000Z"
    }
  }
  ```

#### DELETE - Clear Email Settings
- **URL**: `DELETE /api/[tenant]/email/settings`
- **Description**: Clear all email configuration for the tenant

### 2. Tenant Email Test
**Endpoint**: `/api/[tenant]/email/test`

#### POST - Send Test Email
- **URL**: `POST /api/[tenant]/email/test`
- **Body**:
  ```json
  {
    "email": "test@example.com"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Test email sent successfully!",
    "details": {
      "messageId": "<message-id>",
      "response": "250 Message queued",
      "tenant": "Restaurant Name",
      "timestamp": "2025-01-24T10:30:00.000Z"
    }
  }
  ```

### 3. Tenant Email Templates
**Endpoint**: `/api/[tenant]/email/templates`

#### GET - Retrieve Email Templates
- **URL**: `GET /api/[tenant]/email/templates`
- **Response**:
  ```json
  {
    "success": true,
    "templates": [
      {
        "id": 1,
        "name": "Order Confirmation",
        "type": "order_confirmation",
        "subject": "Your Order Confirmation #{{orderNumber}}",
        "htmlContent": "<html>...</html>",
        "textContent": "Plain text version...",
        "isActive": true,
        "variables": ["orderNumber", "customerName", "items"],
        "createdAt": "2025-01-24T10:30:00.000Z",
        "updatedAt": "2025-01-24T10:30:00.000Z"
      }
    ]
  }
  ```

#### POST - Create Email Template
- **URL**: `POST /api/[tenant]/email/templates`
- **Body**:
  ```json
  {
    "template": {
      "name": "Welcome Email",
      "type": "welcome",
      "subject": "Welcome to {{restaurantName}}!",
      "htmlContent": "<html>...</html>",
      "textContent": "Plain text version...",
      "variables": ["restaurantName", "customerName"]
    }
  }
  ```

#### PUT - Update Email Template
- **URL**: `PUT /api/[tenant]/email/templates`
- **Body**:
  ```json
  {
    "template": {
      "id": 1,
      "name": "Updated Template",
      "type": "order_confirmation",
      "subject": "Updated Subject",
      "htmlContent": "<html>...</html>",
      "textContent": "Updated plain text...",
      "variables": ["var1", "var2"],
      "isActive": true
    }
  }
  ```

#### DELETE - Delete Email Template
- **URL**: `DELETE /api/[tenant]/email/templates?id=1`

## Key Features

### 1. Tenant Isolation
- Each tenant has their own email configuration
- Settings are completely isolated between tenants
- No cross-tenant data access

### 2. Auto-Configuration
- Automatic port/security setting correction
- Port 465 → SSL enabled
- Port 587 → STARTTLS (SSL disabled)

### 3. Enhanced Error Handling
- Specific error messages for different SMTP issues
- Authentication errors
- Connection errors
- SSL/TLS errors
- Timeout errors

### 4. Comprehensive Logging
- Email test logs with detailed information
- Configuration change logs
- Debug information for troubleshooting

### 5. Rich Test Emails
- Beautiful HTML formatting
- Test details included
- Success confirmation
- Professional appearance

## Security Features

### 1. Password Protection
- Passwords are never returned in GET requests
- Only indicates if password is set via `hasPassword` field

### 2. Tenant Validation
- All endpoints validate tenant existence
- Tenant-specific data access only

### 3. Input Validation
- Required field validation
- Email format validation
- Port number validation

## Updated Frontend Integration

The `EmailSettings` component has been updated to use the new tenant-specific endpoints:

### Changes Made:
1. **Load Settings**: Now uses `/api/[tenant]/email/settings`
2. **Save Settings**: Now uses `/api/[tenant]/email/settings`
3. **Test Email**: Now uses `/api/[tenant]/email/test`
4. **Load Templates**: Now uses `/api/[tenant]/email/templates`

### Benefits:
- Better tenant isolation
- Cleaner API structure
- Improved error handling
- More specific error messages
- Enhanced security

## Migration Notes

### From Old System:
- Old endpoints: `/api/admin/email-settings`, `/api/admin/test-email`
- New endpoints: `/api/[tenant]/email/settings`, `/api/[tenant]/email/test`

### Database Compatibility:
- Uses existing `tenants` table for SMTP settings
- Uses existing `email_templates` table for templates
- Uses existing `email_logs` table for logging

## Error Codes

### Common Error Responses:
- `400`: Bad Request (missing fields, invalid data)
- `404`: Tenant not found
- `500`: Server error (SMTP errors, database errors)

### SMTP Error Codes:
- `AUTH_FAILED`: Authentication failed
- `CONNECTION_FAILED`: Cannot connect to SMTP server
- `SSL_ERROR`: SSL/TLS certificate error
- `TIMEOUT`: Connection timeout
- `INVALID_EMAIL`: Invalid email format

## Testing

### Test Email Features:
1. Beautiful HTML email template
2. Technical details included
3. Success confirmation
4. Professional branding
5. Timestamp and tenant information

### Test Process:
1. Validate tenant exists
2. Check SMTP configuration
3. Create email transporter
4. Send formatted test email
5. Log the test result
6. Return detailed response

This new system provides a robust, scalable, and secure email management solution for multi-tenant restaurant management.
