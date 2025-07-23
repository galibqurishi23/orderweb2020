'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Server,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Bell,
  Users,
  BarChart3
} from 'lucide-react';

interface HealthSummary {
  total_tenants: number;
  healthy: number;
  degraded: number;
  failing: number;
  critical_alerts: number;
  pending_emails: number;
}

interface HealthResult {
  tenant_id: string;
  tenant_name: string;
  smtp_status: 'healthy' | 'degraded' | 'failing';
  response_time: number;
  last_failure: Date | null;
  failure_count: number;
  email_queue_size: number;
  recent_success_rate: number;
}

export default function HealthDashboardPage() {
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [healthResults, setHealthResults] = useState<HealthResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  useEffect(() => {
    loadHealthData();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(loadHealthData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadHealthData = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/super-admin/health-monitoring');
      const data = await response.json();

      if (data.success) {
        setSummary(data.data.summary);
        setHealthResults(data.data.results);
        setLastCheck(data.data.last_check);
      }
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const runHealthChecks = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/super-admin/health-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_checks' })
      });

      const data = await response.json();
      if (data.success) {
        await loadHealthData();
      }
    } catch (error) {
      console.error('Error running health checks:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100 border-green-200';
      case 'degraded': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'failing': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4" />;
      case 'failing': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Health Dashboard</h1>
          <p className="text-muted-foreground">Real-time monitoring of email system health</p>
          {lastCheck && (
            <p className="text-sm text-muted-foreground mt-1">
              Last check: {new Date(lastCheck).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={runHealthChecks} disabled={refreshing} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Run Checks
          </Button>
          <Button onClick={loadHealthData} disabled={refreshing} variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{summary.total_tenants}</p>
                  <p className="text-sm text-muted-foreground">Total Tenants</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{summary.healthy}</p>
                  <p className="text-sm text-muted-foreground">Healthy</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{summary.degraded}</p>
                  <p className="text-sm text-muted-foreground">Degraded</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{summary.failing}</p>
                  <p className="text-sm text-muted-foreground">Failing</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{summary.critical_alerts}</p>
                  <p className="text-sm text-muted-foreground">Critical Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{summary.pending_emails}</p>
                  <p className="text-sm text-muted-foreground">Pending Emails</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Health Status Alerts */}
      {summary && summary.critical_alerts > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            <strong>{summary.critical_alerts} critical issues</strong> require immediate attention. 
            Check the Email Monitoring page for details.
          </AlertDescription>
        </Alert>
      )}

      {summary && summary.failing > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <XCircle className="h-4 w-4" />
          <AlertDescription className="text-orange-800">
            <strong>{summary.failing} restaurants</strong> have failing email services. 
            System fallback is being used where possible.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Health Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Restaurant Health Status
          </CardTitle>
          <CardDescription>
            Detailed health status for each restaurant's email system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {healthResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No health data available. Run health checks to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {healthResults.map((result) => (
                <div 
                  key={result.tenant_id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.smtp_status)}
                      <div>
                        <h4 className="font-semibold">{result.tenant_name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Response: {result.response_time}ms</span>
                          <span>Success Rate: {result.recent_success_rate.toFixed(1)}%</span>
                          <span>Queue: {result.email_queue_size}</span>
                          <span>Failures: {result.failure_count}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(result.smtp_status)}>
                        {result.smtp_status.toUpperCase()}
                      </Badge>
                      {result.recent_success_rate < 90 && (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      {result.recent_success_rate >= 95 && (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                  
                  {result.last_failure && (
                    <div className="mt-2 text-xs text-red-600">
                      Last failure: {new Date(result.last_failure).toLocaleString()}
                    </div>
                  )}

                  {result.email_queue_size > 50 && (
                    <div className="mt-2 text-xs text-orange-600">
                      Warning: Large email queue ({result.email_queue_size} emails pending)
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Performance Overview */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Healthy Services:</span>
                  <span className="font-bold text-green-600">
                    {summary.total_tenants > 0 ? ((summary.healthy / summary.total_tenants) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Degraded Services:</span>
                  <span className="font-bold text-yellow-600">
                    {summary.total_tenants > 0 ? ((summary.degraded / summary.total_tenants) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Failing Services:</span>
                  <span className="font-bold text-red-600">
                    {summary.total_tenants > 0 ? ((summary.failing / summary.total_tenants) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alert Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Critical Alerts:</span>
                  <Badge variant="destructive">{summary.critical_alerts}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Pending Emails:</span>
                  <Badge variant="outline">{summary.pending_emails}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>System Status:</span>
                  <Badge className={summary.critical_alerts > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                    {summary.critical_alerts > 0 ? 'Issues Detected' : 'Operational'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <a href="/super-admin/email-monitoring">
                    <Bell className="w-4 h-4 mr-2" />
                    View All Notifications
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={runHealthChecks}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Health Checks
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <a href="/super-admin/settings">
                    <Server className="w-4 h-4 mr-2" />
                    System Settings
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
