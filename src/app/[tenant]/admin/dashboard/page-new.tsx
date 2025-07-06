'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, 
  DollarSign, 
  Clock, 
  Users,
  AlertCircle,
  Loader2,
  TrendingUp
} from "lucide-react";
import { useTenant } from '@/context/TenantContext';
import type { TenantStats } from '@/lib/types';

export default function TenantAdminDashboard() {
  const { tenantData } = useTenant();
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tenantData?.id) {
      fetchDashboardData();
    }
  }, [tenantData?.id]);

  const fetchDashboardData = async () => {
    if (!tenantData?.id) return;

    try {
      // Fetch stats
      const statsResponse = await fetch(`/api/tenant/stats?tenantId=${tenantData.id}`);
      const statsResult = await statsResponse.json();
      
      if (statsResult.success) {
        setStats(statsResult.data);
      }

      // Fetch recent orders
      const ordersResponse = await fetch(`/api/tenant/orders?tenantId=${tenantData.id}&limit=10`);
      const ordersResult = await ordersResponse.json();
      
      if (ordersResult.success) {
        setRecentOrders(ordersResult.data);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!tenantData) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Restaurant Not Found</h3>
              <p className="text-muted-foreground">Unable to load restaurant information.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground">
          Here's what's happening at {tenantData.name} today
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.todayOrders || 0} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.todayRevenue || 0)} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingOrders === 0 ? 'All caught up!' : 'Needs attention'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalOrders === 0 ? '0%' : '+100%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalOrders === 0 ? 'Getting started' : 'Month over month'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            Your latest orders and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground max-w-sm">
                Once customers start placing orders, they'll appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">#{order.id.slice(-8)}</span>
                      <Badge className={getOrderStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.customerName} • {order.orderType}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(order.total)}</div>
                    <Button variant="outline" size="sm" className="mt-2">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="flex items-center space-x-4 p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Manage Orders</h3>
              <p className="text-sm text-muted-foreground">View and process orders</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="flex items-center space-x-4 p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">Menu Management</h3>
              <p className="text-sm text-muted-foreground">Update your menu items</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="flex items-center space-x-4 p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold">Settings</h3>
              <p className="text-sm text-muted-foreground">Configure restaurant settings</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
