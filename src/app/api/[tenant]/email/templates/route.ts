import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  console.log("📧 [TENANT-EMAIL-TEMPLATES] Getting email templates...");
  
  try {
    const tenantSlug = params.tenant;
    console.log("📝 [TENANT-EMAIL-TEMPLATES] Tenant:", tenantSlug);

    // Get tenant email templates
    const [rows] = await pool.execute(
      `SELECT 
        id,
        template_name,
        template_type,
        subject,
        html_content,
        text_content,
        is_active,
        variables,
        customization,
        created_at,
        updated_at
      FROM email_templates 
      WHERE tenant_slug = ?
      ORDER BY template_type, template_name`,
      [tenantSlug]
    );

    const templates = rows as any[];
    
    console.log("✅ [TENANT-EMAIL-TEMPLATES] Templates retrieved:", { count: templates.length });

    return NextResponse.json({
      success: true,
      templates: templates.map(template => ({
        id: template.id,
        name: template.template_name,
        type: template.template_type,
        subject: template.subject,
        htmlContent: template.html_content,
        textContent: template.text_content,
        isActive: Boolean(template.is_active),
        variables: template.variables ? JSON.parse(template.variables) : [],
        customization: template.customization ? JSON.parse(template.customization) : {
          primaryColor: '#667eea',
          secondaryColor: '#764ba2',
          backgroundColor: '#ffffff',
          textColor: '#333333',
          logoUrl: '',
          logoWidth: 200,
          logoHeight: 80,
          socialLinks: {},
          footerText: 'Thank you for choosing us!',
          showSocialIcons: true,
          headerStyle: 'modern',
          buttonStyle: 'rounded'
        },
        createdAt: template.created_at,
        updatedAt: template.updated_at
      }))
    });

  } catch (error) {
    console.error("💥 [TENANT-EMAIL-TEMPLATES] Error getting templates:", error);
    return NextResponse.json({ 
      error: "Failed to retrieve email templates",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  console.log("💾 [TENANT-EMAIL-TEMPLATES] Creating email template...");
  
  try {
    const tenantSlug = params.tenant;
    const body = await request.json();
    const { template } = body;

    console.log("📝 [TENANT-EMAIL-TEMPLATES] Request data:", { 
      tenantSlug, 
      templateName: template?.name 
    });

    if (!template) {
      return NextResponse.json({ error: "Template data is required" }, { status: 400 });
    }

    // Validate required fields
    const { name, type, subject, htmlContent, textContent, variables, customization } = template;
    
    if (!name || !type || !subject) {
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!type) missingFields.push('type');
      if (!subject) missingFields.push('subject');
      
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    console.log("💾 [TENANT-EMAIL-TEMPLATES] Inserting new template...");

    // Insert new template
    const [result] = await pool.execute(
      `INSERT INTO email_templates (
        tenant_slug,
        template_name,
        template_type,
        subject,
        html_content,
        text_content,
        variables,
        customization,
        is_active,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [
        tenantSlug,
        name,
        type,
        subject,
        htmlContent || "",
        textContent || "",
        variables ? JSON.stringify(variables) : "[]",
        customization ? JSON.stringify(customization) : "{}"
      ]
    );

    const insertResult = result as any;
    const templateId = insertResult.insertId;

    console.log("✅ [TENANT-EMAIL-TEMPLATES] Template created successfully:", { templateId });

    return NextResponse.json({
      success: true,
      message: "Email template created successfully!",
      template: {
        id: templateId,
        name,
        type,
        subject,
        htmlContent: htmlContent || "",
        textContent: textContent || "",
        variables: variables || [],
        isActive: true,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("💥 [TENANT-EMAIL-TEMPLATES] Error creating template:", error);
    return NextResponse.json({ 
      error: "Failed to create email template",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  console.log("📝 [TENANT-EMAIL-TEMPLATES] Updating email template...");
  
  try {
    const tenantSlug = params.tenant;
    const body = await request.json();
    const { template } = body;

    console.log("📝 [TENANT-EMAIL-TEMPLATES] Request data:", { 
      tenantSlug, 
      templateId: template?.id,
      templateName: template?.name 
    });

    if (!template || !template.id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    // Validate required fields
    const { id, name, type, subject, htmlContent, textContent, variables, isActive, customization } = template;
    
    if (!name || !type || !subject) {
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!type) missingFields.push('type');
      if (!subject) missingFields.push('subject');
      
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    console.log("📝 [TENANT-EMAIL-TEMPLATES] Updating template...");

    // Update template
    const [result] = await pool.execute(
      `UPDATE email_templates SET 
        template_name = ?,
        template_type = ?,
        subject = ?,
        html_content = ?,
        text_content = ?,
        variables = ?,
        customization = ?,
        is_active = ?,
        updated_at = NOW()
      WHERE id = ? AND tenant_slug = ?`,
      [
        name,
        type,
        subject,
        htmlContent || "",
        textContent || "",
        variables ? JSON.stringify(variables) : "[]",
        customization ? JSON.stringify(customization) : "{}",
        isActive ? 1 : 0,
        id,
        tenantSlug
      ]
    );

    const updateResult = result as any;
    
    if (updateResult.affectedRows === 0) {
      return NextResponse.json({ 
        error: "Template not found or you don't have permission to update it" 
      }, { status: 404 });
    }

    console.log("✅ [TENANT-EMAIL-TEMPLATES] Template updated successfully");

    return NextResponse.json({
      success: true,
      message: "Email template updated successfully!",
      template: {
        id,
        name,
        type,
        subject,
        htmlContent: htmlContent || "",
        textContent: textContent || "",
        variables: variables || [],
        isActive: Boolean(isActive),
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("💥 [TENANT-EMAIL-TEMPLATES] Error updating template:", error);
    return NextResponse.json({ 
      error: "Failed to update email template",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  console.log("🗑️ [TENANT-EMAIL-TEMPLATES] Deleting email template...");
  
  try {
    const tenantSlug = params.tenant;
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    console.log("📝 [TENANT-EMAIL-TEMPLATES] Delete request:", { tenantSlug, templateId });

    if (!templateId) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    // Delete template
    const [result] = await pool.execute(
      "DELETE FROM email_templates WHERE id = ? AND tenant_slug = ?",
      [templateId, tenantSlug]
    );

    const deleteResult = result as any;
    
    if (deleteResult.affectedRows === 0) {
      return NextResponse.json({ 
        error: "Template not found or you don't have permission to delete it" 
      }, { status: 404 });
    }

    console.log("✅ [TENANT-EMAIL-TEMPLATES] Template deleted successfully");

    return NextResponse.json({
      success: true,
      message: "Email template deleted successfully!"
    });

  } catch (error) {
    console.error("💥 [TENANT-EMAIL-TEMPLATES] Error deleting template:", error);
    return NextResponse.json({ 
      error: "Failed to delete email template",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
