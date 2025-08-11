import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: { tenant: string } }
) {
    try {
        const { tenant } = await params;
        
        // Try to get existing settings
        const [rows] = await db.query(
            'SELECT * FROM shop_settings WHERE tenant_id = ?',
            [tenant]
        ) as any[];
        
        if (rows.length > 0) {
            return NextResponse.json(rows[0]);
        } else {
            // Return default settings with color scheme
            return NextResponse.json({
                tenant_id: tenant,
                cover_image_url: null,
                display_name: null,
                primary_color: '#3b82f6',
                secondary_color: '#1e40af',
                accent_color: '#60a5fa',
                text_color: '#1f2937',
                background_color: '#f8fafc',
                card_background: '#ffffff',
                border_color: '#e5e7eb',
                color_theme: 'blue'
            });
        }
    } catch (error) {
        console.error('Error fetching shop settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch shop settings' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { tenant: string } }
) {
    try {
        const { tenant } = await params;
        
        let cover_image_url: string | null = null;
        let display_name: string | null = null;
        let primary_color: string | null = null;
        let secondary_color: string | null = null;
        let accent_color: string | null = null;
        let text_color: string | null = null;
        let background_color: string | null = null;
        let card_background: string | null = null;
        let border_color: string | null = null;
        let color_theme: string | null = null;
        
        // Check if request contains FormData (file upload)
        const contentType = request.headers.get('content-type');
        
        if (contentType?.includes('multipart/form-data')) {
            // Handle file upload
            const formData = await request.formData();
            const coverImageFile = formData.get('cover_image') as File;
            display_name = formData.get('display_name') as string;
            
            // Extract color settings from form data
            primary_color = formData.get('primary_color') as string;
            secondary_color = formData.get('secondary_color') as string;
            accent_color = formData.get('accent_color') as string;
            text_color = formData.get('text_color') as string;
            background_color = formData.get('background_color') as string;
            card_background = formData.get('card_background') as string;
            border_color = formData.get('border_color') as string;
            color_theme = formData.get('color_theme') as string;
            
            if (coverImageFile && coverImageFile.size > 0) {
                // Create uploads directory if it doesn't exist
                const fs = require('fs');
                const path = require('path');
                const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'shop-covers');
                
                if (!fs.existsSync(uploadsDir)) {
                    fs.mkdirSync(uploadsDir, { recursive: true });
                }
                
                // Generate unique filename
                const timestamp = Date.now();
                const extension = coverImageFile.name.split('.').pop();
                const filename = `${tenant}-cover-${timestamp}.${extension}`;
                const filepath = path.join(uploadsDir, filename);
                
                // Save file
                const bytes = await coverImageFile.arrayBuffer();
                const buffer = Buffer.from(bytes);
                fs.writeFileSync(filepath, buffer);
                
                // Set the URL for database
                cover_image_url = `/uploads/shop-covers/${filename}`;
            }
        } else {
            // Handle JSON request (backward compatibility)
            const body = await request.json();
            cover_image_url = body.cover_image_url;
            display_name = body.display_name;
            primary_color = body.primary_color;
            secondary_color = body.secondary_color;
            accent_color = body.accent_color;
            text_color = body.text_color;
            background_color = body.background_color;
            card_background = body.card_background;
            border_color = body.border_color;
            color_theme = body.color_theme;
        }
        
        // Check if settings exist
        const [existingRows] = await db.query(
            'SELECT id FROM shop_settings WHERE tenant_id = ?',
            [tenant]
        ) as any[];
        
        if (existingRows.length > 0) {
            // Update existing settings
            const fields = [];
            const values: any[] = [];
            
            if (cover_image_url !== null) {
                fields.push('cover_image_url = ?');
                values.push(cover_image_url);
            }
            
            if (display_name !== null) {
                fields.push('display_name = ?');
                values.push(display_name);
            }
            
            if (primary_color !== null) {
                fields.push('primary_color = ?');
                values.push(primary_color);
            }
            
            if (secondary_color !== null) {
                fields.push('secondary_color = ?');
                values.push(secondary_color);
            }
            
            if (accent_color !== null) {
                fields.push('accent_color = ?');
                values.push(accent_color);
            }
            
            if (text_color !== null) {
                fields.push('text_color = ?');
                values.push(text_color);
            }
            
            if (background_color !== null) {
                fields.push('background_color = ?');
                values.push(background_color);
            }
            
            if (card_background !== null) {
                fields.push('card_background = ?');
                values.push(card_background);
            }
            
            if (border_color !== null) {
                fields.push('border_color = ?');
                values.push(border_color);
            }
            
            if (color_theme !== null) {
                fields.push('color_theme = ?');
                values.push(color_theme);
            }
            
            if (fields.length > 0) {
                values.push(tenant);
                await db.query(
                    `UPDATE shop_settings SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = ?`,
                    values
                );
            }
        } else {
            // Create new settings
            const id = crypto.randomUUID();
            await db.query(
                `INSERT INTO shop_settings (
                    id, tenant_id, cover_image_url, display_name,
                    primary_color, secondary_color, accent_color, text_color,
                    background_color, card_background, border_color, color_theme
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id, tenant, cover_image_url, display_name,
                    primary_color || '#3b82f6',
                    secondary_color || '#1e40af', 
                    accent_color || '#60a5fa',
                    text_color || '#1f2937',
                    background_color || '#f8fafc',
                    card_background || '#ffffff',
                    border_color || '#e5e7eb',
                    color_theme || 'blue'
                ]
            );
        }
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating shop settings:', error);
        return NextResponse.json(
            { error: 'Failed to update shop settings' },
            { status: 500 }
        );
    }
}
