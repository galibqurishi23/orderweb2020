'use client';

import React, { useState, useEffect } from 'react';
import { Save, Clock, Settings } from 'lucide-react';
import { useTenantData } from '@/context/TenantDataContext';
import type { RestaurantSettings, OrderThrottlingSettings } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
];

export default function OrderManagementPage() {
    const { restaurantSettings, saveSettings } = useTenantData();
    const { toast } = useToast();
    
    const [settings, setSettings] = useState<RestaurantSettings>(restaurantSettings);
    const [throttlingSettings, setThrottlingSettings] = useState<OrderThrottlingSettings>(restaurantSettings.orderThrottling);

    useEffect(() => {
        setSettings(restaurantSettings);
        setThrottlingSettings(restaurantSettings.orderThrottling);
    }, [restaurantSettings]);

    const handleSave = () => {
        saveSettings(settings);
        toast({
            title: "Settings Saved",
            description: "Order management settings have been updated.",
        });
    };

    const handleOrderTypeChange = (field: keyof RestaurantSettings['orderTypeSettings'], value: boolean) => {
        setSettings(prev => ({
            ...prev,
            orderTypeSettings: {
                ...prev.orderTypeSettings,
                [field]: value
            }
        }));
    };

    const handleDeliveryTimeChange = (field: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            deliveryTimeSettings: {
                ...prev.deliveryTimeSettings,
                [field]: value
            }
        }));
    };

    const handleCollectionTimeChange = (field: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            collectionTimeSettings: {
                ...prev.collectionTimeSettings,
                [field]: value
            }
        }));
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
        saveSettings({ ...settings, orderThrottling: throttlingSettings });
        toast({
            title: "Capacity Settings Saved",
            description: "Order capacity settings have been updated.",
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                <Clock className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Order Management</h1>
                                <p className="text-slate-600">Configure order types and settings</p>
                            </div>
                        </div>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Order Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Order Types</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <Label className="font-medium">Collection Orders</Label>
                                        <p className="text-sm text-slate-600">Customer pickup orders</p>
                                    </div>
                                    <Switch
                                        checked={settings.orderTypeSettings?.collectionEnabled ?? true}
                                        onCheckedChange={(checked) => handleOrderTypeChange('collectionEnabled', checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <Label className="font-medium">Delivery Orders</Label>
                                        <p className="text-sm text-slate-600">Home delivery service</p>
                                    </div>
                                    <Switch
                                        checked={settings.orderTypeSettings?.deliveryEnabled ?? true}
                                        onCheckedChange={(checked) => handleOrderTypeChange('deliveryEnabled', checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <Label className="font-medium">Advance Orders</Label>
                                        <p className="text-sm text-slate-600">Scheduled future orders</p>
                                    </div>
                                    <Switch
                                        checked={settings.orderTypeSettings?.advanceOrderEnabled ?? true}
                                        onCheckedChange={(checked) => handleOrderTypeChange('advanceOrderEnabled', checked)}
                                    />
                                </div>
                            </div>
                        </div>

                        {settings.orderTypeSettings?.deliveryEnabled && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Delivery Time Settings</h3>
                                    <Switch
                                        checked={settings.deliveryTimeSettings?.enabled ?? true}
                                        onCheckedChange={(checked) => handleDeliveryTimeChange('enabled', checked)}
                                    />
                                </div>
                                {settings.deliveryTimeSettings?.enabled && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 border rounded-lg">
                                        <div className="space-y-3">
                                            <Label>Default Delivery Time (minutes)</Label>
                                            <Input
                                                type="number"
                                                min="15"
                                                max="180"
                                                value={settings.deliveryTimeSettings?.deliveryTimeMinutes ?? 45}
                                                onChange={(e) => handleDeliveryTimeChange('deliveryTimeMinutes', parseInt(e.target.value) || 45)}
                                                className="w-32"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label>Customer Message</Label>
                                            <Textarea
                                                value={settings.deliveryTimeSettings?.displayMessage ?? "Your order will be delivered in {time} minutes"}
                                                onChange={(e) => handleDeliveryTimeChange('displayMessage', e.target.value)}
                                                placeholder="Your order will be delivered in {time} minutes"
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Collection Time Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-base font-medium">Enable Collection Time Display</Label>
                                <p className="text-sm text-slate-600 mt-1">
                                    Show collection time estimates to customers during ordering.
                                </p>
                            </div>
                            <Switch
                                checked={settings.collectionTimeSettings?.enabled || false}
                                onCheckedChange={(checked) => handleCollectionTimeChange('enabled', checked)}
                            />
                        </div>
                        
                        {settings.collectionTimeSettings?.enabled && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 border rounded-lg">
                                <div className="space-y-3">
                                    <Label>Collection Time (minutes)</Label>
                                    <Input
                                        type="number"
                                        min="15"
                                        max="120"
                                        value={settings.collectionTimeSettings?.collectionTimeMinutes || 30}
                                        onChange={(e) => handleCollectionTimeChange('collectionTimeMinutes', parseInt(e.target.value) || 30)}
                                        className="w-32"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label>Customer Message</Label>
                                    <Textarea
                                        value={settings.collectionTimeSettings?.displayMessage || ''}
                                        onChange={(e) => handleCollectionTimeChange('displayMessage', e.target.value)}
                                        placeholder="Your order will be ready for collection in {time} minutes"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Order Capacity Management</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {daysOfWeek.map(day => (
                            <div key={day.key} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-medium">{day.label}</h4>
                                    <Switch
                                        checked={throttlingSettings[day.key]?.enabled || false}
                                        onCheckedChange={(checked) => handleThrottlingChange(day.key, 'enabled', checked)}
                                    />
                                </div>
                                
                                {throttlingSettings[day.key]?.enabled && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label>Time Interval (minutes)</Label>
                                            <Input
                                                type="number"
                                                value={throttlingSettings[day.key]?.interval || 15}
                                                onChange={(e) => handleThrottlingChange(day.key, 'interval', parseInt(e.target.value) || 15)}
                                                placeholder="15"
                                                className="w-32"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Orders per Interval</Label>
                                            <Input
                                                type="number"
                                                value={throttlingSettings[day.key]?.ordersPerInterval || 10}
                                                onChange={(e) => handleThrottlingChange(day.key, 'ordersPerInterval', parseInt(e.target.value) || 10)}
                                                placeholder="10"
                                                className="w-32"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        <div className="flex justify-end">
                            <Button onClick={handleSaveThrottling} variant="outline">
                                <Save className="w-4 h-4 mr-2" />
                                Save Capacity Settings
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
