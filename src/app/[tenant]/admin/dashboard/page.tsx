'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, 
  Banknote, 
  Clock, 
  Users,
  AlertCircle,
  Loader2,
  TrendingUp,
  BookText,
  Settings,
  CalendarCheck,
  Tag
} from "lucide-react";
import { useTenant } from '@/context/TenantContext';
import type { TenantStats, Order } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function TenantAdminDashboard() {
  const { tenantData, isLoading: isTenantLoading, error: tenantError } = useTenant();
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!tenantData) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch stats
      const statsResponse = await fetch(`/api/tenant/stats?tenantId=${tenantData.id}`);
      const statsResult = await statsResponse.json();
      if (!statsResult.success) {
        throw new Error(statsResult.error || 'Failed to load statistics');
      }
      setStats(statsResult.data);

      // Fetch recent orders
      const ordersResponse = await fetch(`/api/tenant/orders?tenantId=${tenantData.id}`);
      const ordersResult = await ordersResponse.json();
      if (!ordersResult.success) {
        throw new Error(ordersResult.error || 'Failed to load recent orders');
      }
      setRecentOrders(ordersResult.data);

    } catch (err: any) {
      setError(`Failed to load dashboard data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [tenantData]);
  
  // Check authentication first
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check-admin');
        const data = await response.json();
        
        if (data.authenticated) {
          setIsAuthenticated(true);
        } else {
          // Not authenticated, redirect to login
          const tenantSlug = window.location.pathname.split('/')[1];
          window.location.href = `/${tenantSlug}/admin`;
        }
      } catch (error) {
        // Not authenticated, redirect to login
        const tenantSlug = window.location.pathname.split('/')[1];
        window.location.href = `/${tenantSlug}/admin`;
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch data if authenticated
  useEffect(() => {
    if (isAuthenticated && tenantData) {
      fetchDashboardData();
    }
  }, [isAuthenticated, tenantData, fetchDashboardData]);

  if (authLoading || isTenantLoading) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="h-12 w-12 text-primary mb-4 animate-spin" />
              <h3 className="text-lg font-semibold mb-2">
                {authLoading ? 'Verifying Access...' : 'Loading Dashboard'}
              </h3>
              <p className="text-muted-foreground">
                {authLoading ? 'Checking authentication...' : 'Fetching restaurant data...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tenantError || !tenantData) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Restaurant Not Found</h3>
              <p className="text-muted-foreground mb-4">
                {tenantError || 'Unable to load restaurant information.'}
              </p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <p className="mb-2 text-xs text-slate-500">Tenant ID: {tenantData.id}</p>
              <p className="mb-4 text-xs text-slate-500">Tenant Slug: {tenantData.slug}</p>
              <div className="flex gap-3">
                <Button onClick={() => window.location.reload()} className="mt-2">
                  Reload Page
                </Button>
                <Button onClick={fetchDashboardData} variant="outline" className="mt-2">
                  Retry Loading Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (amount: number | string | undefined) => {
    const numAmount = parseFloat(amount?.toString() || '0') || 0;
    // This should ideally use the tenant's currency setting
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(numAmount);
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Welcome back! Here's what's happening at <span className="font-semibold">{tenantData.name}</span> today.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href={`/${tenantData.slug}`} target="_blank">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <span>🌐</span>
              <span>View Store</span>
            </Button>
          </Link>
          <Link href={`/${tenantData.slug}/admin/settings`}>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Revenue</CardTitle>
            <div className="p-2 bg-blue-500 rounded-lg">
              <Banknote className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {loading ? <Skeleton className="h-8 w-32" /> : formatCurrency(stats?.totalRevenue ?? 0)}
            </div>
            <p className="text-xs text-blue-600 mt-1">Based on completed orders</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Orders</CardTitle>
            <div className="p-2 bg-green-500 rounded-lg">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">
              {loading ? <Skeleton className="h-8 w-16" /> : `${stats?.totalOrders ?? 0}`}
            </div>
            <p className="text-xs text-green-600 mt-1">All-time order count</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Advance Orders</CardTitle>
            <div className="p-2 bg-purple-500 rounded-lg">
              <CalendarCheck className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">
              {loading ? <Skeleton className="h-8 w-16" /> : `${stats?.advanceOrders ?? 0}`}
            </div>
            <p className="text-xs text-purple-600 mt-1">Scheduled orders</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Total Customers</CardTitle>
            <div className="p-2 bg-orange-500 rounded-lg">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">
              {loading ? <Skeleton className="h-8 w-16" /> : `${stats?.totalCustomers ?? 0}`}
            </div>
            <p className="text-xs text-orange-600 mt-1">Unique customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Recent Orders</CardTitle>
                <CardDescription>Latest customer orders and their status</CardDescription>
              </div>
              <Link href={`/${tenantData.slug}/admin/orders`}>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center p-3 rounded-lg border">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="ml-4 space-y-1 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500">No orders yet</p>
                <p className="text-sm text-slate-400 mt-1">Orders will appear here once customers start placing them</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.slice(0, 6).map((order) => (
                  <div key={order.id} className="flex items-center p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {(order.customerName || 'G').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="font-medium text-slate-900">
                        {order.customerName || 'Guest Customer'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {order.customerEmail || 'No email provided'}
                      </p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(order.total)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={`capitalize ${getOrderStatusColor(order.status)}`}>
                      {order.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
            <CardDescription>Manage your restaurant efficiently</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href={`/${tenantData.slug}/admin/menu`}>
              <Button className="w-full justify-start h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                <BookText className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Manage Menu</p>
                  <p className="text-xs opacity-90">Add items, categories & pricing</p>
                </div>
              </Button>
            </Link>
            <Link href={`/${tenantData.slug}/admin/orders`}>
              <Button variant="outline" className="w-full justify-start h-12">
                <ShoppingCart className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">View All Orders</p>
                  <p className="text-xs text-slate-500">Track & update order status</p>
                </div>
              </Button>
            </Link>
            <Link href={`/${tenantData.slug}/admin/vouchers`}>
              <Button variant="outline" className="w-full justify-start h-12">
                <Tag className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Manage Vouchers</p>
                  <p className="text-xs text-slate-500">Create discount codes</p>
                </div>
              </Button>
            </Link>
            <Link href={`/${tenantData.slug}/admin/settings`}>
              <Button variant="outline" className="w-full justify-start h-12">
                <Settings className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Restaurant Settings</p>
                  <p className="text-xs text-slate-500">Configure your restaurant</p>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
