'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, ShoppingBag, Clock, Star, PoundSterling, Calendar } from 'lucide-react';
import { useData } from '@/context/DataContext';
import type { OrderStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { isToday, format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const StatCard = ({
    title,
    value,
    icon,
    trend,
    color,
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    color: string;
  }) => (
    <Card className="hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <div className={`p-3 rounded-2xl ${color} shadow-lg`}>
                {icon}
            </div>
        </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {trend && (
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="w-4 h-4 mr-1" />
              {trend}
            </p>
          )}
      </CardContent>
    </Card>
  );

export default function Dashboard() {
    const { orders, restaurantSettings } = useData();
    const [lastUpdated, setLastUpdated] = useState('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        setLastUpdated(new Date().toLocaleString());
    }, []);

    const currencySymbol = useMemo(() => {
        if (restaurantSettings.currency === 'USD') return '$';
        if (restaurantSettings.currency === 'EUR') return '€';
        return '£';
    }, [restaurantSettings.currency]);

    const todayOrders = useMemo(() => orders.filter(order => isToday(order.createdAt)), [orders]);
    
    const stats = {
        todaySales: todayOrders.reduce((sum, order) => sum + order.total, 0),
        todayOrders: todayOrders.length,
        pendingOrders: orders.filter(order => order.status === 'pending').length,
        advanceOrders: orders.filter(order => order.isAdvanceOrder).length,
        revenue: { weekly: [] }, // Empty revenue data for now
    };
    
    const recentOrders = [...orders]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 4);

    const getStatusBadgeVariant = (status: OrderStatus): "default" | "secondary" | "destructive" | "outline" | "success" => {
        switch (status) {
            case 'pending': return 'secondary';
            case 'confirmed': return 'default';
            case 'preparing': return 'default';
            case 'ready': return 'outline';
            case 'delivered': return 'success';
            case 'cancelled': return 'destructive';
            default: return 'secondary';
        }
    };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-800 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="text-sm text-muted-foreground bg-card px-4 py-2 rounded-lg shadow-md border">
          Last updated: {isClient ? lastUpdated : <Skeleton className="h-4 w-48" />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Sales"
          value={`${currencySymbol}${stats.todaySales.toFixed(2)}`}
          icon={<PoundSterling className="w-7 h-7 text-white" />}
          trend="+12.5% from yesterday"
          color="bg-gradient-to-br from-blue-600 to-blue-700"
        />
        <StatCard
          title="Orders Today"
          value={stats.todayOrders}
          icon={<ShoppingBag className="w-7 h-7 text-white" />}
          trend="+8.2% from yesterday"
          color="bg-gradient-to-br from-sky-500 to-sky-600"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={<Clock className="w-7 h-7 text-white" />}
          color="bg-gradient-to-br from-indigo-500 to-indigo-600"
        />
        <StatCard
          title="Advance Orders"
          value={stats.advanceOrders}
          icon={<Calendar className="w-7 h-7 text-white" />}
          color="bg-gradient-to-br from-cyan-500 to-cyan-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
                 <CardTitle className="text-2xl font-semibold">Weekly Revenue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
                {stats.revenue.weekly.map((amount: number, index: number) => {
                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                const maxAmount = Math.max(...stats.revenue.weekly);
                const width = (amount / maxAmount) * 100;
                
                return (
                    <div key={index} className="flex items-center space-x-4">
                        <span className="w-10 text-sm font-medium text-muted-foreground">{days[index]}</span>
                        <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                            <Progress value={width} className="h-6" />
                            <div className="absolute inset-0 flex items-center justify-end pr-3">
                                <span className="text-xs text-primary-foreground font-semibold">
                                    {currencySymbol}{(amount / 1000).toFixed(1)}k
                                </span>
                            </div>
                        </div>
                    </div>
                );
                })}
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted transition-colors">
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-semibold">{order.id} - {order.customerName}</p>
                    {order.isAdvanceOrder && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        Advance
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground h-5">
                    {isClient ? format(order.createdAt, 'HH:mm') : <Skeleton className="h-4 w-12" />}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{currencySymbol}{order.total.toFixed(2)}</p>
                  <Badge variant={getStatusBadgeVariant(order.status)} className="font-semibold capitalize">
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
