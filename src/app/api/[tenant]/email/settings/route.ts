import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  console.log("🔍 [TENANT-EMAIL-SETTINGS] Getting email settings...");
  
  try {
    const tenantSlug = params.tenant;
    console.log("📝 [TENANT-EMAIL-SETTINGS] Tenant:", tenantSlug);

    // Get tenant email settings
    const [rows] = await pool.execute(
      `SELECT 
        name,
        smtp_host,
        smtp_port,
        smtp_secure,
        smtp_user,
        smtp_password,
        smtp_from,
        email_enabled,
        created_at,
        updated_at
      FROM tenants 
      WHERE slug = ?`,
      [tenantSlug]
    );

    const tenants = rows as any[];
    
    if (tenants.length === 0) {
      console.error("❌ [TENANT-EMAIL-SETTINGS] Tenant not found:", tenantSlug);
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const tenant = tenants[0];
    
    // Return settings without exposing the password
    const emailSettings = {
      name: tenant.name,
      smtpHost: tenant.smtp_host || "",
      smtpPort: tenant.smtp_port || 587,
      smtpSecure: Boolean(tenant.smtp_secure),
      smtpUser: tenant.smtp_user || "",
      smtpFrom: tenant.smtp_from || "",
      emailEnabled: Boolean(tenant.email_enabled),
      hasPassword: Boolean(tenant.smtp_password),
      isConfigured: Boolean(tenant.smtp_host && tenant.smtp_user && tenant.smtp_password),
      lastUpdated: tenant.updated_at
    };

    console.log("✅ [TENANT-EMAIL-SETTINGS] Settings retrieved:", {
      ...emailSettings,
      hasPassword: emailSettings.hasPassword
    });

    return NextResponse.json({
      success: true,
      emailSettings
    });

  } catch (error) {
    console.error("💥 [TENANT-EMAIL-SETTINGS] Error getting settings:", error);
    return NextResponse.json({ 
      error: "Failed to retrieve email settings",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  console.log("💾 [TENANT-EMAIL-SETTINGS] Saving email settings...");
  
  try {
    const tenantSlug = params.tenant;
    const body = await request.json();
    const { smtpSettings } = body;

    console.log("📝 [TENANT-EMAIL-SETTINGS] Request data:", { 
      tenantSlug, 
      settings: { ...smtpSettings, password: "***" }
    });

    if (!smtpSettings) {
      return NextResponse.json({ error: "SMTP settings are required" }, { status: 400 });
    }

    // Validate required fields
    const { host, port, username, password, fromEmail, fromName, secure } = smtpSettings;
    
    if (!host || !username || !password || !fromEmail) {
      const missingFields = [];
      if (!host) missingFields.push('host');
      if (!username) missingFields.push('username');
      if (!password) missingFields.push('password');
      if (!fromEmail) missingFields.push('fromEmail');
      
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    // Auto-correct port/secure settings
    let correctedPort = parseInt(port) || 587;
    let correctedSecure = Boolean(secure);
    
    // Auto-correct common misconfigurations
    if (correctedPort === 465 && !correctedSecure) {
      correctedSecure = true;
      console.log("🔧 [AUTO-CORRECT] Port 465 detected, enabling SSL");
    } else if (correctedPort === 587 && correctedSecure) {
      correctedSecure = false;
      console.log("🔧 [AUTO-CORRECT] Port 587 detected, disabling SSL (using STARTTLS)");
    }

    console.log("🔍 [TENANT-EMAIL-SETTINGS] Checking if tenant exists...");

    // Check if tenant exists
    const [existingRows] = await pool.execute(
      "SELECT id FROM tenants WHERE slug = ?",
      [tenantSlug]
    );

    const existingTenants = existingRows as any[];
    
    if (existingTenants.length === 0) {
      console.error("❌ [TENANT-EMAIL-SETTINGS] Tenant not found:", tenantSlug);
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    console.log("💾 [TENANT-EMAIL-SETTINGS] Updating tenant email settings...");

    // Update tenant email settings
    await pool.execute(
      `UPDATE tenants SET 
        smtp_host = ?,
        smtp_port = ?,
        smtp_secure = ?,
        smtp_user = ?,
        smtp_password = ?,
        smtp_from = ?,
        email_enabled = 1,
        updated_at = NOW()
      WHERE slug = ?`,
      [
        host,
        correctedPort,
        correctedSecure ? 1 : 0,
        username,
        password,
        fromEmail,
        tenantSlug
      ]
    );

    console.log("✅ [TENANT-EMAIL-SETTINGS] Email settings updated successfully");

    // Log the configuration change
    try {
      await pool.execute(
        `INSERT INTO email_logs (tenant_slug, email_type, status, sent_at, details) 
         VALUES (?, ?, ?, NOW(), ?)`,
        [
          tenantSlug, 
          "config_update", 
          "success", 
          `SMTP settings updated. Host: ${host}, Port: ${correctedPort}, Secure: ${correctedSecure}`
        ]
      );
    } catch (logError) {
      console.warn("⚠️ [TENANT-EMAIL-SETTINGS] Failed to log config change:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "Email settings saved successfully!",
      settings: {
        host,
        port: correctedPort,
        secure: correctedSecure,
        username,
        fromEmail,
        fromName: fromName || "",
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("💥 [TENANT-EMAIL-SETTINGS] Error saving settings:", error);
    return NextResponse.json({ 
      error: "Failed to save email settings",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  console.log("🗑️ [TENANT-EMAIL-SETTINGS] Clearing email settings...");
  
  try {
    const tenantSlug = params.tenant;
    console.log("📝 [TENANT-EMAIL-SETTINGS] Tenant:", tenantSlug);

    // Clear tenant email settings
    await pool.execute(
      `UPDATE tenants SET 
        smtp_host = NULL,
        smtp_port = NULL,
        smtp_secure = 0,
        smtp_user = NULL,
        smtp_password = NULL,
        smtp_from = NULL,
        email_enabled = 0,
        updated_at = NOW()
      WHERE slug = ?`,
      [tenantSlug]
    );

    console.log("✅ [TENANT-EMAIL-SETTINGS] Email settings cleared successfully");

    // Log the configuration change
    try {
      await pool.execute(
        `INSERT INTO email_logs (tenant_slug, email_type, status, sent_at, details) 
         VALUES (?, ?, ?, NOW(), ?)`,
        [tenantSlug, "config_clear", "success", "SMTP settings cleared"]
      );
    } catch (logError) {
      console.warn("⚠️ [TENANT-EMAIL-SETTINGS] Failed to log config clear:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "Email settings cleared successfully!"
    });

  } catch (error) {
    console.error("💥 [TENANT-EMAIL-SETTINGS] Error clearing settings:", error);
    return NextResponse.json({ 
      error: "Failed to clear email settings",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
