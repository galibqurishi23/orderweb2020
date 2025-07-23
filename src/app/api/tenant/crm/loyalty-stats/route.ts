import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });
    }

    // Get total customers
    const [totalCustomersResult] = await db.execute(
      'SELECT COUNT(*) as total FROM customers WHERE tenant_id = ?',
      [tenantId]
    );
    const totalCustomers = (totalCustomersResult as any)[0].total;

    // Get active loyalty members
    const [activeMembersResult] = await db.execute(
      'SELECT COUNT(*) as active FROM customer_loyalty_points WHERE tenant_id = ? AND points_balance > 0',
      [tenantId]
    );
    const activeMembers = (activeMembersResult as any)[0].active;

    // Get average points balance
    const [avgPointsResult] = await db.execute(
      'SELECT AVG(points_balance) as average FROM customer_loyalty_points WHERE tenant_id = ?',
      [tenantId]
    );
    const averagePoints = (avgPointsResult as any)[0].average || 0;

    // Get total points issued and redeemed
    const [pointsStatsResult] = await db.execute(`
      SELECT 
        SUM(CASE WHEN transaction_type = 'earned' OR transaction_type = 'bonus' THEN points_amount ELSE 0 END) as total_issued,
        SUM(CASE WHEN transaction_type = 'redeemed' THEN points_amount ELSE 0 END) as total_redeemed
      FROM loyalty_transactions WHERE tenant_id = ?
    `, [tenantId]);
    const pointsStats = (pointsStatsResult as any)[0];

    // Get tier distribution
    const [tierDistResult] = await db.execute(`
      SELECT 
        tier_level,
        COUNT(*) as count
      FROM customer_loyalty_points 
      WHERE tenant_id = ? 
      GROUP BY tier_level
    `, [tenantId]);

    const tierDistribution = {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0
    };

    (tierDistResult as any[]).forEach((row: any) => {
      if (row.tier_level in tierDistribution) {
        tierDistribution[row.tier_level as keyof typeof tierDistribution] = row.count;
      }
    });

    const stats = {
      totalCustomers,
      activeMembers,
      averagePoints: Number(averagePoints),
      totalPointsIssued: Number(pointsStats.total_issued) || 0,
      totalPointsRedeemed: Number(pointsStats.total_redeemed) || 0,
      tierDistribution
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching loyalty stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch loyalty statistics' },
      { status: 500 }
    );
  }
}
