import { NextRequest, NextResponse } from 'next/server';
import { emailHealthMonitor } from '@/lib/email-health-monitoring';

export async function GET() {
  try {
    // Run health checks for all tenants
    const healthResults = await emailHealthMonitor.runHealthChecks();
    
    // Get summary statistics
    const summary = await emailHealthMonitor.getHealthSummary();

    return NextResponse.json({
      success: true,
      data: {
        summary,
        results: healthResults,
        last_check: new Date().toISOString(),
        total_checked: healthResults.length
      }
    });

  } catch (error) {
    console.error('Error running health monitoring:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to run health monitoring' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'run_checks':
        const healthResults = await emailHealthMonitor.runHealthChecks();
        return NextResponse.json({
          success: true,
          message: 'Health checks completed',
          data: healthResults
        });

      case 'cleanup':
        await emailHealthMonitor.cleanup();
        return NextResponse.json({
          success: true,
          message: 'Cleanup completed successfully'
        });

      case 'get_summary':
        const summary = await emailHealthMonitor.getHealthSummary();
        return NextResponse.json({
          success: true,
          data: summary
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in health monitoring action:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to execute health monitoring action' },
      { status: 500 }
    );
  }
}
