import { NextRequest, NextResponse } from 'next/server';
import { LicenseReminderService } from '@/lib/license-reminder-service';

export async function GET(request: NextRequest) {
  try {
    const reminderService = new LicenseReminderService();
    
    // Get expiring licenses for the next 30 days
    const expiringLicenses = await reminderService.getExpiringLicenses(30);
    
    // Get dashboard reminders (due soon)
    const dashboardReminders = await reminderService.getDashboardReminders();

    return NextResponse.json({
      success: true,
      expiringLicenses,
      dashboardReminders,
      lastCheck: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to get license reminders:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
