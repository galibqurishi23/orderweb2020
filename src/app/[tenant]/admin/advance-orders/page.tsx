'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Clock, Calendar, Eye, CheckCircle, XCircle, Printer } from 'lucide-react';
import type { Order, OrderStatus } from '@/lib/types';
import { useData } from '@/context/DataContext';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useReactToPrint } from 'react-to-print';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdvanceOrdersPage() {
  const { orders, updateOrderStatus, restaurantSettings } = useData();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const currencySymbol = useMemo(() => {
    if (restaurantSettings.currency === 'USD') return '$';
    if (restaurantSettings.currency === 'EUR') return '€';
    return '£';
  }, [restaurantSettings.currency]);

  const componentToPrintRef = useRef(null);
  const handlePrint = useReactToPrint({
    content: () => componentToPrintRef.current,
    documentTitle: `order-${selectedOrder?.id}`,
     onAfterPrint: () => toast({ title: "Print request sent" }),
  });

  const advanceOrders = orders.filter(order => order.isAdvanceOrder);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    // For now, we just close the modal if it's the selected order
    if(selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

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

  const getTimeUntilScheduled = (scheduledTime: Date) => {
    const now = new Date();
    const diff = scheduledTime.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (diff < 0) return { text: 'Overdue', overdue: true };
    if (days > 0) return { text: `${days}d ${hours}h`, overdue: false };
    if (hours > 0) return { text: `${hours}h ${minutes}m`, overdue: false };
    return { text: `${minutes}m`, overdue: false };
  };

  return (
    <div className="space-y-8">
       <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-4">
                    <Clock className="w-8 h-8" />
                    <span className="text-2xl font-bold">Advance Orders</span>
                </CardTitle>
                <CardDescription>
                    Manage scheduled orders and future bookings. Found {advanceOrders.length} scheduled orders.
                </CardDescription>
            </CardHeader>
      </Card>

      {advanceOrders.length === 0 ? (
        <Card className="text-center py-16">
            <CardContent>
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-2">No Advance Orders</h3>
                <p className="text-muted-foreground text-lg">All advance orders will appear here when customers schedule them.</p>
            </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead>Time Until</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advanceOrders.map(order => {
                    const timeUntil = order.scheduledTime ? getTimeUntilScheduled(order.scheduledTime) : { text: 'N/A', overdue: false };
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>
                            <div>{order.customerName}</div>
                            <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                        </TableCell>
                        <TableCell>
                          {isClient && order.scheduledTime ? (
                            <>
                              <div>{format(order.scheduledTime, 'PP')}</div>
                              <div className="text-xs text-muted-foreground">{format(order.scheduledTime, 'HH:mm')}</div>
                            </>
                          ) : (
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-12" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {isClient ? (
                            <Badge variant={timeUntil.overdue ? "destructive" : "secondary"}>
                              {timeUntil.text}
                            </Badge>
                          ) : (
                            <Skeleton className="h-6 w-20" />
                          )}
                        </TableCell>
                        <TableCell>
                           <Badge variant="outline" className="capitalize">{order.orderType}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {currencySymbol}{order.total.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(order.status)} className='capitalize font-semibold rounded-full'>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedOrder(order)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {order.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStatusChange(order.id, 'confirmed')}
                              title="Confirm Order"
                              className="text-primary hover:text-primary/90"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {(order.status === 'pending' || order.status === 'confirmed') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStatusChange(order.id, 'cancelled')}
                              title="Cancel Order"
                              className="text-destructive hover:text-destructive/90"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

        <Dialog open={!!selectedOrder} onOpenChange={(isOpen) => !isOpen && setSelectedOrder(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                 {selectedOrder && (
                     <>
                        <div ref={componentToPrintRef} className="flex-grow overflow-y-auto p-6">
                            <DialogHeader className="mb-6">
                                <DialogTitle className="flex items-center gap-2">
                                    <Clock className="w-6 h-6 mr-2" />
                                    Advance Order: {selectedOrder.id}
                                </DialogTitle>
                                <DialogDescription>
                                    Scheduled for: {isClient && selectedOrder.scheduledTime ? format(selectedOrder.scheduledTime, 'PPpp') : 'N/A'}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Customer</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-sm space-y-2">
                                            <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                                            <p><strong>Phone:</strong> {selectedOrder.customerPhone}</p>
                                            <p><strong>Email:</strong> {selectedOrder.customerEmail}</p>
                                            {selectedOrder.address && (
                                                <p><strong>Address:</strong> {selectedOrder.address}</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Details</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-sm space-y-2">
                                            <p className="flex justify-between"><strong>Status:</strong> <Badge variant={getStatusBadgeVariant(selectedOrder.status)} className="capitalize font-semibold rounded-full">{selectedOrder.status}</Badge></p>
                                            <p className="flex justify-between"><strong>Type:</strong> <Badge variant="outline" className="capitalize">{selectedOrder.orderType}</Badge></p>
                                            <p className="flex justify-between"><strong>Voucher:</strong> <span>{selectedOrder.voucherCode || 'N/A'}</span></p>
                                        </CardContent>
                                    </Card>
                                </div>
                                
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Order Items</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {selectedOrder.items.map(item => (
                                            <div key={item.id} className="text-sm p-3 bg-muted/50 rounded-lg">
                                                <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold">{item.quantity}x {item.menuItem.name}</p>
                                                    {item.selectedAddons.length > 0 && (
                                                    <p className="text-xs text-muted-foreground">
                                                        + {item.selectedAddons.map(addon => `${addon.name} (${currencySymbol}${addon.price.toFixed(2)})`).join(', ')}
                                                    </p>
                                                    )}
                                                    {item.specialInstructions && (
                                                    <p className="text-xs text-muted-foreground italic">Note: {item.specialInstructions}</p>
                                                    )}
                                                </div>
                                                <p className="font-semibold">
                                                    {currencySymbol}{((item.menuItem.price + item.selectedAddons.reduce((sum, addon) => sum + addon.price, 0)) * item.quantity).toFixed(2)}
                                                </p>
                                                </div>
                                            </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                                
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Payment Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm space-y-2">
                                        <div className="flex justify-between"><span>Subtotal</span><span>{currencySymbol}{selectedOrder.subtotal.toFixed(2)}</span></div>
                                        <div className="flex justify-between"><span>Delivery Fee</span><span>{currencySymbol}{selectedOrder.deliveryFee.toFixed(2)}</span></div>
                                        {selectedOrder.discount > 0 && (
                                            <div className="flex justify-between text-green-600"><span>Discount ({selectedOrder.voucherCode})</span><span>-{currencySymbol}{selectedOrder.discount.toFixed(2)}</span></div>
                                        )}
                                        <div className="flex justify-between"><span>Tax</span><span>{currencySymbol}{selectedOrder.tax.toFixed(2)}</span></div>
                                        <Separator className="my-2" />
                                        <div className="flex justify-between font-bold text-base"><span>Total</span><span>{currencySymbol}{selectedOrder.total.toFixed(2)}</span></div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                        <DialogFooter className="pt-4 border-t">
                          <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    </div>
  );
}
