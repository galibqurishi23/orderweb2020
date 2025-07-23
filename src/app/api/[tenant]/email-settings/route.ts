import { NextRequest, NextResponse } from 'next/server';
import { tenantEmailService } from '@/lib/tenant-email-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const tenantId = params.tenant;
    
    const emailSettings = await tenantEmailService.getTenantEmailSettings(tenantId);
    
    if (!emailSettings) {
      return NextResponse.json(
        { success: false, message: 'No email settings found' },
        { status: 404 }
      );
    }

    // Don't return the password in the response
    const { smtp_password, ...safeSettings } = emailSettings;
    
    return NextResponse.json({
      success: true,
      data: {
        ...safeSettings,
        smtp_password: '***hidden***' // Indicate password exists without showing it
      }
    });
  } catch (error) {
    console.error('Error getting email settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get email settings' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const tenantId = params.tenant;
    const data = await request.json();
    
    // Validate required fields
    const requiredFields = ['smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'from_email', 'from_name'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.from_email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid from_email format' },
        { status: 400 }
      );
    }

    if (data.reply_to && !emailRegex.test(data.reply_to)) {
      return NextResponse.json(
        { success: false, message: 'Invalid reply_to email format' },
        { status: 400 }
      );
    }

    // Validate port number
    const port = parseInt(data.smtp_port);
    if (isNaN(port) || port < 1 || port > 65535) {
      return NextResponse.json(
        { success: false, message: 'Invalid SMTP port number' },
        { status: 400 }
      );
    }

    const emailSettings = {
      tenant_id: tenantId,
      smtp_host: data.smtp_host.trim(),
      smtp_port: port,
      smtp_username: data.smtp_username.trim(),
      smtp_password: data.smtp_password,
      from_email: data.from_email.trim().toLowerCase(),
      from_name: data.from_name.trim(),
      reply_to: data.reply_to ? data.reply_to.trim().toLowerCase() : undefined,
      is_ssl: data.is_ssl !== false, // Default to true
      is_active: data.is_active !== false, // Default to true
      failure_count: 0
    };

    const success = await tenantEmailService.saveTenantEmailSettings(emailSettings);
    
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Failed to save email settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email settings saved successfully'
    });
  } catch (error) {
    console.error('Error saving email settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save email settings' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const tenantId = params.tenant;
    const data = await request.json();
    
    // Get existing settings
    const existingSettings = await tenantEmailService.getTenantEmailSettings(tenantId);
    if (!existingSettings) {
      return NextResponse.json(
        { success: false, message: 'Email settings not found' },
        { status: 404 }
      );
    }

    // If password is the hidden placeholder, keep the existing password
    const updateData = {
      ...existingSettings,
      ...data,
      tenant_id: tenantId
    };

    if (data.smtp_password === '***hidden***') {
      updateData.smtp_password = existingSettings.smtp_password;
    }

    // Validate email format if provided
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (updateData.from_email && !emailRegex.test(updateData.from_email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid from_email format' },
        { status: 400 }
      );
    }

    if (updateData.reply_to && !emailRegex.test(updateData.reply_to)) {
      return NextResponse.json(
        { success: false, message: 'Invalid reply_to email format' },
        { status: 400 }
      );
    }

    // Validate port number if provided
    if (updateData.smtp_port) {
      const port = parseInt(updateData.smtp_port);
      if (isNaN(port) || port < 1 || port > 65535) {
        return NextResponse.json(
          { success: false, message: 'Invalid SMTP port number' },
          { status: 400 }
        );
      }
      updateData.smtp_port = port;
    }

    const success = await tenantEmailService.saveTenantEmailSettings(updateData);
    
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Failed to update email settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating email settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update email settings' },
      { status: 500 }
    );
  }
}
