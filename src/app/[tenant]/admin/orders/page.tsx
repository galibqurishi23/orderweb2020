'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { getCurrencySymbol } from '@/lib/currency-utils';
import { ShoppingBag, Printer, Eye, CheckCircle, Search, Trash2, Calendar, CreditCard, Wallet, Gift } from 'lucide-react';
import { useTenantData } from '@/context/TenantDataContext';
import type { Order, OrderStatus } from '@/lib/types';
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
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useReactToPrint } from 'react-to-print';
import { format, startOfWeek, startOfMonth, endOfWeek, endOfMonth, isWithinInterval } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function TenantOrdersPage() {
  const { orders, updateOrderPrintStatus, deleteOrder, restaurantSettings } = useTenantData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const currencySymbol = useMemo(() => {
    return getCurrencySymbol(restaurantSettings.currency);
  }, [restaurantSettings.currency]);

  const componentToPrintRef = useRef(null);
  // Temporarily change to window.print() to test if react-to-print is the issue
  const handlePrint = () => {
    window.print();
    toast({ title: "Print request sent" });
  };


  const filteredOrders = useMemo(() => {
    if (!searchQuery) {
        return orders;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return orders.filter(order =>
        order.id.toLowerCase().includes(lowercasedQuery) ||
        order.customerName.toLowerCase().includes(lowercasedQuery) ||
        (order.customerPhone && order.customerPhone.includes(lowercasedQuery)) ||
        (order.customerEmail && order.customerEmail.toLowerCase().includes(lowercasedQuery))
    );
  }, [orders, searchQuery]);

  const orderStatistics = useMemo(() => {
    if (!isClient) return { total: 0, thisWeek: 0, thisMonth: 0 };
    
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const thisWeekOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return isWithinInterval(orderDate, { start: weekStart, end: weekEnd });
    });
    
    const thisMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return isWithinInterval(orderDate, { start: monthStart, end: monthEnd });
    });
    
    return {
      total: orders.length,
      thisWeek: thisWeekOrders.length,
      thisMonth: thisMonthOrders.length
    };
  }, [orders, isClient]);

  const handlePrintStatusToggle = (orderId: string) => {
    updateOrderPrintStatus(orderId);
    const order = orders.find(o => o.id === orderId);
    if(order) {
        toast({
            title: order.printed ? "Marked as Not Printed" : "Marked as Printed",
            description: `Order ${orderId} has been updated.`,
        });
    }
  };

  const handleRefund = async (orderId: string, orderNumber: string) => {
    try {
      await deleteOrder(orderId);
      toast({
        title: "Order refunded",
        description: `Order ${orderNumber} has been refunded and removed.`,
      });
    } catch (error) {
      console.error('Refund error:', error);
      toast({
        title: "Error",
        description: "Failed to refund the order.",
        variant: "destructive",
      });
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
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">All Orders</h1>
              <p className="text-slate-600 mt-1">
                View, track and manage all customer orders in real-time
              </p>
            </div>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search by ID, name, phone..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Total Orders</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{orderStatistics.total}</p>
                </div>
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">This Week</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-1">{orderStatistics.thisWeek}</p>
                </div>
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">This Month</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900 mt-1">{orderStatistics.thisMonth}</p>
                </div>
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">All Orders</CardTitle>
          <CardDescription>View and manage all customer orders</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Print Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                       <TableCell>
                            {isClient ? (
                              <>
                                <div>{format(order.createdAt, 'PP')}</div>
                                <div className="text-xs text-muted-foreground">{format(order.createdAt, 'HH:mm')}</div>
                              </>
                            ) : (
                              <div className="space-y-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-12" />
                              </div>
                            )}
                        </TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>
                        <Badge variant={order.isAdvanceOrder ? "outline" : "secondary"} className="capitalize">
                          {order.isAdvanceOrder ? 'Advance' : 'Regular'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {order.paymentMethod === 'cash' && (
                            <>
                              <Wallet className="w-4 h-4 text-green-600" />
                              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                                Cash
                              </Badge>
                            </>
                          )}
                          {order.paymentMethod === 'card' && (
                            <>
                              <CreditCard className="w-4 h-4 text-blue-600" />
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                                Card
                              </Badge>
                            </>
                          )}
                          {order.paymentMethod === 'voucher' && (
                            <>
                              <Gift className="w-4 h-4 text-purple-600" />
                              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                                Voucher
                              </Badge>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{currencySymbol}{Number(order.total).toFixed(2)}</TableCell>
                      <TableCell>
                         <Badge variant={getStatusBadgeVariant(order.status)} className='capitalize font-semibold rounded-full'>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant={order.printed ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePrintStatusToggle(order.id)}
                        >
                          {order.printed ? <CheckCircle className="mr-2" /> : <Printer className="mr-2" />}
                          {order.printed ? 'Printed' : 'Print'}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                         <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedOrder(order)}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                          </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                            {searchQuery ? `No orders found for "${searchQuery}".` : "No orders available."}
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={(isOpen) => !isOpen && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
              {selectedOrder && (
                  <>
                    <div ref={componentToPrintRef} className="flex-grow overflow-y-auto p-6">
                        <DialogHeader className="mb-6">
                            <DialogTitle>Order Details: {selectedOrder.orderNumber}</DialogTitle>
                            <DialogDescription>
                                Placed on: {isClient && selectedOrder.createdAt ? format(selectedOrder.createdAt, 'PPpp') : '...'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader><CardTitle className="text-lg">Details</CardTitle></CardHeader>
                                    <CardContent className="text-sm space-y-2">
                                        <div className="flex justify-between"><strong>Status:</strong> <Badge variant={getStatusBadgeVariant(selectedOrder.status)} className="capitalize font-semibold rounded-full">{selectedOrder.status}</Badge></div>
                                        <div className="flex justify-between"><strong>Type:</strong> <Badge variant="outline" className="capitalize">{selectedOrder.orderType}</Badge></div>
                                        <div className="flex justify-between"><strong>Print Status:</strong> <Badge variant={selectedOrder.printed ? 'default' : 'secondary'}>{selectedOrder.printed ? 'Printed' : 'Not Printed'}</Badge></div>
                                        <div className="flex justify-between"><strong>Voucher:</strong> <span>{selectedOrder.voucherCode || 'N/A'}</span></div>
                                    </CardContent>
                                </Card>
                                <Card>
                                        <CardHeader><CardTitle className="text-lg">Customer</CardTitle></CardHeader>
                                        <CardContent className="text-sm space-y-2">
                                            <div className="flex justify-between"><strong>Name:</strong> {selectedOrder.customerName}</div>
                                            <div className="flex justify-between"><strong>Phone:</strong> {selectedOrder.customerPhone}</div>
                                            <div className="flex justify-between"><strong>Email:</strong> {selectedOrder.customerEmail}</div>
                                            {selectedOrder.address && <div className="flex justify-between"><strong>Address:</strong> {selectedOrder.address}</div>}
                                        </CardContent>
                                    </Card>
                                {/* Special Instructions Card */}
                                {selectedOrder.specialInstructions && (
                                    <Card>
                                        <CardHeader><CardTitle className="text-lg">Special Instructions</CardTitle></CardHeader>
                                        <CardContent className="text-sm">
                                            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                                <p className="text-yellow-800">{selectedOrder.specialInstructions}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                            <Card>
                                <CardHeader><CardTitle className="text-lg">Order Items</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {selectedOrder.items.map(item => (
                                        <div key={item.id} className="text-sm p-3 bg-muted/50 rounded-lg">
                                            <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-semibold">{item.quantity}x {item.menuItem.name}</div>
                                                {item.selectedAddons.length > 0 && <div className="text-xs text-muted-foreground">+ {item.selectedAddons.map(addon => `${addon.name} (${currencySymbol}${parseFloat(String(addon.price || '0')).toFixed(2)})`).join(', ')}</div>}
                                                {item.specialInstructions && <div className="text-xs text-muted-foreground italic">Note: {item.specialInstructions}</div>}
                                            </div>
                                            <div className="font-semibold">
                                                {currencySymbol}{((parseFloat(String(item.menuItem.price || '0')) + item.selectedAddons.reduce((sum, addon) => sum + parseFloat(String(addon.price || '0')), 0)) * item.quantity).toFixed(2)}
                                            </div>
                                            </div>
                                        </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="text-lg">Payment Summary</CardTitle></CardHeader>
                                <CardContent className="text-sm space-y-2">
                                    <div className="flex justify-between"><span>Subtotal</span><span>{currencySymbol}{parseFloat(String(selectedOrder.subtotal || '0')).toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span>Delivery Fee</span><span>{currencySymbol}{parseFloat(String(selectedOrder.deliveryFee || '0')).toFixed(2)}</span></div>
                                    {parseFloat(String(selectedOrder.discount || '0')) > 0 && <div className="flex justify-between text-green-600"><span>Discount ({selectedOrder.voucherCode})</span><span>-{currencySymbol}{parseFloat(String(selectedOrder.discount || '0')).toFixed(2)}</span></div>}
                                    {/* Tax removed - application is tax-free */}
                                    <Separator className="my-2" />
                                    <div className="flex justify-between font-bold text-base"><span>Total</span><span>{currencySymbol}{parseFloat(String(selectedOrder.total || '0')).toFixed(2)}</span></div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    <DialogFooter className="pt-4 border-t">
                        <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Print</Button>
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                handleRefund(selectedOrder.id, selectedOrder.orderNumber);
                                setSelectedOrder(null);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                            Refund
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
                    </DialogFooter>
                  </>
              )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
