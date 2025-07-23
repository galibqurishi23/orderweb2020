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
    const format = searchParams.get('format') || 'csv';

    // Get detailed email data for export
    const [emailData] = await db.execute(`
      SELECT 
        eq.created_at as 'Date Created',
        eq.email_type as 'Email Type',
        eq.recipient_email as 'Recipient',
        eq.subject as 'Subject',
        eq.status as 'Status',
        eq.attempts as 'Attempts',
        eq.error_message as 'Error Message',
        eq.sent_at as 'Sent At',
        CASE 
          WHEN eq.processed_at IS NOT NULL AND eq.created_at IS NOT NULL 
          THEN TIMESTAMPDIFF(MICROSECOND, eq.created_at, eq.processed_at) / 1000
          ELSE NULL 
        END as 'Response Time (ms)',
        t.name as 'Restaurant Name'
      FROM email_queue eq
      LEFT JOIN tenants t ON eq.tenant_id = t.id
      WHERE eq.tenant_id = ? 
        AND DATE(eq.created_at) BETWEEN ? AND ?
      ORDER BY eq.created_at DESC
    `, [tenantId, from, to]);

    if (format === 'csv') {
      // Convert to CSV format
      const rows = emailData as any[];
      if (rows.length === 0) {
        const csv = 'No data available for the selected date range';
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename=email-analytics-${tenantId}-${from}-to-${to}.csv`
          }
        });
      }

      const headers = Object.keys(rows[0]);
      const csvHeaders = headers.join(',');
      const csvRows = rows.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      );

      const csv = [csvHeaders, ...csvRows].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=email-analytics-${tenantId}-${from}-to-${to}.csv`
        }
      });
    }

    // Default JSON response
    return NextResponse.json({
      success: true,
      data: emailData,
      meta: {
        total: (emailData as any[]).length,
        from,
        to,
        tenant_id: tenantId
      }
    });

  } catch (error) {
    console.error('Error exporting email analytics:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to export email analytics' },
      { status: 500 }
    );
  }
}
