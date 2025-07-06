'use client';

import React, { useState } from 'react';
import { Save, CreditCard, Wallet } from 'lucide-react';
import type { PaymentSettings } from '@/lib/types';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

export default function PaymentsPage() {
    const { restaurantSettings, saveSettings } = useData();
    const [settings, setSettings] = useState<PaymentSettings>(restaurantSettings.paymentSettings);
    const { toast } = useToast();
    
    // Sync local state when context data changes
    React.useEffect(() => {
        setSettings(restaurantSettings.paymentSettings);
    }, [restaurantSettings.paymentSettings]);

    const handleSave = () => {
        saveSettings({ ...restaurantSettings, paymentSettings: settings });
        toast({
            title: "Payment Settings Saved",
            description: "Your payment gateway settings have been successfully updated.",
        });
    };

    const handlePaymentSettingsChange = (
        provider: keyof PaymentSettings,
        field: string,
        value: string | boolean
    ) => {
        setSettings(prev => ({
            ...prev,
            [provider]: {
                ...prev[provider],
                [field]: value,
            },
        }));
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-4">
                            <CreditCard className="w-8 h-8" />
                            <span className="text-2xl font-bold">Payment Settings</span>
                        </CardTitle>
                        <CardDescription>Manage payment gateways and API connections.</CardDescription>
                    </div>
                     <Button onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2"/>
                        Save Changes
                    </Button>
                </CardHeader>
            </Card>

            <div className="space-y-6">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Wallet className="w-6 h-6 text-primary" />
                            <h3 className="text-lg font-semibold">Cash Payments</h3>
                        </div>
                        <Switch
                            checked={settings.cash.enabled}
                            onCheckedChange={(checked) => handlePaymentSettingsChange('cash', 'enabled', checked)}
                        />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Enable or disable the option for customers to pay with cash for pickup or delivery orders.
                        </p>
                    </CardContent>
                </Card>

                <Card className={cn(!settings.stripe.enabled && "bg-muted/50")}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <CreditCard className="w-6 h-6 text-primary" />
                            <h3 className="text-lg font-semibold">Stripe</h3>
                        </div>
                        <Switch
                            checked={settings.stripe.enabled}
                            onCheckedChange={(checked) => handlePaymentSettingsChange('stripe', 'enabled', checked)}
                        />
                    </CardHeader>
                    {settings.stripe.enabled && (
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="stripe-api-key">Publishable Key</Label>
                                <Input
                                    id="stripe-api-key"
                                    type="password"
                                    value={settings.stripe.apiKey}
                                    onChange={(e) => handlePaymentSettingsChange('stripe', 'apiKey', e.target.value)}
                                    placeholder="pk_live_..."
                                />
                            </div>
                            <div>
                                <Label htmlFor="stripe-api-secret">Secret Key</Label>
                                <Input
                                    id="stripe-api-secret"
                                    type="password"
                                    value={settings.stripe.apiSecret}
                                    onChange={(e) => handlePaymentSettingsChange('stripe', 'apiSecret', e.target.value)}
                                    placeholder="sk_live_..."
                                />
                            </div>
                        </CardContent>
                    )}
                </Card>

                <Card className={cn(!settings.globalPayments.enabled && "bg-muted/50")}>
                    <CardHeader className="flex flex-row items-center justify-between">
                         <div className="flex items-center gap-4">
                            <CreditCard className="w-6 h-6 text-primary" />
                            <h3 className="text-lg font-semibold">Global Payments</h3>
                        </div>
                        <Switch
                            checked={settings.globalPayments.enabled}
                            onCheckedChange={(checked) => handlePaymentSettingsChange('globalPayments', 'enabled', checked)}
                        />
                    </CardHeader>
                    {settings.globalPayments.enabled && (
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="gp-merchant-id">Merchant ID</Label>
                                <Input
                                    id="gp-merchant-id"
                                    value={settings.globalPayments.merchantId}
                                    onChange={(e) => handlePaymentSettingsChange('globalPayments', 'merchantId', e.target.value)}
                                    placeholder="Your Merchant ID"
                                />
                            </div>
                             <div>
                                <Label htmlFor="gp-api-secret">Shared Secret</Label>
                                <Input
                                    id="gp-api-secret"
                                    type="password"
                                    value={settings.globalPayments.apiSecret}
                                    onChange={(e) => handlePaymentSettingsChange('globalPayments', 'apiSecret', e.target.value)}
                                    placeholder="Your Shared Secret"
                                />
                            </div>
                        </CardContent>
                    )}
                </Card>

                <Card className={cn(!settings.worldpay.enabled && "bg-muted/50")}>
                     <CardHeader className="flex flex-row items-center justify-between">
                         <div className="flex items-center gap-4">
                            <CreditCard className="w-6 h-6 text-primary" />
                            <h3 className="text-lg font-semibold">Worldpay</h3>
                        </div>
                        <Switch
                            checked={settings.worldpay.enabled}
                            onCheckedChange={(checked) => handlePaymentSettingsChange('worldpay', 'enabled', checked)}
                        />
                    </CardHeader>
                    {settings.worldpay.enabled && (
                        <CardContent className="space-y-4">
                             <div>
                                <Label htmlFor="wp-merchant-id">Merchant Code</Label>
                                <Input
                                    id="wp-merchant-id"
                                    value={settings.worldpay.merchantId}
                                    onChange={(e) => handlePaymentSettingsChange('worldpay', 'merchantId', e.target.value)}
                                    placeholder="Your Merchant Code"
                                />
                            </div>
                            <div>
                                <Label htmlFor="wp-api-key">XML Password</Label>
                                 <Input
                                    id="wp-api-key"
                                    type="password"
                                    value={settings.worldpay.apiKey}
                                    onChange={(e) => handlePaymentSettingsChange('worldpay', 'apiKey', e.target.value)}
                                    placeholder="Your XML Password"
                                />
                            </div>
                        </CardContent>
                    )}
                </Card>
            </div>
        </div>
    );
}
