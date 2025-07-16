'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { getCurrencySymbol } from '@/lib/currency-utils';
import { Clock, Calendar, Printer } from 'lucide-react';
import type { Order, OrderStatus } from '@/lib/types';
import { useTenantData } from '@/context/TenantDataContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useReactToPrint } from 'react-to-print';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdvanceOrdersPage() {
  const { orders, updateOrderStatus, restaurantSettings } = useTenantData();
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const currencySymbol = useMemo(() => {
    return getCurrencySymbol(restaurantSettings.currency);
  }, [restaurantSettings.currency]);

  const advanceOrders = useMemo(() => {
    return orders.filter(order => order.orderType === 'advance');
  }, [orders]);

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'confirmed':
        return 'default';
      case 'preparing':
        return 'default';
      case 'ready':
        return 'default';
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const sortedOrders = useMemo(() => {
    return [...advanceOrders].sort((a, b) => {
      const aTime = new Date(a.scheduledTime || a.createdAt).getTime();
      const bTime = new Date(b.scheduledTime || b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [advanceOrders]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Advance Orders</h1>
        <Badge variant="outline" className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {advanceOrders.length} advance orders
        </Badge>
      </div>

      {advanceOrders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No advance orders found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Advance Orders</CardTitle>
            <CardDescription>
              Manage scheduled orders for future dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Scheduled Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{order.customerName}</span>
                          <span className="text-sm text-muted-foreground">{order.customerPhone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {isClient && order.scheduledTime ? format(order.scheduledTime, 'PPp') : 'N/A'}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {isClient && order.scheduledTime ? format(order.scheduledTime, 'EEEE') : ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize">
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {currencySymbol}{(parseFloat(String(order.total)) || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
