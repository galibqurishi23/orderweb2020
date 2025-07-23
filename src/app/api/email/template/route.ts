import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/universal-email-service';

// POST /api/email/template - Send email using template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      to,
      templateType,
      variables,
      tenantId,
      context
    } = body;

    // Validate required fields
    if (!to || !templateType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, templateType' },
        { status: 400 }
      );
    }

    // Get template with variables
    const template = await emailService.getEmailTemplate(templateType, variables || {}, tenantId);
    
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Email template not found' },
        { status: 404 }
      );
    }

    // Send email using template
    const success = await emailService.sendEmail({
      to,
      subject: template.subject,
      html: template.html
    }, context);

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Template email sent successfully' 
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send template email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Template email API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
