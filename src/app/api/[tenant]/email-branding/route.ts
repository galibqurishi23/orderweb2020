import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

interface EmailBranding {
  id?: number;
  tenant_id: string;
  selected_customer_template: 'A' | 'B';
  restaurant_logo_url?: string;
  restaurant_name?: string;
  restaurant_tagline?: string;
  social_media_facebook?: string;
  social_media_instagram?: string;
  social_media_twitter?: string;
  custom_footer_text?: string;
  is_active: boolean;
  // Color Customization
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  text_color?: string;
  background_color?: string;
  header_background_color?: string;
  footer_background_color?: string;
  button_color?: string;
  button_text_color?: string;
  border_color?: string;
  // Template A Specific Colors
  template_a_header_color?: string;
  template_a_accent_color?: string;
  template_a_button_color?: string;
  // Template B Specific Colors
  template_b_header_color?: string;
  template_b_accent_color?: string;
  template_b_button_color?: string;
  // Typography & Layout
  font_family?: 'Arial' | 'Helvetica' | 'Georgia' | 'Times' | 'Verdana' | 'Tahoma';
  font_size?: 'small' | 'medium' | 'large';
  border_radius?: 'none' | 'small' | 'medium' | 'large';
  email_width?: number;
  logo_position?: 'left' | 'center' | 'right';
  logo_size?: 'small' | 'medium' | 'large';
  header_style?: 'minimal' | 'gradient' | 'shadow' | 'border';
  button_style?: 'flat' | 'rounded' | 'pill' | 'outline';
  template_layout?: 'classic' | 'modern' | 'minimal' | 'vibrant';
  custom_css?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const tenantId = params.tenant;

    // Get email branding for the tenant
    const [brandingRows] = await db.execute(
      `SELECT * FROM tenant_email_branding WHERE tenant_id = ?`,
      [tenantId]
    );

    const branding = (brandingRows as any[])[0];

