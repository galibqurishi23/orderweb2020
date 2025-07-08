'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { getCurrencySymbol } from '@/lib/currency-utils';
import { MapPin, Edit, Trash2, Plus, Save, X, Upload, Map as MapIcon, Clock, Settings, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useData } from '@/context/DataContext';
import type { DeliveryZone, OrderThrottlingSettings } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';


const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
];

const ZoneCard = ({ zone, onEdit, onDelete, currencySymbol }: { zone: DeliveryZone; onEdit: (zone: DeliveryZone) => void; onDelete: (zoneId: string) => void; currencySymbol: string; }) => (
    <Card className="flex flex-col hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
            <div className="flex items-start justify-between">
                <div>
                    <CardTitle className="flex items-center gap-3">
                        <span className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-primary" />
                        </span>
                        {zone.name}
                    </CardTitle>
                </div>
                <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(zone)}><Edit className="w-4 h-4" /></Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the <strong>{zone.name}</strong> delivery zone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(zone.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
             <div className="text-sm space-y-3">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span className="font-semibold">{zone.deliveryFee === 0 ? <span className="text-green-600">FREE</span> : `${currencySymbol}${zone.deliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Min. Order</span>
                    <span className="font-semibold">{currencySymbol}{zone.minOrder.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/>Delivery Time</span>
                    <span className="font-semibold">{zone.deliveryTime} min</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/>Collection Time</span>
                    <span className="font-semibold">{zone.collectionTime} min</span>
                </div>
            </div>
        </CardContent>
    </Card>
);

const ZoneFormDialog = ({
    isOpen,
    onClose,
    onSave,
    zone,
    currencySymbol
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (zone: DeliveryZone) => void;
    zone: DeliveryZone | null;
    currencySymbol: string;
}) => {
    const [formData, setFormData] = useState<Partial<DeliveryZone> | null>(null);
    const [postcodeInput, setPostcodeInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    React.useEffect(() => {
        if (isOpen && zone) {
            setFormData({ ...zone });
        } else if (isOpen) {
            setFormData({
                id: `zone-${Date.now()}`,
                name: '',
                type: 'postcode',
                postcodes: [],
                deliveryFee: 2.50,
                minOrder: 10.00,
                deliveryTime: 45,
                collectionTime: 20
            });
        }
    }, [isOpen, zone]);

    if (!isOpen || !formData) return null;

    const handlePostcodeAdd = () => {
        const newPostcode = postcodeInput.trim().toUpperCase();
        if (newPostcode && !formData.postcodes?.includes(newPostcode)) {
            setFormData({ ...formData, postcodes: [...(formData.postcodes || []), newPostcode] });
            setPostcodeInput('');
        }
    };
    
    const handlePostcodeRemove = (pc: string) => {
        setFormData({ ...formData, postcodes: formData.postcodes?.filter(p => p !== pc) });
    };
    
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
reader.onload = (e) => {
    const text = e.target?.result as string;
    const uploadedPostcodes = text.split(/[\s,;]+/).map(pc => pc.trim().toUpperCase()).filter(Boolean);
    const uniquePostcodes = [...new Set([...(formData.postcodes || []), ...uploadedPostcodes])];
    setFormData({ ...formData, postcodes: uniquePostcodes });
    toast({ title: "Postcodes uploaded", description: `${uploadedPostcodes.length} postcodes added.` });
};

            reader.readAsText(file);
             if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSaveClick = () => {
        if (!formData.name) {
            toast({ variant: 'destructive', title: "Validation Error", description: "Zone name is required." });
            return;
        }
        if (!formData.postcodes || formData.postcodes.length === 0) {
            toast({ variant: 'destructive', title: "Validation Error", description: "At least one postcode is required." });
            return;
        }
    
        // Ensure numeric fields are correctly parsed
        const zoneToSave: DeliveryZone = {
            ...formData,
            deliveryFee: parseFloat(String(formData.deliveryFee)) || 0,
            minOrder: parseFloat(String(formData.minOrder)) || 0,
            deliveryTime: parseInt(String(formData.deliveryTime), 10) || 0,
            collectionTime: parseInt(String(formData.collectionTime), 10) || 0,
        } as DeliveryZone;
    
        onSave(zoneToSave);
    };


    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{zone ? 'Edit Delivery Zone' : 'Add New Delivery Zone'}</DialogTitle>
                    <DialogDescription>
                        Define an area for your delivery service by creating a list of postcodes.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 py-4 overflow-y-auto pr-2 -mr-4">
                    <div className="space-y-4">
                         <div>
                            <Label htmlFor="zone-name">Zone Name</Label>
                            <Input id="zone-name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., North London" />
                        </div>
                        <div>
                            <Label htmlFor="delivery-fee">Delivery Fee ({currencySymbol})</Label>
                            <Input id="delivery-fee" type="number" value={formData.deliveryFee} onChange={e => setFormData({ ...formData, deliveryFee: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                            <Label htmlFor="min-order">Minimum Order ({currencySymbol})</Label>
                            <Input id="min-order" type="number" value={formData.minOrder} onChange={e => setFormData({ ...formData, minOrder: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                            <Label htmlFor="delivery-time">Delivery Time (minutes)</Label>
                            <Input id="delivery-time" type="number" value={formData.deliveryTime} onChange={e => setFormData({ ...formData, deliveryTime: parseInt(e.target.value) || 0 })} />
                        </div>
                         <div>
                            <Label htmlFor="collection-time">Collection Time (minutes)</Label>
                            <Input id="collection-time" type="number" value={formData.collectionTime} onChange={e => setFormData({ ...formData, collectionTime: parseInt(e.target.value) || 0 })} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <Label>Postcodes</Label>
                         <div className="p-4 border rounded-md space-y-4 min-h-[220px]">
                            <div className="flex space-x-2">
                                <Input value={postcodeInput} onChange={e => setPostcodeInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePostcodeAdd()} placeholder="Enter a postcode..."/>
                                <Button onClick={handlePostcodeAdd}>Add</Button>
                                <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4"/></Button>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.csv" className="hidden" />
                            </div>
                            <div className="space-y-2 h-36 overflow-y-auto">
                                {formData.postcodes?.length === 0 ? <p className="text-sm text-center text-muted-foreground pt-8">No postcodes added.</p> :
                                formData.postcodes?.map(pc => (
                                    <div key={pc} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                                        <span className="text-sm font-mono">{pc}</span>
                                        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => handlePostcodeRemove(pc)}><X className="w-4 h-4"/></Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="border-t pt-4">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSaveClick}><Save className="w-4 h-4 mr-2"/>Save Zone</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function DeliveryZonesPage() {
    const { deliveryZones, saveDeliveryZone, deleteDeliveryZone, restaurantSettings, saveSettings } = useData();
    const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [throttlingSettings, setThrottlingSettings] = useState<OrderThrottlingSettings>(restaurantSettings.orderThrottling);
    const { toast } = useToast();

    useEffect(() => {
        setThrottlingSettings(restaurantSettings.orderThrottling);
    }, [restaurantSettings.orderThrottling]);

    const currencySymbol = useMemo(() => {
        return getCurrencySymbol(restaurantSettings.currency);
    }, [restaurantSettings.currency]);

    const handleAddNew = () => {
        setEditingZone(null);
        setIsFormOpen(true);
    };

    const handleEdit = (zone: DeliveryZone) => {
        setEditingZone(zone);
        setIsFormOpen(true);
    };

    const handleDelete = (zoneId: string) => {
        deleteDeliveryZone(zoneId);
        toast({ title: "Zone Deleted", description: "The delivery zone has been removed." });
    };
    
    const handleSave = (zoneData: DeliveryZone) => {
        saveDeliveryZone(zoneData);
        toast({ title: zoneData.id.startsWith('zone-') ? "Zone Added" : "Zone Updated", description: `The "${zoneData.name}" zone has been saved.`});
        setIsFormOpen(false);
        setEditingZone(null);
    };

    const handleThrottlingChange = (dayKey: string, field: 'interval' | 'ordersPerInterval' | 'enabled', value: string | number | boolean) => {
        setThrottlingSettings(prev => ({
            ...prev,
            [dayKey]: {
                ...prev[dayKey],
                [field]: value
            }
        }));
    };

    const handleSaveThrottling = () => {
        saveSettings({ ...restaurantSettings, orderThrottling: throttlingSettings });
        toast({
            title: "Capacity Settings Saved",
            description: "Your order capacity settings have been updated.",
        });
    };
    
    return (
        <div className="space-y-8">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-4">
                            <MapPin className="w-8 h-8" />
                            <span className="text-2xl font-bold">Order Zones</span>
                        </CardTitle>
                        <CardDescription>
                            Manage delivery areas, fees, and postcode coverage. Found {deliveryZones.length} zones.
                        </CardDescription>
                    </div>
                    <Button onClick={handleAddNew}>
                        <Plus className="w-4 h-4 mr-2"/>
                        Add New Zone
                    </Button>
                </CardHeader>
            </Card>

            {deliveryZones.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {deliveryZones.map(zone => (
                        <ZoneCard key={zone.id} zone={zone} onEdit={handleEdit} onDelete={handleDelete} currencySymbol={currencySymbol} />
                    ))}
                </div>
            ) : (
                <Card className="text-center py-16">
                    <CardContent>
                        <MapIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-2xl font-semibold mb-2">No Delivery Zones Created</h3>
                        <p className="text-muted-foreground text-lg mb-6">Click "Add New Zone" to set up your first delivery area.</p>
                        <Button onClick={handleAddNew}>
                            <Plus className="w-4 h-4 mr-2"/>
                            Add New Zone
                        </Button>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-4">
                        <Settings className="w-8 h-8" />
                        <span className="text-2xl font-bold">Hourly Order Capacity</span>
                    </CardTitle>
                    <CardDescription>
                        Set limits on how many orders you can accept within specific time intervals for each day.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {daysOfWeek.map(day => (
                        <Card key={day.key} className={cn(!throttlingSettings[day.key].enabled && "bg-muted/50")}>
                            <CardHeader className="flex flex-row items-center justify-between p-4">
                                <h4 className="font-semibold">{day.label}</h4>
                                <div className="flex items-center space-x-2">
                                    <Label htmlFor={`enabled-${day.key}`} className="text-sm">
                                        {throttlingSettings[day.key].enabled ? 'Enabled' : 'Disabled'}
                                    </Label>
                                    <Switch
                                        id={`enabled-${day.key}`}
                                        checked={throttlingSettings[day.key].enabled}
                                        onCheckedChange={(checked) => handleThrottlingChange(day.key, 'enabled', checked)}
                                    />
                                </div>
                            </CardHeader>
                            {throttlingSettings[day.key].enabled && (
                                <CardContent className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor={`interval-${day.key}`}>Time Slot Interval (minutes)</Label>
                                        <Input
                                            id={`interval-${day.key}`}
                                            type="number"
                                            value={throttlingSettings[day.key].interval}
                                            onChange={(e) => handleThrottlingChange(day.key, 'interval', parseInt(e.target.value) || 15)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`orders-${day.key}`}>Orders per Slot</Label>
                                        <Input
                                            id={`orders-${day.key}`}
                                            type="number"
                                            value={throttlingSettings[day.key].ordersPerInterval}
                                            onChange={(e) => handleThrottlingChange(day.key, 'ordersPerInterval', parseInt(e.target.value) || 10)}
                                        />
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveThrottling}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Capacity Settings
                    </Button>
                </CardFooter>
            </Card>

            <ZoneFormDialog 
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSave}
                zone={editingZone}
                currencySymbol={currencySymbol}
            />
        </div>
    );
}