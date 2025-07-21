'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Upload, Save, Eye, Trash2, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getCurrencySymbol, SUPPORTED_CURRENCIES } from '@/lib/currency-utils';
import Image from 'next/image';

interface ApplicationSettings {
  appName: string;
  appLogo: string;
  appDescription: string;
  defaultCurrency: string;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailNotificationsEnabled: boolean;
}

export default function SuperAdminSettings() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  
  // Super Admin Credentials State
  const [adminCredentials, setAdminCredentials] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isUpdatingCredentials, setIsUpdatingCredentials] = useState(false);
  
  const [settings, setSettings] = useState<ApplicationSettings>({
    appName: 'OrderWeb',
    appLogo: '/icons/logo.svg', // Current default logo
    appDescription: 'Modern restaurant ordering and management system',
    defaultCurrency: 'GBP',
    supportEmail: 'support@orderweb.com',
    supportPhone: '+44 20 1234 5678',
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotificationsEnabled: true,
  });

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: '❌ Invalid File Type',
          description: '⚠️ Please select an image file (PNG, JPG, SVG, etc.)',
          duration: 5000
        });
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: '❌ File Too Large',
          description: '⚠️ Please select an image smaller than 2MB',
          duration: 5000
        });
        return;
      }

      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // In a real app, you would upload the logo to a file storage service
      // and update the application settings in the database
      
      let updatedLogoUrl = settings.appLogo;
      
      if (logoFile) {
        // Simulate logo upload
        // In production, use services like AWS S3, Cloudinary, etc.
        const formData = new FormData();
        formData.append('logo', logoFile);
        
        // For demo purposes, we'll use a placeholder URL
        updatedLogoUrl = `/uploads/logos/${Date.now()}-${logoFile.name}`;
        
        toast({
          title: '📸 Logo Uploaded',
          description: 'New application logo has been uploaded successfully',
          duration: 3000
        });
      }

      const updatedSettings = {
        ...settings,
        appLogo: updatedLogoUrl
      };

      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSettings(updatedSettings);
      setLogoFile(null);
      setLogoPreview('');
      
      toast({
        title: '✅ Settings Saved',
        description: 'Application settings have been updated successfully',
        duration: 3000
      });
      
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '❌ Save Failed',
        description: '⚠️ Failed to save settings. Please try again.',
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCredentials = async () => {
    if (!adminCredentials.email || !adminCredentials.currentPassword || !adminCredentials.newPassword) {
      toast({
        variant: 'destructive',
        title: '❌ Missing Information',
        description: 'Please fill in all required fields',
      });
      return;
    }

    if (adminCredentials.newPassword !== adminCredentials.confirmPassword) {
      toast({
        variant: 'destructive',
        title: '❌ Password Mismatch',
        description: 'New password and confirmation do not match',
      });
      return;
    }

    if (adminCredentials.newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: '❌ Password Too Short',
        description: 'Password must be at least 6 characters long',
      });
      return;
    }

    setIsUpdatingCredentials(true);
    try {
      const response = await fetch('/api/super-admin/update-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminCredentials.email,
          currentPassword: adminCredentials.currentPassword,
          newPassword: adminCredentials.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update credentials');
      }

      toast({
        title: '✅ Credentials Updated',
        description: 'Super admin credentials have been updated successfully',
        duration: 3000
      });

      // Clear form
      setAdminCredentials({
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

    } catch (error) {
      toast({
        variant: 'destructive',
        title: '❌ Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update credentials',
        duration: 5000
      });
    } finally {
      setIsUpdatingCredentials(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Platform Settings
        </h1>
        <p className="text-gray-600">Configure global platform settings and branding</p>
      </div>
      
      {/* Application Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Application Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Management */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Application Logo</Label>
            
            {/* Current Logo Display */}
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 border rounded-lg overflow-hidden bg-gray-50">
                {logoPreview ? (
                  <Image src={logoPreview} alt="New logo preview" fill className="object-contain" />
                ) : settings.appLogo ? (
                  <Image src={settings.appLogo} alt="Current logo" fill className="object-contain" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400">
                    <Upload className="h-6 w-6" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">
                  {logoPreview ? 'New logo preview' : 'Current application logo'}
                </p>
                <Badge variant={logoPreview ? 'default' : 'secondary'}>
                  {logoPreview ? 'Ready to save' : 'Current logo'}
                </Badge>
              </div>
            </div>
            
            {/* Logo Upload Controls */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {logoPreview ? 'Change Logo' : 'Upload New Logo'}
              </Button>
              
              {logoPreview && (
                <Button
                  variant="ghost"
                  onClick={handleRemoveLogo}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            
            <p className="text-xs text-gray-500">
              Recommended: PNG or SVG format, max 2MB, square aspect ratio (e.g., 200x200px)
            </p>
          </div>

          {/* App Name */}
          <div className="space-y-2">
            <Label htmlFor="appName" className="text-base font-semibold">Application Name</Label>
            <Input
              id="appName"
              value={settings.appName}
              onChange={(e) => setSettings(prev => ({ ...prev, appName: e.target.value }))}
              placeholder="OrderWeb"
            />
          </div>

          {/* App Description */}
          <div className="space-y-2">
            <Label htmlFor="appDescription" className="text-base font-semibold">Application Description</Label>
            <Textarea
              id="appDescription"
              value={settings.appDescription}
              onChange={(e) => setSettings(prev => ({ ...prev, appDescription: e.target.value }))}
              placeholder="Modern restaurant ordering and management system"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Platform Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default Currency */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Default Currency</Label>
            <Select
              value={settings.defaultCurrency}
              onValueChange={(value) => setSettings(prev => ({ ...prev, defaultCurrency: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              New restaurants will use this currency by default. Current: {getCurrencySymbol(settings.defaultCurrency)}
            </p>
          </div>

          {/* Support Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supportEmail" className="text-base font-semibold">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                placeholder="support@orderweb.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supportPhone" className="text-base font-semibold">Support Phone</Label>
              <Input
                id="supportPhone"
                type="tel"
                value={settings.supportPhone}
                onChange={(e) => setSettings(prev => ({ ...prev, supportPhone: e.target.value }))}
                placeholder="+44 20 1234 5678"
              />
            </div>
          </div>

          {/* Platform Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Maintenance Mode</Label>
                <p className="text-sm text-gray-500">Temporarily disable the platform for maintenance</p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenanceMode: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">New Restaurant Registration</Label>
                <p className="text-sm text-gray-500">Allow new restaurants to register on the platform</p>
              </div>
              <Switch
                checked={settings.registrationEnabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, registrationEnabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Email Notifications</Label>
                <p className="text-sm text-gray-500">Send system notifications via email</p>
              </div>
              <Switch
                checked={settings.emailNotificationsEnabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotificationsEnabled: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Super Admin Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Settings className="h-5 w-5" />
            Super Admin Credentials
          </CardTitle>
          <p className="text-sm text-gray-600">
            Update your super admin login credentials. Use this to change the default login.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">New Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={adminCredentials.email}
                onChange={(e) => setAdminCredentials(prev => ({ ...prev, email: e.target.value }))}
                placeholder="admin@dinedesk.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={adminCredentials.currentPassword}
                onChange={(e) => setAdminCredentials(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Enter current password"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={adminCredentials.newPassword}
                onChange={(e) => setAdminCredentials(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={adminCredentials.confirmPassword}
                onChange={(e) => setAdminCredentials(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleUpdateCredentials}
              disabled={isUpdatingCredentials || !adminCredentials.email || !adminCredentials.currentPassword || !adminCredentials.newPassword}
              variant="destructive"
              className="flex items-center gap-2"
            >
              {isUpdatingCredentials ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Update Credentials
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Platform Settings Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Platform Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
