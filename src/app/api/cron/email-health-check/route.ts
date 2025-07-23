import { NextRequest, NextResponse } from 'next/server';
import { emailHealthMonitor } from '@/lib/email-health-monitoring';

// This endpoint can be called by a cron service (like Vercel Cron or external service)
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from an authorized source
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'default-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Starting automated health monitoring...');
    
    // Run health checks
    const healthResults = await emailHealthMonitor.runHealthChecks();
    
    // Get summary
    const summary = await emailHealthMonitor.getHealthSummary();
    
    // Run cleanup
    await emailHealthMonitor.cleanup();

    const report = {
      timestamp: new Date().toISOString(),
      summary,
      checked_tenants: healthResults.length,
      issues_found: healthResults.filter(r => r.smtp_status !== 'healthy').length,
      critical_issues: healthResults.filter(r => r.smtp_status === 'failing').length,
      degraded_services: healthResults.filter(r => r.smtp_status === 'degraded').length
    };

    console.log('✅ Automated health monitoring completed:', report);

    return NextResponse.json({
      success: true,
      message: 'Automated health monitoring completed',
      data: report
    });

  } catch (error) {
    console.error('Error in automated health monitoring:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to run automated health monitoring', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Allow POST method for flexibility
  return GET(request);
}
