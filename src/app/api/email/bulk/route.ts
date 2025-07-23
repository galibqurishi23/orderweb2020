import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/universal-email-service';

// POST /api/email/bulk - Send bulk emails
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emails, context } = body;

    // Validate required fields
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Emails array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate each email object
    for (const email of emails) {
      if (!email.to || !email.subject || !email.html) {
        return NextResponse.json(
          { success: false, error: 'Each email must have to, subject, and html fields' },
          { status: 400 }
        );
      }
    }

    // Send bulk emails
    const result = await emailService.sendBulkEmails(emails, context);

    return NextResponse.json({ 
      success: true, 
      message: `Bulk email completed: ${result.sent} sent, ${result.failed} failed`,
      sent: result.sent,
      failed: result.failed
    });
  } catch (error) {
    console.error('Bulk email API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
