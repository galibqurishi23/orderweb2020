import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const tenantId = headersList.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const [rows] = await db.execute(`
      SELECT id, order_id, email_type, recipient_email, subject, status, sent_at, error_message, created_at
      FROM email_logs
      WHERE tenant_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `, [tenantId]);

    return NextResponse.json(rows);

  } catch (error) {
    console.error('Error fetching email logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
