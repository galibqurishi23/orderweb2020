'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { getCurrencySymbol } from '@/lib/currency-utils';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, subMonths } from 'date-fns';
import { PlusCircle, Trash2, Home } from 'lucide-react';
import type { Address } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';


function OrderHistory() {
    const { orders, currentUser, restaurantSettings } = useData();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const currencySymbol = useMemo(() => {
        return getCurrencySymbol(restaurantSettings.currency);
    }, [restaurantSettings.currency]);

    const sixMonthsAgo = subMonths(new Date(), 6);

    const userOrders = useMemo(() => {
        return orders
            .filter(order => order.customerId === currentUser?.id)
            .filter(order => new Date(order.createdAt) >= sixMonthsAgo)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [orders, currentUser, sixMonthsAgo]);

    const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | "success" => {
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
        <Card>
            <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>Here are your orders from the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {userOrders.length > 0 ? userOrders.map(order => (
                            <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.id}</TableCell>
                                <TableCell>
                                  {isClient ? format(new Date(order.createdAt), 'PPP') : <Skeleton className="h-4 w-24" />}
                                </TableCell>
                                <TableCell>{currencySymbol}{order.total.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize">{order.status}</Badge>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">You have no recent orders.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function ProfileDetails() {
    const { currentUser, updateUserDetails } = useData();
    const [name, setName] = useState(currentUser?.name || '');
    const [phone, setPhone] = useState(currentUser?.phone || '');
    const { toast } = useToast();

    const handleSave = () => {
        updateUserDetails({ name, phone });
        toast({ title: 'Profile Updated', description: 'Your details have been saved.' });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>Manage your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={currentUser?.email || ''} disabled />
                     <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSave}>Save Changes</Button>
            </CardFooter>
        </Card>
    );
}

function AddressBook() {
    const { currentUser, addAddress, deleteAddress } = useData();
    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [postcode, setPostcode] = useState('');
    const { toast } = useToast();

    const handleAddAddress = () => {
        if (!street || !city || !postcode) {
            toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill out all address fields.' });
            return;
        }
        addAddress({ street, city, postcode, isDefault: false });
        toast({ title: 'Address Added', description: 'New address has been saved.'});
        setStreet('');
        setCity('');
        setPostcode('');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Add New Address</CardTitle>
                    <CardDescription>Save a new address to your profile.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="street">Street Address</Label>
                        <Input id="street" value={street} onChange={e => setStreet(e.target.value)} placeholder="123 Main St" />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="London" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="postcode">Postcode</Label>
                            <Input id="postcode" value={postcode} onChange={e => setPostcode(e.target.value)} placeholder="SW1A 1AA" />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleAddAddress}><PlusCircle className="mr-2 h-4 w-4" /> Add Address</Button>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Saved Addresses</CardTitle>
                    <CardDescription>Your saved delivery locations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {currentUser?.addresses.map(address => (
                        <div key={address.id} className="p-3 border rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-medium flex items-center gap-2">
                                    {address.street}
                                    {address.isDefault && <Badge variant="secondary"><Home className="w-3 h-3 mr-1"/>Default</Badge>}
                                </p>
                                <p className="text-sm text-muted-foreground">{address.city}, {address.postcode}</p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Address?</AlertDialogTitle>
                                        <AlertDialogDescription>This action cannot be undone. Are you sure you want to delete this address?</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteAddress(address.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))}
                    {currentUser?.addresses.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center pt-8">No addresses saved.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


export default function AccountPage() {
    const { isAuthenticated, currentUser } = useData();
    const router = useRouter();

    React.useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/customer');
        }
    }, [isAuthenticated, router]);

    if (!currentUser) {
        return (
            <div className="container mx-auto p-4 text-center">
                <p>Loading account details...</p>
            </div>
        );
    }
    
    return (
        <main className="container mx-auto p-4 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">My Account</h1>
                <p className="text-muted-foreground">Welcome back, {currentUser.name}. Manage your profile and view your order history here.</p>
            </div>
            
            <Tabs defaultValue="history" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="history">Order History</TabsTrigger>
                    <TabsTrigger value="profile">Profile Details</TabsTrigger>
                    <TabsTrigger value="addresses">Address Book</TabsTrigger>
                </TabsList>
                <TabsContent value="history">
                    <OrderHistory />
                </TabsContent>
                <TabsContent value="profile">
                    <ProfileDetails />
                </TabsContent>
                <TabsContent value="addresses">
                    <AddressBook />
                </TabsContent>
            </Tabs>
        </main>
    );
}
