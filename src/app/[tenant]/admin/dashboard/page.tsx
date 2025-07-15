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
  CalendarCheck
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

  const formatCurrency = (amount: number) => {
    // This should ideally use the tenant's currency setting
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
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
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Here's what's happening at {tenantData.name} today.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href={`/${tenantData.slug}/admin/settings`} passHref>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-32" /> : formatCurrency(stats?.totalRevenue ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">Based on all-time completed orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : `+${stats?.totalOrders ?? 0}`}
            </div>
            <p className="text-xs text-muted-foreground">All-time order count</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Advance Orders</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : `+${stats?.advanceOrders ?? 0}`}
            </div>
            <p className="text-xs text-muted-foreground">Scheduled for a future date</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : `+${stats?.totalCustomers ?? 0}`}
            </div>
            <p className="text-xs text-muted-foreground">All-time unique customers</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              The 10 most recent orders placed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="ml-4 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="ml-auto h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-none">
                        {order.customerName || 'Guest'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.customerEmail || 'No email'}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      {formatCurrency(order.total)}
                    </div>
                    <Badge className={`ml-4 capitalize ${getOrderStatusColor(order.status)}`}>
                      {order.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link href={`/${tenantData.slug}/admin/menu`} passHref>
              <Button className="w-full justify-start" variant="outline">
                <BookText className="mr-2 h-4 w-4" />
                Manage Menu
              </Button>
            </Link>
            <Link href={`/${tenantData.slug}/admin/orders`} passHref>
              <Button className="w-full justify-start" variant="outline">
                <ShoppingCart className="mr-2 h-4 w-4" />
                View All Orders
              </Button>
            </Link>
            <Link href={`/${tenantData.slug}/admin/settings`} passHref>
              <Button className="w-full justify-start" variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Adjust Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
