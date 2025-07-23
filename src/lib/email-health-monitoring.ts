import pool from './db';
import { tenantEmailService } from './tenant-email-service';

interface HealthCheckResult {
  tenant_id: string;
  tenant_name: string;
  smtp_status: 'healthy' | 'degraded' | 'failing';
  response_time: number;
  last_failure: Date | null;
  failure_count: number;
  email_queue_size: number;
  recent_success_rate: number;
}

interface AlertRule {
  id: string;
  name: string;
  condition: (result: HealthCheckResult) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: (result: HealthCheckResult) => string;
  cooldown_minutes: number;
}

class EmailHealthMonitoringService {
  private alertRules: AlertRule[] = [
    {
      id: 'smtp_failure',
      name: 'SMTP Connection Failure',
      condition: (result) => result.smtp_status === 'failing',
      severity: 'critical',
      message: (result) => `SMTP service for ${result.tenant_name} is failing. Immediate attention required.`,
      cooldown_minutes: 30
    },
    {
      id: 'high_failure_rate',
      name: 'High Email Failure Rate',
      condition: (result) => result.recent_success_rate < 80,
      severity: 'high',
      message: (result) => `Email success rate for ${result.tenant_name} has dropped to ${result.recent_success_rate.toFixed(1)}%`,
      cooldown_minutes: 60
    },
    {
      id: 'queue_backup',
      name: 'Email Queue Backup',
      condition: (result) => result.email_queue_size > 100,
      severity: 'medium',
      message: (result) => `Email queue for ${result.tenant_name} has ${result.email_queue_size} pending emails`,
      cooldown_minutes: 120
    },
    {
      id: 'slow_response',
      name: 'Slow SMTP Response',
      condition: (result) => result.response_time > 5000,
      severity: 'medium',
      message: (result) => `SMTP response time for ${result.tenant_name} is ${result.response_time}ms (above 5s threshold)`,
      cooldown_minutes: 60
    },
    {
      id: 'degraded_service',
      name: 'Degraded SMTP Service',
      condition: (result) => result.smtp_status === 'degraded',
      severity: 'medium',
      message: (result) => `SMTP service for ${result.tenant_name} is experiencing issues`,
      cooldown_minutes: 60
    }
  ];

  /**
   * Run comprehensive health checks for all tenants
   */
  async runHealthChecks(): Promise<HealthCheckResult[]> {
    try {
      console.log('🔍 Starting email health checks...');
      
      // Get all active tenants with email settings
      const [tenants] = await pool.execute(`
        SELECT 
          t.id,
          t.name,
          t.business_name,
          tes.smtp_host,
          tes.smtp_port,
          tes.smtp_username,
          tes.smtp_password,
          tes.from_email,
          tes.from_name,
          tes.is_ssl,
          tes.is_active,
          tes.failure_count,
          tes.last_test_success
        FROM tenants t
        LEFT JOIN tenant_email_settings tes ON t.id = tes.tenant_id
        WHERE t.is_active = TRUE
      `) as [any[], any];

      const healthResults: HealthCheckResult[] = [];

      for (const tenant of tenants) {
        try {
          const healthResult = await this.checkTenantHealth(tenant);
          healthResults.push(healthResult);
          
          // Check alerts for this tenant
          await this.checkAlerts(healthResult);
        } catch (error) {
          console.error(`Error checking health for tenant ${tenant.id}:`, error);
          
          // Create a failed health result
          healthResults.push({
            tenant_id: tenant.id,
            tenant_name: tenant.name || tenant.business_name,
            smtp_status: 'failing',
            response_time: 0,
            last_failure: new Date(),
            failure_count: (tenant.failure_count || 0) + 1,
            email_queue_size: 0,
            recent_success_rate: 0
          });
        }
      }

      console.log(`✅ Health checks completed for ${healthResults.length} tenants`);
      return healthResults;

    } catch (error) {
      console.error('Error running health checks:', error);
      throw error;
    }
  }

