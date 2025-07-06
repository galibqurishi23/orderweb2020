'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Users,
  Eye,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { useTenant } from '@/context/TenantContext';

export default function TenantAdminDashboard({ 
  params 
}: { 
  params: { tenant: string } 
}) {
  const { tenantData } = useTenant();
  
  // Stats will be fetched from database for this specific tenant in production
  const stats = {
    todayOrders: 0,
    weekRevenue: 0,
    activeItems: 0,
    customers: 0
  };

  // Orders will be fetched from database
  const recentOrders: any[] = [];

  if (!tenantData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to {tenantData.name}</h1>
          <p className="text-gray-600">Manage your restaurant operations</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/${params.tenant}`} target="_blank">
              <Eye className="mr-2 h-4 w-4" />
              View Your Store
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/${params.tenant}/admin/menu`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Menu Item
            </Link>
          </Button>
        </div>
      </div>

      {/* Restaurant Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{tenantData.name}</h2>
              <p className="text-gray-600">Tenant ID: {params.tenant}</p>
            </div>
            <div className="flex space-x-2">
              <Badge variant={tenantData.status === 'active' ? 'default' : 'secondary'}>
                {tenantData.status}
              </Badge>
              <Badge variant="outline">
                {tenantData.plan} plan
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayOrders}</div>
            <p className="text-xs text-muted-foreground">No orders today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Week Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.weekRevenue}</div>
            <p className="text-xs text-muted-foreground">No revenue this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeItems}</div>
            <p className="text-xs text-muted-foreground">No items yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customers}</div>
            <p className="text-xs text-muted-foreground">No customers yet</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${params.tenant}/admin/orders`}>
                View All Orders
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-500">Orders will appear here once customers start placing them</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium">Order #{order.id}</p>
                    <p className="text-sm text-gray-500">{order.customer} • {order.items} items</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-medium">${order.total}</span>
                    <Badge 
                      variant={
                        order.status === 'delivered' ? 'default' : 
                        order.status === 'ready' ? 'secondary' : 
                        'outline'
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <Link href={`/${params.tenant}/admin/menu`}>
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Manage Menu</h3>
                <p className="text-sm text-gray-600">Add or edit menu items</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <Link href={`/${params.tenant}/admin/orders`}>
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">View Orders</h3>
                <p className="text-sm text-gray-600">Manage incoming orders</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <Link href={`/${params.tenant}/admin/settings`}>
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Settings</h3>
                <p className="text-sm text-gray-600">Configure restaurant</p>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
