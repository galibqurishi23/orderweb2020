import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const tenantId = searchParams.get('tenantId');

    if (!customerId || !tenantId) {
      return NextResponse.json({
        success: false,
        error: 'Customer ID and Tenant ID are required'
      }, { status: 400 });
    }

    // Get customer loyalty data
    const [loyaltyResult] = await db.execute(`
      SELECT 
        lp.points_balance,
        lp.total_points_earned,
        lp.total_points_redeemed,
        lp.tier_level,
        lps.silver_min_points,
        lps.gold_min_points,
        lps.platinum_min_points
      FROM customer_loyalty_points lp
      LEFT JOIN loyalty_program_settings lps ON lp.tenant_id = lps.tenant_id
      WHERE lp.customer_id = ? AND lp.tenant_id = ?
    `, [customerId, tenantId]);

    const loyalty = (loyaltyResult as any[])[0];
    
    if (!loyalty) {
      // Create loyalty record if it doesn't exist
      await db.execute(
        'INSERT INTO customer_loyalty_points (customer_id, tenant_id, points_balance, tier_level) VALUES (?, ?, 0, "bronze")',
        [customerId, tenantId]
      );
      
      return NextResponse.json({
        success: true,
        loyalty: {
          points_balance: 0,
          total_points_earned: 0,
          total_points_redeemed: 0,
          tier_level: 'bronze',
          next_tier_points: 500
        }
      });
    }

    // Calculate next tier points needed
    let nextTierPoints = 0;
    if (loyalty.tier_level === 'bronze') {
      nextTierPoints = loyalty.silver_min_points || 500;
    } else if (loyalty.tier_level === 'silver') {
      nextTierPoints = loyalty.gold_min_points || 1500;
    } else if (loyalty.tier_level === 'gold') {
      nextTierPoints = loyalty.platinum_min_points || 3000;
    } else {
      nextTierPoints = loyalty.total_points_earned; // Already at max tier
    }

    return NextResponse.json({
      success: true,
      loyalty: {
        ...loyalty,
        next_tier_points: nextTierPoints
      }
    });

  } catch (error) {
    console.error('Error fetching customer loyalty data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch loyalty data'
    }, { status: 500 });
  }
}