  /**
   * Check health for a specific tenant
   */
  private async checkTenantHealth(tenant: any): Promise<HealthCheckResult> {
    const tenantId = tenant.id;
    const tenantName = tenant.name || tenant.business_name;

    // Test SMTP connection if settings exist
    let smtpStatus: 'healthy' | 'degraded' | 'failing' = 'failing';
    let responseTime = 0;

    if (tenant.smtp_host && tenant.is_active) {
      const startTime = Date.now();
      try {
        const testResult = await tenantEmailService.testTenantSMTP({
          id: tenant.id,
          tenant_id: tenantId,
          smtp_host: tenant.smtp_host,
          smtp_port: tenant.smtp_port,
          smtp_username: tenant.smtp_username,
          smtp_password: tenant.smtp_password,
          from_email: tenant.from_email,
          from_name: tenant.from_name,
          is_ssl: tenant.is_ssl,
          is_active: tenant.is_active,
          failure_count: tenant.failure_count || 0
        });

        responseTime = Date.now() - startTime;
        
        if (testResult.success) {
          smtpStatus = responseTime > 3000 ? 'degraded' : 'healthy';
          
          // Update last successful test
          await pool.execute(
            'UPDATE tenant_email_settings SET last_test_success = NOW(), failure_count = 0 WHERE tenant_id = ?',
            [tenantId]
          );
        } else {
          smtpStatus = 'failing';
          
          // Increment failure count
          await pool.execute(
            'UPDATE tenant_email_settings SET failure_count = failure_count + 1 WHERE tenant_id = ?',
            [tenantId]
          );
        }
      } catch (error) {
        console.error(`SMTP test failed for tenant ${tenantId}:`, error);
        smtpStatus = 'failing';
        responseTime = Date.now() - startTime;
      }
    }

    // Get email queue size
    const [queueSize] = await pool.execute(
      'SELECT COUNT(*) as size FROM email_queue WHERE tenant_id = ? AND status IN ("pending", "retry")',
      [tenantId]
    ) as [any[], any];

    // Get recent success rate (last 24 hours)
    const [successRate] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as successful
      FROM email_queue 
      WHERE tenant_id = ? 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `, [tenantId]) as [any[], any];

    const recentSuccessRate = successRate[0].total > 0 
      ? (successRate[0].successful / successRate[0].total) * 100 
      : 100;

    // Get last failure
    const [lastFailure] = await pool.execute(
      'SELECT failure_time FROM smtp_failure_logs WHERE tenant_id = ? ORDER BY failure_time DESC LIMIT 1',
      [tenantId]
    ) as [any[], any];

    return {
      tenant_id: tenantId,
      tenant_name: tenantName,
      smtp_status: smtpStatus,
      response_time: responseTime,
      last_failure: lastFailure[0]?.failure_time || null,
      failure_count: tenant.failure_count || 0,
      email_queue_size: queueSize[0].size,
      recent_success_rate: recentSuccessRate
    };
  }

  /**
   * Check alert rules against health result
   */
  private async checkAlerts(healthResult: HealthCheckResult): Promise<void> {
    for (const rule of this.alertRules) {
      if (rule.condition(healthResult)) {
        // Check if we're still in cooldown period
        const isInCooldown = await this.isAlertInCooldown(rule.id, healthResult.tenant_id);
        
        if (!isInCooldown) {
          await this.createAlert(rule, healthResult);
        }
      }
    }
  }

  /**
   * Check if alert is in cooldown period
   */
  private async isAlertInCooldown(ruleId: string, tenantId: string): Promise<boolean> {
    const [recent] = await pool.execute(`
      SELECT created_at 
      FROM super_admin_notifications 
      WHERE tenant_id = ? 
        AND message LIKE ? 
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
      ORDER BY created_at DESC 
      LIMIT 1
    `, [tenantId, `%${ruleId}%`, this.alertRules.find(r => r.id === ruleId)?.cooldown_minutes || 60]) as [any[], any];

    return recent.length > 0;
  }

  /**
   * Create alert notification
   */
  private async createAlert(rule: AlertRule, healthResult: HealthCheckResult): Promise<void> {
    try {
      const message = rule.message(healthResult);
      
      await pool.execute(`
        INSERT INTO super_admin_notifications 
        (type, tenant_id, title, message, severity, action_required, action_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        'email_health',
        healthResult.tenant_id,
        rule.name,
        message,
        rule.severity,
        rule.severity === 'critical' || rule.severity === 'high',
        `/super-admin/restaurants/${healthResult.tenant_id}/email-settings`
      ]);

