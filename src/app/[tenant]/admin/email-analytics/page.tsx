'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp,
  TrendingDown,
  Mail,
  Send,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { addDays, format } from 'date-fns';

interface EmailAnalytics {
  overview: {
    total_sent: number;
    total_delivered: number;
    total_failed: number;
    delivery_rate: number;
    avg_response_time: number;
    smtp_uptime: number;
  };
  trends: {
    daily_stats: Array<{
      date: string;
      sent: number;
      delivered: number;
      failed: number;
      response_time: number;
    }>;
    hourly_stats: Array<{
      hour: number;
      sent: number;
      delivered: number;
      failed: number;
    }>;
  };
  template_performance: Array<{
    template: 'A' | 'B';
    sent: number;
    delivered: number;
    failure_rate: number;
  }>;
  smtp_health: {
    current_status: 'healthy' | 'degraded' | 'failing';
    last_test: string;
    failure_count: number;
    uptime_percentage: number;
    performance_score: number;
  };
  failure_analysis: Array<{
    error_type: string;
    count: number;
    percentage: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
}

export default function EmailAnalyticsPage() {
  const params = useParams();
  const tenantId = params.tenant as string;

  const [analytics, setAnalytics] = useState<EmailAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date()
  });
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    loadAnalytics();
  }, [tenantId, dateRange, timeRange]);

  const loadAnalytics = async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams({
        from: format(dateRange.from, 'yyyy-MM-dd'),
        to: format(dateRange.to, 'yyyy-MM-dd'),
        range: timeRange
      });

      const response = await fetch(`/api/${tenantId}/email-analytics?${params}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const exportReport = async () => {
    try {
      const params = new URLSearchParams({
        from: format(dateRange.from, 'yyyy-MM-dd'),
        to: format(dateRange.to, 'yyyy-MM-dd'),
        format: 'csv'
      });

      const response = await fetch(`/api/${tenantId}/email-analytics/export?${params}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email-analytics-${tenantId}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'failing': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Analytics</h1>
          <p className="text-muted-foreground">Monitor email performance and system health</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={loadAnalytics} disabled={refreshing} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{analytics.overview.total_sent.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{analytics.overview.delivery_rate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Delivery Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{analytics.overview.avg_response_time}ms</p>
                <p className="text-sm text-muted-foreground">Avg Response</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{analytics.overview.smtp_uptime.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">SMTP Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SMTP Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            SMTP Health Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Badge className={`${getStatusColor(analytics.smtp_health.current_status)} px-3 py-2`}>
                {analytics.smtp_health.current_status.toUpperCase()}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Current Status</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{analytics.smtp_health.performance_score}/100</p>
              <p className="text-sm text-muted-foreground">Performance Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{analytics.smtp_health.failure_count}</p>
              <p className="text-sm text-muted-foreground">Recent Failures</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Last Test</p>
              <p className="font-medium">{new Date(analytics.smtp_health.last_test).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <PieChartIcon className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="failures" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Failures
          </TabsTrigger>
          <TabsTrigger value="hourly" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Hourly
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Volume Trends</CardTitle>
              <CardDescription>Daily email sending patterns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analytics.trends.daily_stats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="sent" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="delivered" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="failed" stackId="3" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Time Trends</CardTitle>
              <CardDescription>SMTP response time performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.trends.daily_stats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="response_time" stroke="#8B5CF6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Performance Comparison</CardTitle>
              <CardDescription>Compare delivery rates between Template A and Template B</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.template_performance}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        dataKey="sent"
                        nameKey="template"
                      >
                        {analytics.template_performance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <p className="text-center text-sm text-muted-foreground mt-2">Email Volume by Template</p>
                </div>
                <div className="space-y-4">
                  {analytics.template_performance.map((template, index) => (
                    <div key={template.template} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Template {template.template}</h4>
                        <Badge variant="outline">{template.sent.toLocaleString()} sent</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Delivered:</span>
                          <span className="font-medium">{template.delivered.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Failure Rate:</span>
                          <span className={`font-medium ${template.failure_rate > 5 ? 'text-red-600' : 'text-green-600'}`}>
                            {template.failure_rate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failures" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Failure Analysis</CardTitle>
              <CardDescription>Breakdown of email delivery failures by type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.failure_analysis.map((failure, index) => (
                  <div key={failure.error_type} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTrendIcon(failure.trend)}
                      <div>
                        <h4 className="font-semibold">{failure.error_type}</h4>
                        <p className="text-sm text-muted-foreground">
                          {failure.count} occurrences ({failure.percentage.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                    <Badge variant={failure.trend === 'increasing' ? 'destructive' : 'secondary'}>
                      {failure.trend}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hourly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hourly Email Distribution</CardTitle>
              <CardDescription>Email sending patterns by hour of day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics.trends.hourly_stats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sent" fill="#3B82F6" />
                  <Bar dataKey="delivered" fill="#10B981" />
                  <Bar dataKey="failed" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
