'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ShoppingBag, Printer, Eye, CheckCircle, Search } from 'lucide-react';
import { useData } from '@/context/DataContext';
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
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrdersPage() {
  const { orders, updateOrderPrintStatus, restaurantSettings } = useData();
  const [searchQuery, setSearchQuery] = useState('');
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="flex items-center gap-4">
                    <ShoppingBag className="w-8 h-8" />
                    <span className="text-2xl font-bold">Order Management</span>
                </CardTitle>
                <CardDescription>
                    View and manage all incoming and ongoing orders.
                </CardDescription>
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
        </CardHeader>
      </Card>
      
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
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
                      <TableCell className="font-medium">{order.id}</TableCell>
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
                      <TableCell className="text-right font-medium">{currencySymbol}{order.total.toFixed(2)}</TableCell>
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
                        <TableCell colSpan={8} className="h-24 text-center">
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
                            <DialogTitle>Order Details: {selectedOrder.id}</DialogTitle>
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
                                                {item.selectedAddons.length > 0 && <div className="text-xs text-muted-foreground">+ {item.selectedAddons.map(addon => `${addon.name} (${currencySymbol}${addon.price.toFixed(2)})`).join(', ')}</div>}
                                                {item.specialInstructions && <div className="text-xs text-muted-foreground italic">Note: {item.specialInstructions}</div>}
                                            </div>
                                            <div className="font-semibold">
                                                {currencySymbol}{((item.menuItem.price + item.selectedAddons.reduce((sum, addon) => sum + addon.price, 0)) * item.quantity).toFixed(2)}
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
                                    <div className="flex justify-between"><span>Subtotal</span><span>{currencySymbol}{selectedOrder.subtotal.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span>Delivery Fee</span><span>{currencySymbol}{selectedOrder.deliveryFee.toFixed(2)}</span></div>
                                    {selectedOrder.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount ({selectedOrder.voucherCode})</span><span>-{currencySymbol}{selectedOrder.discount.toFixed(2)}</span></div>}
                                    <div className="flex justify-between"><span>Tax</span><span>{currencySymbol}{selectedOrder.tax.toFixed(2)}</span></div>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between font-bold text-base"><span>Total</span><span>{currencySymbol}{selectedOrder.total.toFixed(2)}</span></div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    <DialogFooter className="pt-4 border-t">
                        <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Print</Button>
                        <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
                    </DialogFooter>
                  </>
              )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
