import { NextRequest, NextResponse } from 'next/server';
import { LicenseReminderService } from '@/lib/license-reminder-service';
import { logger } from '@/lib/logger';

// This API route should be called by a cron job or scheduled task
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a valid source (basic security)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const reminderService = new LicenseReminderService();
    
    // Check and send due reminders
    const result = await reminderService.checkAndSendReminders();
    
    // Clean up old reminders
    await reminderService.cleanupOldReminders();
    
    logger.info('License reminder check completed', result);
    
    return NextResponse.json({
      success: true,
      message: 'Reminder check completed successfully',
      result
    });

  } catch (error) {
    logger.error('License reminder check failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering from admin interface
export async function POST(request: NextRequest) {
  try {
    const reminderService = new LicenseReminderService();
    
    // Check and send due reminders
    const result = await reminderService.checkAndSendReminders();
    
    return NextResponse.json({
      success: true,
      message: 'Reminders sent successfully',
      result
    });

  } catch (error) {
    logger.error('Manual reminder check failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
