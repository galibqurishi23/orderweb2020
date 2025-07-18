'use client';

import React, { useState } from 'react';
import { Clock, Save, Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import { useTenantData } from '@/context/TenantDataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function OrderTimingPage() {
  const { restaurantSettings, saveSettings } = useTenantData();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState(() => ({
    collectionTimeSettings: {
      collectionTimeMinutes: restaurantSettings?.collectionTimeSettings?.collectionTimeMinutes || 30,
      enabled: restaurantSettings?.collectionTimeSettings?.enabled ?? true,
      displayMessage: restaurantSettings?.collectionTimeSettings?.displayMessage || 
        "Your order will be ready for collection in {time} minutes"
    },
    deliveryTimeSettings: {
      deliveryTimeMinutes: restaurantSettings?.deliveryTimeSettings?.deliveryTimeMinutes || 45,
      enabled: restaurantSettings?.deliveryTimeSettings?.enabled ?? true,
      displayMessage: restaurantSettings?.deliveryTimeSettings?.displayMessage || 
        "Your order will be delivered in {time} minutes"
    }
  }));

  const handleSave = async () => {
    try {
      await saveSettings({
        ...restaurantSettings,
        collectionTimeSettings: settings.collectionTimeSettings,
        deliveryTimeSettings: settings.deliveryTimeSettings
      });
      
      toast({
        title: "Order Timing Settings Saved",
        description: "Your order timing configuration has been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving order timing settings:', error);
      toast({
        title: "Error",
        description: "Failed to save order timing settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateCollectionSetting = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      collectionTimeSettings: {
        ...prev.collectionTimeSettings,
        [field]: value
      }
    }));
  };

  const updateDeliverySetting = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      deliveryTimeSettings: {
        ...prev.deliveryTimeSettings,
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Clock className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Order Timing</h1>
            <p className="text-slate-600 mt-1">
              Configure default collection and delivery times for customer orders
            </p>
          </div>
        </div>
        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Information Alert */}
      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          These settings control the default timing displayed to customers on the order confirmation page. 
          Collection and delivery times can be overridden by specific delivery zones or advance order settings.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Collection Time Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Collection Orders
            </CardTitle>
            <CardDescription>
              Configure timing settings for customer collection orders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Enable Collection Time Display</Label>
                <p className="text-sm text-muted-foreground">
                  Show collection time message to customers
                </p>
              </div>
              <Switch
                checked={settings.collectionTimeSettings.enabled}
                onCheckedChange={(checked) => updateCollectionSetting('enabled', checked)}
              />
            </div>

            {settings.collectionTimeSettings.enabled && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="collectionTime">Default Collection Time (minutes)</Label>
                    <Input
                      id="collectionTime"
                      type="number"
                      min="5"
                      max="120"
                      value={settings.collectionTimeSettings.collectionTimeMinutes}
                      onChange={(e) => updateCollectionSetting('collectionTimeMinutes', parseInt(e.target.value) || 30)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Time in minutes customers should wait before collecting their order
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="collectionMessage">Collection Message Template</Label>
                    <Input
                      id="collectionMessage"
                      value={settings.collectionTimeSettings.displayMessage}
                      onChange={(e) => updateCollectionSetting('displayMessage', e.target.value)}
                      placeholder="Your order will be ready for collection in {time} minutes"
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use <code className="bg-gray-100 px-1 rounded">{"{time}"}</code> as placeholder for minutes
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="font-medium text-blue-900 mb-1">Preview</h4>
                  <p className="text-blue-800 text-sm">
                    {settings.collectionTimeSettings.displayMessage.replace(
                      '{time}', 
                      String(settings.collectionTimeSettings.collectionTimeMinutes)
                    )}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Delivery Time Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Delivery Orders
            </CardTitle>
            <CardDescription>
              Configure timing settings for customer delivery orders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Enable Delivery Time Display</Label>
                <p className="text-sm text-muted-foreground">
                  Show delivery time message to customers
                </p>
              </div>
              <Switch
                checked={settings.deliveryTimeSettings.enabled}
                onCheckedChange={(checked) => updateDeliverySetting('enabled', checked)}
              />
            </div>

            {settings.deliveryTimeSettings.enabled && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="deliveryTime">Default Delivery Time (minutes)</Label>
                    <Input
                      id="deliveryTime"
                      type="number"
                      min="15"
                      max="180"
                      value={settings.deliveryTimeSettings.deliveryTimeMinutes}
                      onChange={(e) => updateDeliverySetting('deliveryTimeMinutes', parseInt(e.target.value) || 45)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Default delivery time for areas not covered by specific delivery zones
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="deliveryMessage">Delivery Message Template</Label>
                    <Input
                      id="deliveryMessage"
                      value={settings.deliveryTimeSettings.displayMessage}
                      onChange={(e) => updateDeliverySetting('displayMessage', e.target.value)}
                      placeholder="Your order will be delivered in {time} minutes"
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use <code className="bg-gray-100 px-1 rounded">{"{time}"}</code> as placeholder for minutes
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <h4 className="font-medium text-green-900 mb-1">Preview</h4>
                  <p className="text-green-800 text-sm">
                    {settings.deliveryTimeSettings.displayMessage.replace(
                      '{time}', 
                      String(settings.deliveryTimeSettings.deliveryTimeMinutes)
                    )}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>How Order Timing Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium">Collection Orders</h4>
              <p className="text-sm text-muted-foreground">
                When customers place a collection order, they'll see a message with the expected wait time 
                on the order confirmation page.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Delivery Orders</h4>
              <p className="text-sm text-muted-foreground">
                Delivery times can be customized per delivery zone. If no specific zone is configured, 
                the default delivery time will be used.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Advance Orders</h4>
              <p className="text-sm text-muted-foreground">
                For advance orders, customers see their scheduled time instead of these default timings, 
                along with a note that it's an advance order.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
