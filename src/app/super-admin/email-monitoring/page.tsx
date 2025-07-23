'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail, 
  Bell, 
  RefreshCw,
  TrendingUp,
  BarChart3,
  Users,
  Server,
  Eye,
  Settings
} from 'lucide-react';

interface EmailNotification {
  id: number;
  type: 'smtp_failure' | 'email_health' | 'system_alert';
  tenant_id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_read: boolean;
  action_required: boolean;
  action_url?: string;
  created_at: string;
  read_at?: string;
  tenant_name?: string;
}

interface EmailStats {
  total_notifications: number;
  unread_notifications: number;
  critical_alerts: number;
  smtp_failures_today: number;
  total_emails_sent_today: number;
  system_fallback_usage: number;
  tenant_smtp_health: {
    healthy: number;
    failing: number;
    not_configured: number;
  };
}

interface SmtpFailure {
  id: number;
  tenant_id: string;
  tenant_name: string;
  order_id?: string;
  email_type: 'customer_confirmation' | 'restaurant_notification';
  failure_time: string;
  error_message: string;
  smtp_host?: string;
  used_system_fallback: boolean;
  notified_super_admin: boolean;
  resolved_at?: string;
}

export default function EmailMonitoringPage() {
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [failures, setFailures] = useState<SmtpFailure[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEmailMonitoringData();
  }, []);

  const loadEmailMonitoringData = async () => {
    setRefreshing(true);
    try {
      const [notificationsRes, statsRes, failuresRes] = await Promise.all([
        fetch('/api/super-admin/email-notifications'),
        fetch('/api/super-admin/email-stats'),
        fetch('/api/super-admin/smtp-failures')
      ]);

      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        setNotifications(notificationsData.data || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      if (failuresRes.ok) {
        const failuresData = await failuresRes.json();
        setFailures(failuresData.data || []);
      }
    } catch (error) {
      console.error('Error loading email monitoring data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch('/api/super-admin/email-notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'mark_read', 
          notificationId 
        })
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const resolveFailure = async (failureId: number) => {
    try {
      const response = await fetch('/api/super-admin/smtp-failures', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'resolve', 
          failureId 
        })
      });

      if (response.ok) {
        setFailures(prev => prev.map(f => 
          f.id === failureId ? { ...f, resolved_at: new Date().toISOString() } : f
        ));
      }
    } catch (error) {
      console.error('Error resolving failure:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'smtp_failure': return <XCircle className="w-4 h-4" />;
      case 'email_health': return <Mail className="w-4 h-4" />;
      case 'system_alert': return <AlertTriangle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
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
          <h1 className="text-3xl font-bold">Email System Monitoring</h1>
          <p className="text-muted-foreground">Monitor SMTP health, failures, and system performance</p>
        </div>
        <Button onClick={loadEmailMonitoringData} disabled={refreshing} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.unread_notifications}</p>
                  <p className="text-sm text-muted-foreground">Unread Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.critical_alerts}</p>
                  <p className="text-sm text-muted-foreground">Critical Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.total_emails_sent_today}</p>
                  <p className="text-sm text-muted-foreground">Emails Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.system_fallback_usage}%</p>
                  <p className="text-sm text-muted-foreground">System Fallback</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SMTP Health Overview */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Restaurant SMTP Health Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{stats.tenant_smtp_health.healthy}</div>
                <div className="text-sm text-green-800">Healthy Configurations</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">{stats.tenant_smtp_health.failing}</div>
                <div className="text-sm text-red-800">Failing Configurations</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-gray-600">{stats.tenant_smtp_health.not_configured}</div>
                <div className="text-sm text-gray-800">Not Configured</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
            {stats && stats.unread_notifications > 0 && (
              <Badge variant="destructive" className="ml-1">
                {stats.unread_notifications}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="failures" className="flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            SMTP Failures
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            System Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Notifications</CardTitle>
              <CardDescription>Recent alerts and notifications from the email system</CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications at this time</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`p-4 rounded-lg border ${notification.is_read ? 'bg-gray-50' : 'bg-white'} ${getSeverityColor(notification.severity)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getTypeIcon(notification.type)}
                          <div className="flex-1">
                            <h4 className="font-semibold">{notification.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(notification.created_at).toLocaleString()}
                              {notification.tenant_name && (
                                <span className="bg-gray-200 px-2 py-1 rounded">
                                  {notification.tenant_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(notification.severity)}>
                            {notification.severity}
                          </Badge>
                          {!notification.is_read && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {notification.action_required && notification.action_url && (
                        <div className="mt-3 pt-3 border-t">
                          <Button size="sm" asChild>
                            <a href={notification.action_url} target="_blank" rel="noopener noreferrer">
                              Take Action
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMTP Failures</CardTitle>
              <CardDescription>Recent SMTP failures and system fallback usage</CardDescription>
            </CardHeader>
            <CardContent>
              {failures.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No SMTP failures recorded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {failures.map((failure) => (
                    <div 
                      key={failure.id}
                      className={`p-4 rounded-lg border ${failure.resolved_at ? 'bg-green-50' : 'bg-red-50'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{failure.tenant_name}</h4>
                            <Badge variant={failure.email_type === 'customer_confirmation' ? 'default' : 'secondary'}>
                              {failure.email_type.replace('_', ' ')}
                            </Badge>
                            {failure.used_system_fallback && (
                              <Badge variant="outline">Fallback Used</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            SMTP Host: {failure.smtp_host || 'N/A'}
                          </p>
                          <p className="text-sm text-red-600 mb-2">
                            Error: {failure.error_message}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(failure.failure_time).toLocaleString()}
                            {failure.order_id && ` • Order: ${failure.order_id}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {failure.resolved_at ? (
                            <Badge className="bg-green-100 text-green-800">
                              Resolved
                            </Badge>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => resolveFailure(failure.id)}
                            >
                              Mark Resolved
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              System health monitoring shows real-time status of email infrastructure. 
              Critical issues require immediate attention.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Queue Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Pending Emails</span>
                    <Badge variant="outline">Loading...</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Rate</span>
                    <Badge variant="outline">Loading...</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate (24h)</span>
                    <Badge variant="outline">Loading...</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Average Response Time</span>
                    <Badge variant="outline">Loading...</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>System Uptime</span>
                    <Badge variant="outline">Loading...</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Error Rate</span>
                    <Badge variant="outline">Loading...</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
