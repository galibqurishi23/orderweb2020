import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const tenantId = params.tenant;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];
    const range = searchParams.get('range') || '30d';

    // Get overview statistics
    const [overviewStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_sent,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as total_delivered,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as total_failed,
        AVG(CASE WHEN status = 'sent' AND processed_at IS NOT NULL AND created_at IS NOT NULL 
                THEN TIMESTAMPDIFF(MICROSECOND, created_at, processed_at) / 1000
                ELSE NULL END) as avg_response_time
      FROM email_queue 
      WHERE tenant_id = ? 
        AND DATE(created_at) BETWEEN ? AND ?
    `, [tenantId, from, to]);

    const overview = (overviewStats as any[])[0];
    const deliveryRate = overview.total_sent > 0 ? (overview.total_delivered / overview.total_sent) * 100 : 0;

    // Get SMTP health information
    const [smtpHealth] = await db.execute(`
      SELECT 
        is_active,
        failure_count,
        last_test_success,
        CASE 
          WHEN failure_count = 0 AND is_active = TRUE THEN 'healthy'
          WHEN failure_count <= 3 AND is_active = TRUE THEN 'degraded'
          ELSE 'failing'
        END as current_status
      FROM tenant_email_settings 
      WHERE tenant_id = ?
    `, [tenantId]);

    const smtpInfo = (smtpHealth as any[])[0] || { 
      current_status: 'failing', 
      failure_count: 0, 
      last_test_success: null 
    };

    // Calculate SMTP uptime (simplified calculation)
    const uptimePercentage = smtpInfo.failure_count === 0 ? 100 : Math.max(0, 100 - (smtpInfo.failure_count * 5));
    const performanceScore = Math.min(100, Math.max(0, 100 - (smtpInfo.failure_count * 10) - (overview.total_failed * 2)));

    // Get daily trends
    const [dailyStats] = await db.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as sent,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as delivered,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        AVG(CASE WHEN status = 'sent' AND processed_at IS NOT NULL AND created_at IS NOT NULL 
                THEN TIMESTAMPDIFF(MICROSECOND, created_at, processed_at) / 1000
                ELSE NULL END) as response_time
      FROM email_queue 
      WHERE tenant_id = ? 
        AND DATE(created_at) BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [tenantId, from, to]);

    // Get hourly distribution
    const [hourlyStats] = await db.execute(`
      SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as sent,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as delivered,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
      FROM email_queue 
      WHERE tenant_id = ? 
        AND DATE(created_at) BETWEEN ? AND ?
      GROUP BY HOUR(created_at)
      ORDER BY hour
    `, [tenantId, from, to]);

    // Get template performance (mock data for now since we need to track template usage)
    const [templateStats] = await db.execute(`
      SELECT 
        CASE WHEN email_type = 'customer_confirmation' THEN 'A' ELSE 'B' END as template,
        COUNT(*) as sent,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as delivered,
        (COUNT(CASE WHEN status = 'failed' THEN 1 END) / COUNT(*)) * 100 as failure_rate
      FROM email_queue 
      WHERE tenant_id = ? 
        AND DATE(created_at) BETWEEN ? AND ?
        AND email_type = 'customer_confirmation'
      GROUP BY email_type
    `, [tenantId, from, to]);

    // Get failure analysis
    const [failureAnalysis] = await db.execute(`
      SELECT 
        CASE 
          WHEN error_message LIKE '%SMTP%' THEN 'SMTP Connection Error'
          WHEN error_message LIKE '%timeout%' THEN 'Timeout Error'
          WHEN error_message LIKE '%authentication%' THEN 'Authentication Error'
          WHEN error_message LIKE '%DNS%' THEN 'DNS Resolution Error'
          ELSE 'Other Error'
        END as error_type,
        COUNT(*) as count
      FROM email_queue 
      WHERE tenant_id = ? 
        AND status = 'failed'
        AND DATE(created_at) BETWEEN ? AND ?
        AND error_message IS NOT NULL
      GROUP BY error_type
      ORDER BY count DESC
    `, [tenantId, from, to]);

    // Calculate percentages and trends for failure analysis
    const totalFailures = (failureAnalysis as any[]).reduce((sum, item) => sum + item.count, 0);
    const processedFailureAnalysis = (failureAnalysis as any[]).map(item => ({
      ...item,
      percentage: totalFailures > 0 ? (item.count / totalFailures) * 100 : 0,
      trend: 'stable' // Simplified - in real implementation, compare with previous period
    }));

    // Ensure we have template data
    const processedTemplateStats = (templateStats as any[]).length > 0 
      ? templateStats 
      : [
          { template: 'A', sent: overview.total_sent || 0, delivered: overview.total_delivered || 0, failure_rate: 0 }
        ];

    const analytics = {
      overview: {
        total_sent: overview.total_sent || 0,
        total_delivered: overview.total_delivered || 0,
        total_failed: overview.total_failed || 0,
        delivery_rate: deliveryRate,
        avg_response_time: Math.round(overview.avg_response_time || 0),
        smtp_uptime: uptimePercentage
      },
      trends: {
        daily_stats: (dailyStats as any[]).map(stat => ({
          ...stat,
          date: new Date(stat.date).toISOString().split('T')[0],
          response_time: Math.round(stat.response_time || 0)
        })),
        hourly_stats: hourlyStats
      },
      template_performance: processedTemplateStats,
      smtp_health: {
        current_status: smtpInfo.current_status,
        last_test: smtpInfo.last_test_success || new Date().toISOString(),
        failure_count: smtpInfo.failure_count || 0,
        uptime_percentage: uptimePercentage,
        performance_score: performanceScore
      },
      failure_analysis: processedFailureAnalysis
    };

    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Error fetching email analytics:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch email analytics' },
      { status: 500 }
    );
  }
}