    if (!branding) {
      // Create default branding if none exists
      const defaultBranding: EmailBranding = {
        tenant_id: tenantId,
        selected_customer_template: 'A',
        restaurant_logo_url: '',
        restaurant_name: '',
        restaurant_tagline: '',
        social_media_facebook: '',
        social_media_instagram: '',
        social_media_twitter: '',
        custom_footer_text: '',
        is_active: true,
        // Default color scheme - Professional Blue
        primary_color: '#1e40af',
        secondary_color: '#3b82f6',
        accent_color: '#60a5fa',
        text_color: '#1f2937',
        background_color: '#ffffff',
        header_background_color: '#f8fafc',
        footer_background_color: '#f1f5f9',
        button_color: '#1e40af',
        button_text_color: '#ffffff',
        border_color: '#e2e8f0',
        // Template A specific colors
        template_a_header_color: '#1e40af',
        template_a_accent_color: '#60a5fa',
        template_a_button_color: '#1e40af',
        // Template B specific colors
        template_b_header_color: '#7c3aed',
        template_b_accent_color: '#a855f7',
        template_b_button_color: '#7c3aed',
        // Default typography & layout
        font_family: 'Arial',
        font_size: 'medium',
        border_radius: 'small',
        email_width: 600,
        logo_position: 'center',
        logo_size: 'medium',
        header_style: 'minimal',
        button_style: 'rounded',
        template_layout: 'modern'
      };

      const [result] = await db.execute(
        `INSERT INTO tenant_email_branding 
         (tenant_id, selected_customer_template, restaurant_logo_url, restaurant_name, restaurant_tagline,
          social_media_facebook, social_media_instagram, social_media_twitter, custom_footer_text, is_active,
          primary_color, secondary_color, accent_color, text_color, background_color,
          header_background_color, footer_background_color, button_color, button_text_color,
          border_color, template_a_header_color, template_a_accent_color, template_a_button_color,
          template_b_header_color, template_b_accent_color, template_b_button_color,
          font_family, font_size, border_radius, email_width, logo_position,
          logo_size, header_style, button_style, template_layout) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          defaultBranding.tenant_id,
          defaultBranding.selected_customer_template,
          defaultBranding.restaurant_logo_url,
          defaultBranding.restaurant_name,
          defaultBranding.restaurant_tagline,
          defaultBranding.social_media_facebook,
          defaultBranding.social_media_instagram,
          defaultBranding.social_media_twitter,
          defaultBranding.custom_footer_text,
          defaultBranding.is_active,
          defaultBranding.primary_color,
          defaultBranding.secondary_color,
          defaultBranding.accent_color,
          defaultBranding.text_color,
          defaultBranding.background_color,
          defaultBranding.header_background_color,
          defaultBranding.footer_background_color,
          defaultBranding.button_color,
          defaultBranding.button_text_color,
          defaultBranding.border_color,
          defaultBranding.template_a_header_color,
          defaultBranding.template_a_accent_color,
          defaultBranding.template_a_button_color,
          defaultBranding.template_b_header_color,
          defaultBranding.template_b_accent_color,
          defaultBranding.template_b_button_color,
          defaultBranding.font_family,
          defaultBranding.font_size,
          defaultBranding.border_radius,
          defaultBranding.email_width,
          defaultBranding.logo_position,
          defaultBranding.logo_size,
          defaultBranding.header_style,
          defaultBranding.button_style,
          defaultBranding.template_layout
        ]
      );

      const insertResult = result as ResultSetHeader;
      defaultBranding.id = insertResult.insertId;

      return NextResponse.json({
        success: true,
        data: defaultBranding
      });
    }

    return NextResponse.json({
      success: true,
      data: branding
    });

  } catch (error) {
    console.error('Error fetching email branding:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch email branding' },
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
    const brandingData: EmailBranding = await request.json();

    // Validate template selection
    if (!['A', 'B'].includes(brandingData.selected_customer_template)) {
      return NextResponse.json(
        { success: false, message: 'Invalid template selection' },
        { status: 400 }
      );
    }

    // Validate URLs if provided
    const urlFields = ['restaurant_logo_url', 'social_media_facebook', 'social_media_instagram', 'social_media_twitter'];
    for (const field of urlFields) {
      const url = brandingData[field as keyof EmailBranding] as string;
      if (url && url.trim()) {
        try {
          new URL(url);
        } catch {
          return NextResponse.json(
            { success: false, message: `Invalid URL format for ${field.replace('_', ' ')}` },
            { status: 400 }
          );
        }
      }
    }

    // Check if branding record exists
    const [existingRows] = await db.execute(
      'SELECT id FROM tenant_email_branding WHERE tenant_id = ?',
      [tenantId]
    );

    const existing = (existingRows as any[])[0];

    if (existing) {
      // Update existing record
      await db.execute(
        `UPDATE tenant_email_branding 
         SET selected_customer_template = ?, restaurant_logo_url = ?, restaurant_name = ?, restaurant_tagline = ?,
             social_media_facebook = ?, social_media_instagram = ?, social_media_twitter = ?, custom_footer_text = ?, 
             is_active = ?, primary_color = ?, secondary_color = ?, accent_color = ?,
             text_color = ?, background_color = ?, header_background_color = ?,
             footer_background_color = ?, button_color = ?, button_text_color = ?,
             border_color = ?, template_a_header_color = ?, template_a_accent_color = ?, template_a_button_color = ?,
             template_b_header_color = ?, template_b_accent_color = ?, template_b_button_color = ?,
             font_family = ?, font_size = ?, border_radius = ?,
             email_width = ?, logo_position = ?, logo_size = ?, header_style = ?,
             button_style = ?, template_layout = ?, custom_css = ?, updated_at = CURRENT_TIMESTAMP
         WHERE tenant_id = ?`,
        [
          brandingData.selected_customer_template,
          brandingData.restaurant_logo_url || null,
          brandingData.restaurant_name || null,
          brandingData.restaurant_tagline || null,
          brandingData.social_media_facebook || null,
          brandingData.social_media_instagram || null,
          brandingData.social_media_twitter || null,
          brandingData.custom_footer_text || null,
          brandingData.is_active,
          brandingData.primary_color || null,
          brandingData.secondary_color || null,
          brandingData.accent_color || null,
          brandingData.text_color || null,
          brandingData.background_color || null,
          brandingData.header_background_color || null,
          brandingData.footer_background_color || null,
          brandingData.button_color || null,
          brandingData.button_text_color || null,
          brandingData.border_color || null,
          brandingData.template_a_header_color || null,
          brandingData.template_a_accent_color || null,
          brandingData.template_a_button_color || null,
          brandingData.template_b_header_color || null,
          brandingData.template_b_accent_color || null,
          brandingData.template_b_button_color || null,
          brandingData.font_family || null,
          brandingData.font_size || null,
          brandingData.border_radius || null,
          brandingData.email_width || null,
          brandingData.logo_position || null,
          brandingData.logo_size || null,
          brandingData.header_style || null,
          brandingData.button_style || null,
          brandingData.template_layout || null,
          brandingData.custom_css || null,
          tenantId
        ]
      );
    } else {
      // Insert new record
      await db.execute(
        `INSERT INTO tenant_email_branding 
         (tenant_id, selected_customer_template, restaurant_logo_url, restaurant_name, restaurant_tagline,
          social_media_facebook, social_media_instagram, social_media_twitter, custom_footer_text, is_active,
          primary_color, secondary_color, accent_color, text_color, background_color,
          header_background_color, footer_background_color, button_color, button_text_color,
          border_color, template_a_header_color, template_a_accent_color, template_a_button_color,
          template_b_header_color, template_b_accent_color, template_b_button_color,
          font_family, font_size, border_radius, email_width, logo_position,
          logo_size, header_style, button_style, template_layout, custom_css) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId,
          brandingData.selected_customer_template,
          brandingData.restaurant_logo_url || null,
          brandingData.restaurant_name || null,
          brandingData.restaurant_tagline || null,
          brandingData.social_media_facebook || null,
          brandingData.social_media_instagram || null,
          brandingData.social_media_twitter || null,
          brandingData.custom_footer_text || null,
          brandingData.is_active,
          brandingData.primary_color || null,
          brandingData.secondary_color || null,
          brandingData.accent_color || null,
          brandingData.text_color || null,
          brandingData.background_color || null,
          brandingData.header_background_color || null,
          brandingData.footer_background_color || null,
          brandingData.button_color || null,
          brandingData.button_text_color || null,
          brandingData.border_color || null,
          brandingData.template_a_header_color || null,
          brandingData.template_a_accent_color || null,
          brandingData.template_a_button_color || null,
          brandingData.template_b_header_color || null,
          brandingData.template_b_accent_color || null,
          brandingData.template_b_button_color || null,
          brandingData.font_family || null,
          brandingData.font_size || null,
          brandingData.border_radius || null,
          brandingData.email_width || null,
          brandingData.logo_position || null,
          brandingData.logo_size || null,
          brandingData.header_style || null,
          brandingData.button_style || null,
          brandingData.template_layout || null,
          brandingData.custom_css || null
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email branding settings saved successfully'
    });

  } catch (error) {
    console.error('Error saving email branding:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save email branding settings' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  // PUT method uses same logic as POST for upsert behavior
  return POST(request, { params });
}
