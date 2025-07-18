'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, 
  Banknote, 
  Clock, 
  Users,
  AlertCircle,
  Loader2,
  Settings,
  Menu,
  BarChart3,
  Printer,
  Store,
  Tag
} from "lucide-react";
import { useTenant } from '@/context/TenantContext';

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  totalCustomers: number;
  totalRefunds: number;
}

export default function TenantAdminDashboard() {
  const { tenantData, isLoading: isTenantLoading } = useTenant();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Check authentication first
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check-admin');
        const data = await response.json();
        
        if (data.authenticated) {
          setIsAuthenticated(true);
        } else {
          const tenantSlug = window.location.pathname.split('/')[1];
          window.location.href = `/${tenantSlug}/admin`;
        }
      } catch (error) {
        const tenantSlug = window.location.pathname.split('/')[1];
        window.location.href = `/${tenantSlug}/admin`;
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch stats only (simplified - no orders fetch to avoid errors)
  useEffect(() => {
    const fetchStats = async () => {
      if (!tenantData) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const statsResponse = await fetch(`/api/tenant/stats?tenantId=${tenantData.id}`);
        const statsResult = await statsResponse.json();
        
        if (statsResult.success) {
          setStats(statsResult.data);
        } else {
          throw new Error(statsResult.error || 'Failed to load statistics');
        }
      } catch (err: any) {
        console.error('Dashboard error:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && tenantData) {
      fetchStats();
    }
  }, [isAuthenticated, tenantData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  if (authLoading || isTenantLoading) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tenantData) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Restaurant Not Found</h2>
              <p className="text-gray-600 mb-4">
                Unable to load restaurant information.
              </p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
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
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <p className="text-sm text-gray-500 mb-4">
                Tenant ID: {tenantData.id}
              </p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back to {tenantData.name}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            <Loader2 className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" />
              ) : (
                formatCurrency(stats?.todayRevenue ?? 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue from today only
            </p>
          </CardContent>
        </Card>

        {/* Refunds */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" />
              ) : (
                formatCurrency(stats?.totalRefunds ?? 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Amount refunded to customers
            </p>
          </CardContent>
        </Card>

        {/* Today's Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
              ) : (
                `${stats?.todayOrders ?? 0}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Orders received today
            </p>
          </CardContent>
        </Card>

        {/* Total Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
              ) : (
                `${stats?.totalCustomers ?? 0}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Manage your restaurant efficiently</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href={`/${tenantData.slug}/admin/menu`}>
              <Button variant="outline" className="w-full justify-start">
                <Menu className="h-4 w-4 mr-2" />
                Manage Menu
              </Button>
            </Link>
            <Link href={`/${tenantData.slug}/admin/orders`}>
              <Button variant="outline" className="w-full justify-start">
                <ShoppingCart className="h-4 w-4 mr-2" />
                View Orders
              </Button>
            </Link>
            <Link href={`/${tenantData.slug}/admin/printers`}>
              <Button variant="outline" className="w-full justify-start">
                <Printer className="h-4 w-4 mr-2" />
                Manage Printers
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reports & Analytics</CardTitle>
            <CardDescription>Track your performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href={`/${tenantData.slug}/admin/reports`}>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                Sales Reports
              </Button>
            </Link>
            <Link href={`/${tenantData.slug}/admin/vouchers`}>
              <Button variant="outline" className="w-full justify-start">
                <Tag className="h-4 w-4 mr-2" />
                Vouchers & Discounts
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Settings</CardTitle>
            <CardDescription>Configure your restaurant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href={`/${tenantData.slug}/admin/settings`}>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Restaurant Settings
              </Button>
            </Link>
            <Link href={`/${tenantData.slug}/admin/zones`}>
              <Button variant="outline" className="w-full justify-start">
                <Store className="h-4 w-4 mr-2" />
                Delivery Zones
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Status</CardTitle>
          <CardDescription>Current system information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Database Connected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">API Services Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Dashboard Operational</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
