'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { getCurrencySymbol } from '@/lib/currency-utils';
import { BarChart3, Calendar as CalendarIcon, Download, Banknote, ShoppingBag, BarChart2, PieChart as PieChartIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { DateRange } from "react-day-picker";
import { addDays, format, startOfMonth, startOfWeek, endOfMonth, endOfWeek } from 'date-fns';
import { useAdmin } from '@/context/AdminContext';
import type { Order } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';


type ReportData = {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  salesByDay: { date: string; revenue: number }[];
  topItems: { name: string; quantity: number; revenue: number }[];
};

// Function to generate a report from orders within a date range
const generateReport = (orders: Order[]): ReportData => {
  if (orders.length === 0) {
    return { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, salesByDay: [], topItems: [] };
  }

  const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total?.toString() || '0') || 0), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const salesByDayMap = new Map<string, number>();
  orders.forEach(order => {
    const day = format(order.createdAt, 'yyyy-MM-dd');
    const currentRevenue = salesByDayMap.get(day) || 0;
    const orderTotal = parseFloat(order.total?.toString() || '0') || 0;
    salesByDayMap.set(day, currentRevenue + orderTotal);
  });
  const salesByDay = Array.from(salesByDayMap, ([date, revenue]) => ({ date, revenue })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());


  const itemSalesMap = new Map<string, { quantity: number; revenue: number }>();
  orders.forEach(order => {
    order.items.forEach(item => {
      const current = itemSalesMap.get(item.menuItem.name) || { quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      const itemPrice = parseFloat(item.menuItem.price?.toString() || '0') || 0;
      const addonPrice = item.selectedAddons.reduce((sum, addon) => sum + addon.totalPrice, 0);
      current.revenue += (itemPrice + addonPrice) * item.quantity;
      itemSalesMap.set(item.menuItem.name, current);
    });
  });

  const topItems = Array.from(itemSalesMap, ([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return { totalRevenue, totalOrders, averageOrderValue, salesByDay, topItems };
};


export default function ReportsPage() {
    const { tenantData } = useAdmin();
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState<DateRange | undefined>();
    const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    
    const { toast } = useToast();

    // Restaurant settings from tenantData
    const restaurantSettings = {
        currency: tenantData?.currency || 'GBP',
        timezone: tenantData?.timezone || 'Europe/London'
    };

    // Fetch orders for reports
    useEffect(() => {
        async function fetchOrders() {
            if (!tenantData?.id) return;
            
            try {
                setLoading(true);
                const response = await fetch(`/api/tenant/orders?tenantId=${tenantData.id}`);
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        setAllOrders(result.data || []);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch orders for reports:', error);
                toast({
                    title: "Error",
                    description: "Failed to load order data",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        }

        fetchOrders();
    }, [tenantData?.id, toast]);

    useEffect(() => {
        const today = new Date();
        setDate({
          from: startOfWeek(today),
          to: endOfWeek(today),
        });
    }, []);

    const currencySymbol = useMemo(() => {
        return getCurrencySymbol(restaurantSettings.currency);
    }, [restaurantSettings.currency]);

    const filteredOrders = useMemo(() => {
        if (!date?.from || !allOrders) return [];
        const toDate = date.to ? new Date(date.to) : new Date(date.from);
        toDate.setHours(23, 59, 59, 999); // Include the whole end day
        return allOrders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= date.from! && orderDate <= toDate;
        });
    }, [date, allOrders]);

    const reportData = useMemo(() => generateReport(filteredOrders), [filteredOrders]);

    const salesTrendData = useMemo(() => {
        const dataMap = new Map<string, number>();

        if (filteredOrders.length === 0) return [];
        
        if (granularity === 'daily') {
            filteredOrders.forEach(order => {
                const day = format(order.createdAt, 'yyyy-MM-dd');
                const orderTotal = parseFloat(order.total?.toString() || '0') || 0;
                dataMap.set(day, (dataMap.get(day) || 0) + orderTotal);
            });
        } else if (granularity === 'weekly') {
            filteredOrders.forEach(order => {
                const weekStart = format(startOfWeek(order.createdAt, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                const orderTotal = parseFloat(order.total?.toString() || '0') || 0;
                dataMap.set(weekStart, (dataMap.get(weekStart) || 0) + orderTotal);
            });
        } else if (granularity === 'monthly') {
            filteredOrders.forEach(order => {
                const month = format(order.createdAt, 'yyyy-MM');
                const orderTotal = parseFloat(order.total?.toString() || '0') || 0;
                dataMap.set(month, (dataMap.get(month) || 0) + orderTotal);
            });
        }
    
        return Array.from(dataMap, ([date, revenue]) => ({ date, revenue }))
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [filteredOrders, granularity]);

    const formatXAxis = (tick: string) => {
        try {
            if (granularity === 'daily') return format(new Date(tick), 'dd/MM');
            if (granularity === 'weekly') return `W/C ${format(new Date(tick), 'MMM d')}`;
            if (granularity === 'monthly') return format(new Date(tick), 'MMM yyyy');
        } catch (e) {
            return tick;
        }
        return tick;
    };

    const downloadCSV = () => {
        if (filteredOrders.length === 0) {
            toast({ variant: 'destructive', title: 'No Data', description: 'No orders to export in the selected date range.' });
            return;
        }

        const headers = ['Order ID', 'Date', 'Customer Name', 'Phone Number', 'Total Bill'];
        // VAT/Tax column removed - application is tax-free
        const csvRows = [
            headers.join(','),
            ...filteredOrders.map(order => [
                order.id,
                format(order.createdAt, 'yyyy-MM-dd HH:mm:ss'),
                `"${order.customerName.replace(/"/g, '""')}"`, // Handle commas in names
                order.customerPhone || 'N/A',
                (parseFloat(order.total?.toString() || '0') || 0).toFixed(2)
                // Tax removed - application is tax-free
            ].join(','))
        ];
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `orders-report_${format(date?.from || new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast({ title: 'CSV Downloaded', description: 'The report has been successfully downloaded.' });
    };
    
    const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                     <div>
                        <CardTitle className="flex items-center gap-4">
                            <BarChart3 className="w-8 h-8" />
                            <span className="text-2xl font-bold">Reports</span>
                        </CardTitle>
                        <CardDescription>Analyse sales, trends, and top-performing items.</CardDescription>
                    </div>
                     <div className="flex items-center gap-4">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                    "w-[300px] justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                    date.to ? (
                                        <>
                                        {format(date.from, "LLL dd, y")} -{" "}
                                        {format(date.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(date.from, "LLL dd, y")
                                    )
                                    ) : (
                                    <span>Pick a date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                             <PopoverContent className="w-auto p-0" align="end">
                                <div className="p-2 border-b">
                                    <Button variant="link" size="sm" onClick={() => { const today = new Date(); setDate({from: today, to: today})}}>Today</Button>
                                    <Button variant="link" size="sm" onClick={() => { const today = new Date(); setDate({from: addDays(today, -6), to: today})}}>Last 7 Days</Button>
                                    <Button variant="link" size="sm" onClick={() => { const today = new Date(); setDate({from: startOfMonth(today), to: endOfMonth(today)})}}>This Month</Button>
                                </div>
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                        <Button onClick={downloadCSV} variant="outline"><Download className="mr-2 h-4 w-4"/>CSV</Button>
                     </div>
                </CardHeader>
            </Card>

            <div className="space-y-8">
                <div className="grid gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{currencySymbol}{(parseFloat(reportData.totalRevenue?.toString() || '0') || 0).toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">in the selected period</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{reportData.totalOrders}</div>
                             <p className="text-xs text-muted-foreground">in the selected period</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{currencySymbol}{(parseFloat(reportData.averageOrderValue?.toString() || '0') || 0).toFixed(2)}</div>
                             <p className="text-xs text-muted-foreground">per order</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                     <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2"><BarChart2/>Sales Trend</CardTitle>
                            <Tabs value={granularity} onValueChange={(v) => setGranularity(v as any)} className="w-auto">
                                <TabsList>
                                    <TabsTrigger value="daily">Daily</TabsTrigger>
                                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </CardHeader>
                        <CardContent>
                           <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={salesTrendData}>
                                    <XAxis dataKey="date" tickFormatter={formatXAxis} />
                                    <YAxis tickFormatter={(tick) => `${currencySymbol}${parseFloat(tick?.toString() || '0') || 0}`} />
                                    <Tooltip formatter={(value) => `${currencySymbol}${(parseFloat(value?.toString() || '0') || 0).toFixed(2)}`} />
                                    <Legend />
                                    <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><PieChartIcon/>Top 5 Items by Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={reportData.topItems} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                         {reportData.topItems.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [`${currencySymbol}${(parseFloat(value?.toString() || '0') || 0).toFixed(2)}`, name]} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                 <Card>
                    <CardHeader>
                        <CardTitle>Detailed Order Report</CardTitle>
                         <CardDescription>All orders within the selected period.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Customer Name</TableHead>
                                    <TableHead>Phone Number</TableHead>
                                    <TableHead className="text-right">Total Bill</TableHead>
                                    {/* VAT/Tax column removed - application is tax-free */}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.length > 0 ? (
                                    filteredOrders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">{order.id}</TableCell>
                                            <TableCell>{format(order.createdAt, 'yyyy-MM-dd HH:mm')}</TableCell>
                                            <TableCell>{order.customerName}</TableCell>
                                            <TableCell>{order.customerPhone || 'N/A'}</TableCell>
                                            <TableCell className="text-right">{currencySymbol}{(parseFloat(order.total?.toString() || '0') || 0).toFixed(2)}</TableCell>
                                            {/* Tax column removed - application is tax-free */}
                                        </TableRow>
                                    ))
                                ) : (
                                     <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">No sales data for this period.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
