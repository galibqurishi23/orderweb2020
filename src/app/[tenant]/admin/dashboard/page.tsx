'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  // License-related icons removed: Lock, Shield, CheckCircle, XCircle
} from "lucide-react";

export default function AdminDashboard({ params }: { params: Promise<{ tenant: string }> }) {
  // Unwrap params using React.use() for Next.js 15
  const resolvedParams = use(params);
  const [tenantData, setTenantData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // LICENSE-RELATED STATES REMOVED

  useEffect(() => {
    // DISABLE LICENSE CHECKING - No license validation needed
    console.log('License checking disabled for admin dashboard');
  }, [resolvedParams.tenant]);

  // LICENSE RENEWAL FUNCTION REMOVED

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check authentication using API instead of localStorage
        const authResponse = await fetch('/api/auth/check-admin');
        const authData = await authResponse.json();
        
        if (!authData.authenticated) {
          console.log('Not authenticated, redirecting to login');
          window.location.href = `/${resolvedParams.tenant}/admin`;
          return;
        }

        // Check if authenticated for the correct tenant
        if (authData.tenantSlug && authData.tenantSlug !== resolvedParams.tenant) {
          console.log('Wrong tenant, redirecting to login');
          window.location.href = `/${resolvedParams.tenant}/admin`;
          return;
        }

        // Fetch tenant data
        const tenantResponse = await fetch(`/api/tenant/info?slug=${resolvedParams.tenant}`);
        
        if (!tenantResponse.ok) {
          throw new Error('Failed to fetch tenant data');
        }
        
        const tenantResult = await tenantResponse.json();
        setTenantData(tenantResult);

        // Fetch dashboard stats
        const statsResponse = await fetch(`/api/tenant/stats?tenant=${resolvedParams.tenant}`);
        
        if (statsResponse.ok) {
          const statsResult = await statsResponse.json();
          setStats(statsResult);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        window.location.href = `/${resolvedParams.tenant}/admin`;
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.tenant]);

  // Instead of blocking access, show dashboard with license renewal notification
  // if (licenseInfo?.isExpired) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
  //       ...license blocking UI...
  //     </div>
  //   );
  // }

  if (loading || !tenantData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* LICENSE BLOCKING REMOVED - Admin dashboard always accessible */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening at {tenantData.name}.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href={`/${tenantData.slug}/admin/settings`}>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
              ) : (
                `£${stats?.todayRevenue?.toFixed(2) ?? '0.00'}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              From today's orders
            </p>
          </CardContent>
        </Card>

        {/* Today's Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded" />
              ) : (
                stats?.todayOrders ?? 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Orders placed today
            </p>
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="h-8 w-8 bg-gray-200 animate-pulse rounded" />
              ) : (
                stats?.pendingOrders ?? 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting preparation
            </p>
          </CardContent>
        </Card>

        {/* Total Customers - Always show (license checks removed) */}
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
                stats?.totalCustomers ?? 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* LICENSE RENEWAL MODAL REMOVED */}

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
                Manage Vouchers
              </Button>
            </Link>
            <Link href={`/${tenantData.slug}/admin/customers`}>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Customer Management
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Restaurant Info</CardTitle>
            <CardDescription>Your restaurant details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <Store className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{tenantData.name}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {tenantData.address && (
                <p>{tenantData.address}</p>
              )}
              {tenantData.phone && (
                <p>Tel: {tenantData.phone}</p>
              )}
            </div>
            <Link href={`/${tenantData.slug}/admin/settings`}>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Restaurant Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
