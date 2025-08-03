import { NextRequest, NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/tenant-service";
import pool from "@/lib/db";

interface EmailTemplateCustomization {
  logo: string;
  logoPosition: 'left' | 'center' | 'right';
  footerMessage: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
    tiktok: string;
    website: string;
  };
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const tenantSlug = params.tenant;
    const tenant = await getTenantBySlug(tenantSlug);
    
    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    // Check if email_template_customization table exists and get customization
    const connection = await pool.getConnection();
    const [customizationResult] = await connection.execute(
      `SELECT customization_data FROM email_template_customization WHERE tenant_id = ?`,
      [tenant.id]
    );
    connection.release();

    let customization = null;
    if (Array.isArray(customizationResult) && customizationResult.length > 0) {
      try {
        customization = JSON.parse((customizationResult[0] as any).customization_data);
      } catch (e) {
        console.error("Failed to parse customization data:", e);
      }
    }

    return NextResponse.json({ customization });
  } catch (error) {
    console.error("Error fetching template customization:", error);
    return NextResponse.json(
      { error: "Failed to fetch template customization" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  let connection;
  
  try {
    const tenantSlug = params.tenant;
    console.log("=== POST /api/[tenant]/email/template-customization ===");
    console.log("Saving template customization for tenant:", tenantSlug);
    
    const tenant = await getTenantBySlug(tenantSlug);
    
    if (!tenant) {
      console.error("Tenant not found:", tenantSlug);
      const errorResponse = NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
      console.log("Returning tenant not found response:", errorResponse);
      return errorResponse;
    }

    const body = await request.json();
    console.log("Request body:", JSON.stringify(body, null, 2));
    
    const { customization } = body;
    console.log("Received customization data:", JSON.stringify(customization, null, 2));

    if (!customization) {
      console.error("No customization data provided");
      const errorResponse = NextResponse.json(
        { error: "Customization data is required" },
        { status: 400 }
      );
      console.log("Returning no customization data response:", errorResponse);
      return errorResponse;
    }

    connection = await pool.getConnection();
    console.log("Database connection established");
    
    // Drop and recreate table with correct data type
    await connection.execute(`DROP TABLE IF EXISTS email_template_customization`);
    console.log("Dropped existing table if it existed");
    
    // Create table with correct data type
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS email_template_customization (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        customization_data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_tenant (tenant_id)
      )
    `);
    console.log("Table created with correct structure");
    console.log("Table verified/created");

    // Insert or update customization
    const result = await connection.execute(
      `INSERT INTO email_template_customization (tenant_id, customization_data) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE 
       customization_data = VALUES(customization_data),
       updated_at = CURRENT_TIMESTAMP`,
      [tenant.id, JSON.stringify(customization)]
    );
    
    console.log("Database operation completed:", result);

    const successResponse = NextResponse.json({ 
      success: true,
      message: "Template customization saved successfully" 
    }, { status: 200 });
    
    console.log("Returning success response:", {
      success: true,
      message: "Template customization saved successfully"
    });
    
    return successResponse;
  } catch (error) {
    console.error("=== ERROR in POST /api/[tenant]/email/template-customization ===");
    console.error("Error saving template customization:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'Unknown error');
    
    const errorResponse = NextResponse.json(
      { error: "Failed to save template customization", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
    
    console.log("Returning error response:", {
      error: "Failed to save template customization", 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return errorResponse;
  } finally {
    if (connection) {
      connection.release();
      console.log("Database connection released");
    }
    console.log("=== END POST /api/[tenant]/email/template-customization ===");
  }
}