      console.log(`🚨 Alert created: ${rule.name} for tenant ${healthResult.tenant_name}`);
      
      // If critical, also log to SMTP failure logs
      if (rule.severity === 'critical') {
        await pool.execute(`
          INSERT INTO smtp_failure_logs 
          (tenant_id, email_type, error_message, notified_super_admin)
          VALUES (?, ?, ?, ?)
        `, [
          healthResult.tenant_id,
          'restaurant_notification',
          message,
          true
        ]);
      }

    } catch (error) {
      console.error('Error creating alert:', error);
    }
  }

  /**
   * Get health summary for dashboard
   */
  async getHealthSummary(): Promise<{
    total_tenants: number;
    healthy: number;
    degraded: number;
    failing: number;
    critical_alerts: number;
    pending_emails: number;
  }> {
    try {
      // Get tenant SMTP status summary
      const [statusSummary] = await pool.execute(`
        SELECT 
          COUNT(*) as total_tenants,
          COUNT(CASE WHEN tes.is_active = TRUE AND tes.failure_count = 0 THEN 1 END) as healthy,
          COUNT(CASE WHEN tes.is_active = TRUE AND tes.failure_count BETWEEN 1 AND 3 THEN 1 END) as degraded,
          COUNT(CASE WHEN tes.is_active = FALSE OR tes.failure_count > 3 OR tes.id IS NULL THEN 1 END) as failing
        FROM tenants t
        LEFT JOIN tenant_email_settings tes ON t.id = tes.tenant_id
        WHERE t.is_active = TRUE
      `) as [any[], any];

      // Get critical alerts count
      const [criticalAlerts] = await pool.execute(`
        SELECT COUNT(*) as critical_alerts
        FROM super_admin_notifications
        WHERE severity = 'critical' AND is_read = FALSE
      `) as [any[], any];

      // Get pending emails count
      const [pendingEmails] = await pool.execute(`
        SELECT COUNT(*) as pending_emails
        FROM email_queue
        WHERE status IN ('pending', 'retry')
      `) as [any[], any];

      return {
        total_tenants: statusSummary[0].total_tenants,
        healthy: statusSummary[0].healthy,
        degraded: statusSummary[0].degraded,
        failing: statusSummary[0].failing,
        critical_alerts: criticalAlerts[0].critical_alerts,
        pending_emails: pendingEmails[0].pending_emails
      };

    } catch (error) {
      console.error('Error getting health summary:', error);
      throw error;
    }
  }

  /**
   * Clean up old notifications and logs
   */
  async cleanup(): Promise<void> {
    try {
      // Remove notifications older than 30 days
      await pool.execute(`
        DELETE FROM super_admin_notifications 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);

      // Remove resolved SMTP failures older than 7 days
      await pool.execute(`
        DELETE FROM smtp_failure_logs 
        WHERE resolved_at IS NOT NULL 
          AND resolved_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);

      // Remove old email queue entries
      await pool.execute(`
        DELETE FROM email_queue 
        WHERE status IN ('sent', 'failed') 
          AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);

      console.log('✅ Cleanup completed');

    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

export const emailHealthMonitor = new EmailHealthMonitoringService();
