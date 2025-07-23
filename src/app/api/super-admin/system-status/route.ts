import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // Get database status with detailed error info
    let databaseConnected = false;
    let databaseError = '';
    try {
      await db.execute('SELECT 1');
      databaseConnected = true;
    } catch (error: any) {
      databaseConnected = false;
      databaseError = error.message || 'Unknown database error';
      console.error('Database connection error:', error);
    }

    // Get restaurant counts (only if database is connected)
    let totalRestaurants = 0;
    let activeRestaurants = 0;
    if (databaseConnected) {
      try {
        const [restaurantRows] = await db.execute(`
          SELECT 
            COUNT(*) as total_restaurants,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_restaurants
          FROM tenants
        `);
        const restaurantStats = (restaurantRows as any[])[0];
        totalRestaurants = restaurantStats?.total_restaurants || 0;
        activeRestaurants = restaurantStats?.active_restaurants || 0;
      } catch (error) {
        console.error('Error fetching restaurant stats:', error);
      }
    }

    // Get system uptime (simplified - you might want to track this more accurately)
    const uptimeSeconds = process.uptime();
    const uptimeDays = Math.floor(uptimeSeconds / (24 * 60 * 60));
    const systemUptime = `${uptimeDays} days`;

    // Get last backup info (you might need to adjust this based on your backup system)
    let lastBackup = 'Never';
    try {
      const [backupRows] = await db.execute(`
        SELECT created_at FROM system_backups 
        ORDER BY created_at DESC 
        LIMIT 1
      `);
      if ((backupRows as any[]).length > 0) {
        const backup = (backupRows as any[])[0];
        lastBackup = new Date(backup.created_at).toLocaleDateString();
      }
    } catch {
      // Backup table might not exist yet
    }

    // Check email service (simplified check)
    let emailServiceActive = true;
    try {
      // You might want to implement a more robust email service check
      emailServiceActive = process.env.SMTP_HOST ? true : false;
    } catch {
      emailServiceActive = false;
    }

    return NextResponse.json({
      success: true,
      databaseConnected,
      emailServiceActive,
      totalRestaurants,
      activeRestaurants,
      systemUptime,
      lastBackup,
      databaseError: databaseConnected ? null : databaseError
    });

  } catch (error) {
    console.error('Error fetching system status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch system status'
    }, { status: 500 });
  }
}
