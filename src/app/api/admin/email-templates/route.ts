import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get tenant from URL search params
    const { searchParams } = new URL(request.url);
    const tenantSlug = searchParams.get("tenant");

    if (!tenantSlug) {
      return NextResponse.json({ error: "Tenant parameter is required" }, { status: 400 });
    }

    // Get tenant ID first
    const [tenantRows] = await pool.execute(
      "SELECT id FROM tenants WHERE slug = ?",
      [tenantSlug]
    );

    const tenants = tenantRows as any[];
    if (tenants.length === 0) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const tenantId = tenants[0].id;

    // Get email templates for this tenant
    const [rows] = await pool.execute(
      "SELECT id, template_name, subject, is_active FROM email_templates WHERE tenant_id = ? ORDER BY template_name",
      [tenantId]
    );

    const templates = (rows as any[]).map(template => ({
      id: template.id,
      name: template.template_name,
      subject: template.subject,
      enabled: Boolean(template.is_active)
    }));

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching email templates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
