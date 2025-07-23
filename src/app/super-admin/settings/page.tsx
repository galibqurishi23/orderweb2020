'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGlobalSettings } from '@/context/GlobalSettingsContext';
import { 
  Upload, 
  Save, 
  Eye, 
  Trash2, 
  Settings,
  Shield,
  Palette,
  Globe,
  Mail,
  Phone,
  User,
  Key,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
  Building,
  Server
} from 'lucide-react';
import { getCurrencySymbol, SUPPORTED_CURRENCIES } from '@/lib/currency-utils';

interface ApplicationSettings {
  appName: string;
  appLogo: string;
  appDescription: string;
  defaultCurrency: string;
  supportEmail: string;
  supportPhone: string;
  companyName: string;
  companyAddress: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailNotificationsEnabled: boolean;
  autoBackupEnabled: boolean;
  debugMode: boolean;
  maxRestaurants: number;
  trialPeriodDays: number;
}

interface SuperAdminCredentials {
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface SystemStatus {
  databaseConnected: boolean;
  emailServiceActive: boolean;
  totalRestaurants: number;
  activeRestaurants: number;
  systemUptime: string;
  lastBackup: string;
  databaseError?: string;
}

interface SMTPSettings {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  testEmail: string;
}

export default function SuperAdminSettings() {
  const { toast } = useToast();
  const { settings: globalSettings, updateSettings: updateGlobalSettings, refreshSettings } = useGlobalSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  
  const [adminCredentials, setAdminCredentials] = useState<SuperAdminCredentials>({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isUpdatingCredentials, setIsUpdatingCredentials] = useState(false);
  
  const [settings, setSettings] = useState<ApplicationSettings>({
    appName: 'OrderWeb',
    appLogo: '/icons/logo.svg',
    appDescription: 'Modern restaurant ordering and management system',
    defaultCurrency: 'GBP',
    supportEmail: 'support@orderweb.com',
    supportPhone: '+44 20 1234 5678',
    companyName: 'OrderWeb Ltd',
    companyAddress: 'London, United Kingdom',
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    accentColor: '#10b981',
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotificationsEnabled: true,
    autoBackupEnabled: true,
    debugMode: false,
    maxRestaurants: 100,
    trialPeriodDays: 14,
  });

  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    databaseConnected: true,
    emailServiceActive: true,
    totalRestaurants: 0,
    activeRestaurants: 0,
    systemUptime: '0 days',
    lastBackup: 'Never',
    databaseError: undefined,
  });

  const [smtpSettings, setSmtpSettings] = useState<SMTPSettings>({
    enabled: false,
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    from: '',
    testEmail: '',
  });

  const [isTestingEmail, setIsTestingEmail] = useState(false);

  useEffect(() => {
    loadSettings();
    loadSystemStatus();
    loadSmtpSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/super-admin/settings');
      if (response.ok) {
        const data = await response.json();
        const loadedSettings = { ...settings, ...data };
        setSettings(loadedSettings);
        
        // Also update global settings context
        updateGlobalSettings({
          appName: loadedSettings.appName,
          appLogo: loadedSettings.appLogo,
          appDescription: loadedSettings.appDescription,
          primaryColor: loadedSettings.primaryColor,
          secondaryColor: loadedSettings.secondaryColor,
          accentColor: loadedSettings.accentColor,
          defaultCurrency: loadedSettings.defaultCurrency,
          supportEmail: loadedSettings.supportEmail,
          supportPhone: loadedSettings.supportPhone,
          companyName: loadedSettings.companyName,
          companyAddress: loadedSettings.companyAddress
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const response = await fetch('/api/super-admin/system-status');
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data);
      } else {
        console.error('Failed to load system status - response not ok:', response.status);
      }
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  };

  const loadSmtpSettings = async () => {
    try {
      const response = await fetch('/api/super-admin/smtp-settings');
      if (response.ok) {
        const data = await response.json();
        // Ensure all values are defined (not undefined)
        setSmtpSettings({
          enabled: data.enabled || false,
          host: data.host || '',
          port: data.port || 587,
          secure: data.secure || false,
          user: data.user || '',
          password: data.password || '',
          from: data.from || '',
          testEmail: data.testEmail || '',
        });
      }
    } catch (error) {
      console.error('Failed to load SMTP settings:', error);
    }
  };

  const saveSmtpSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/super-admin/smtp-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpSettings)
      });

      if (response.ok) {
        toast({
          title: 'SMTP Settings Saved',
          description: 'Email configuration has been updated successfully',
        });
        loadSystemStatus(); // Refresh email service status
      } else {
        throw new Error('Failed to save SMTP settings');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save SMTP settings',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testEmailConnection = async () => {
    if (!smtpSettings.testEmail) {
      toast({
        variant: 'destructive',
        title: 'Test Email Required',
        description: 'Please enter a test email address',
      });
      return;
    }

    setIsTestingEmail(true);
    try {
      const response = await fetch('/api/super-admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...smtpSettings,
          testEmail: smtpSettings.testEmail 
        })
      });

      if (response.ok) {
        toast({
          title: 'Test Email Sent',
          description: `Test email sent successfully to ${smtpSettings.testEmail}`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send test email');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Test Failed',
        description: error instanceof Error ? error.message : 'Failed to send test email',
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please select an image file (PNG, JPG, SVG, etc.)',
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File Too Large',
          description: 'Please select an image smaller than 5MB',
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

      toast({
        title: 'Logo Selected',
        description: 'Logo ready for upload. Click "Save Settings" to apply.',
      });
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadLogo = async (): Promise<string> => {
    if (!logoFile) return settings.appLogo;

    const formData = new FormData();
    formData.append('logo', logoFile);

    const response = await fetch('/api/super-admin/upload-logo', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload logo');
    }

    const result = await response.json();
    return result.logoUrl;
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      let updatedLogoUrl = settings.appLogo;
      
      if (logoFile) {
        updatedLogoUrl = await uploadLogo();
        toast({
          title: 'Logo Uploaded',
          description: 'New application logo has been uploaded successfully',
        });
      }

      const updatedSettings = {
        ...settings,
        appLogo: updatedLogoUrl
      };

      const response = await fetch('/api/super-admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      setSettings(updatedSettings);
      setLogoFile(null);
      setLogoPreview('');
      
      // Update global settings context to refresh the logo in the layout
      updateGlobalSettings({
        appName: updatedSettings.appName,
        appLogo: updatedSettings.appLogo,
        appDescription: updatedSettings.appDescription,
        primaryColor: updatedSettings.primaryColor,
        secondaryColor: updatedSettings.secondaryColor,
        accentColor: updatedSettings.accentColor,
        defaultCurrency: updatedSettings.defaultCurrency,
        supportEmail: updatedSettings.supportEmail,
        supportPhone: updatedSettings.supportPhone,
        companyName: updatedSettings.companyName,
        companyAddress: updatedSettings.companyAddress
      });
      
      toast({
        title: 'Settings Saved',
        description: 'Application settings have been updated successfully',
      });
      
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save settings',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCredentials = async () => {
    if (!adminCredentials.email || !adminCredentials.currentPassword || !adminCredentials.newPassword) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in all required fields',
      });
      return;
    }

    if (adminCredentials.newPassword !== adminCredentials.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Password Mismatch',
        description: 'New password and confirmation do not match',
      });
      return;
    }

    if (adminCredentials.newPassword.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Password Too Short',
        description: 'Password must be at least 8 characters long',
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
        title: 'Credentials Updated',
        description: 'Super admin credentials have been updated successfully',
      });

      setAdminCredentials({
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update credentials',
      });
    } finally {
      setIsUpdatingCredentials(false);
    }
  };

  const handleBackupNow = async () => {
    try {
      const response = await fetch('/api/super-admin/backup', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Backup failed');
      }

      toast({
        title: 'Backup Created',
        description: 'Database backup has been created successfully',
      });

      loadSystemStatus(); // Refresh status
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Backup Failed',
        description: 'Failed to create database backup',
      });
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Super Admin Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Configure platform settings, branding, and system preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="smtp" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            SMTP
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Status
          </TabsTrigger>
        </TabsList>
        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Platform Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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

              {/* Company Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-base font-semibold">Company Name</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="OrderWeb Ltd"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyAddress" className="text-base font-semibold">Company Address</Label>
                  <Input
                    id="companyAddress"
                    value={settings.companyAddress}
                    onChange={(e) => setSettings(prev => ({ ...prev, companyAddress: e.target.value }))}
                    placeholder="London, United Kingdom"
                  />
                </div>
              </div>

              {/* Contact Information */}
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Settings */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Application Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Management */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Application Logo</Label>
                
                <div className="flex items-center gap-6">
                  <div className="relative h-20 w-20 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors">
                    {logoPreview ? (
                      <Image src={logoPreview} alt="New logo preview" fill className="object-contain p-2" />
                    ) : settings.appLogo ? (
                      <Image src={settings.appLogo} alt="Current logo" fill className="object-contain p-2" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400">
                        <Upload className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {logoPreview ? 'Change Logo' : 'Upload Logo'}
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
                    
                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-1">
                        {logoPreview ? 'New logo ready for upload' : 'Current application logo'}
                      </p>
                      <p className="text-xs">
                        Recommended: PNG or SVG format, max 5MB, square aspect ratio (200x200px)
                      </p>
                    </div>
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>

              {/* Color Scheme */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Color Scheme</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-16 h-10 p-1 rounded border"
                      />
                      <Input
                        value={settings.primaryColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                        placeholder="#2563eb"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="w-16 h-10 p-1 rounded border"
                      />
                      <Input
                        value={settings.secondaryColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        placeholder="#64748b"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="accentColor"
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="w-16 h-10 p-1 rounded border"
                      />
                      <Input
                        value={settings.accentColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                        placeholder="#10b981"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMTP Settings */}
        <TabsContent value="smtp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                SMTP Configuration
              </CardTitle>
              <CardDescription>
                Configure email server settings for sending notifications and system emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Enable Email Service</h3>
                  <p className="text-sm text-gray-500">Turn on/off email functionality for the system</p>
                </div>
                <Switch
                  checked={smtpSettings.enabled}
                  onCheckedChange={(checked) => setSmtpSettings(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              {smtpSettings.enabled && (
                <div className="space-y-6">
                  {/* SMTP Server Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        placeholder="smtp.gmail.com"
                        value={smtpSettings.host || ''}
                        onChange={(e) => setSmtpSettings(prev => ({ ...prev, host: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        placeholder="587"
                        value={smtpSettings.port || 587}
                        onChange={(e) => setSmtpSettings(prev => ({ ...prev, port: parseInt(e.target.value) || 587 }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpUser">SMTP Username</Label>
                    <Input
                      id="smtpUser"
                      placeholder="your-email@gmail.com"
                      value={smtpSettings.user || ''}
                      onChange={(e) => setSmtpSettings(prev => ({ ...prev, user: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpPassword">SMTP Password</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      placeholder="Your email password or app password"
                      value={smtpSettings.password || ''}
                      onChange={(e) => setSmtpSettings(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpFrom">From Email Address</Label>
                    <Input
                      id="smtpFrom"
                      placeholder="noreply@yourapp.com"
                      value={smtpSettings.from || ''}
                      onChange={(e) => setSmtpSettings(prev => ({ ...prev, from: e.target.value }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Use SSL/TLS</h3>
                      <p className="text-sm text-gray-500">Enable secure connection (recommended for port 465)</p>
                    </div>
                    <Switch
                      checked={smtpSettings.secure}
                      onCheckedChange={(checked) => setSmtpSettings(prev => ({ ...prev, secure: checked }))}
                    />
                  </div>

                  {/* Test Email Section */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Test Email Configuration</h3>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label htmlFor="testEmail">Test Email Address</Label>
                        <Input
                          id="testEmail"
                          type="email"
                          placeholder="test@example.com"
                          value={smtpSettings.testEmail || ''}
                          onChange={(e) => setSmtpSettings(prev => ({ ...prev, testEmail: e.target.value }))}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={testEmailConnection}
                          disabled={isTestingEmail || !smtpSettings.testEmail}
                          className="flex items-center gap-2"
                        >
                          {isTestingEmail ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            <>
                              <Mail className="h-4 w-4" />
                              Send Test
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* SMTP Configuration Tips */}
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Common SMTP Settings:</strong><br />
                      • Gmail: smtp.gmail.com, Port 587 (TLS) or 465 (SSL)<br />
                      • Outlook: smtp-mail.outlook.com, Port 587 (TLS)<br />
                      • Yahoo: smtp.mail.yahoo.com, Port 587 (TLS)<br />
                      • For Gmail, use App Password instead of regular password
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="flex gap-4">
                <Button 
                  onClick={saveSmtpSettings}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save SMTP Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Platform Limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxRestaurants" className="text-base font-semibold">Maximum Restaurants</Label>
                  <Input
                    id="maxRestaurants"
                    type="number"
                    value={settings.maxRestaurants}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxRestaurants: parseInt(e.target.value) || 0 }))}
                    min="1"
                    max="10000"
                  />
                  <p className="text-xs text-gray-500">Maximum number of restaurants allowed on the platform</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trialPeriodDays" className="text-base font-semibold">Trial Period (Days)</Label>
                  <Input
                    id="trialPeriodDays"
                    type="number"
                    value={settings.trialPeriodDays}
                    onChange={(e) => setSettings(prev => ({ ...prev, trialPeriodDays: parseInt(e.target.value) || 0 }))}
                    min="0"
                    max="365"
                  />
                  <p className="text-xs text-gray-500">Free trial period for new restaurants</p>
                </div>
              </div>

              {/* System Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-semibold">Maintenance Mode</Label>
                    <p className="text-sm text-gray-500">Temporarily disable the platform for maintenance</p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-semibold">New Restaurant Registration</Label>
                    <p className="text-sm text-gray-500">Allow new restaurants to register on the platform</p>
                  </div>
                  <Switch
                    checked={settings.registrationEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, registrationEnabled: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-semibold">Email Notifications</Label>
                    <p className="text-sm text-gray-500">Send system notifications via email</p>
                  </div>
                  <Switch
                    checked={settings.emailNotificationsEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotificationsEnabled: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-semibold">Automatic Backups</Label>
                    <p className="text-sm text-gray-500">Automatically backup database daily</p>
                  </div>
                  <Switch
                    checked={settings.autoBackupEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoBackupEnabled: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-semibold">Debug Mode</Label>
                    <p className="text-sm text-gray-500">Enable detailed logging for troubleshooting</p>
                  </div>
                  <Switch
                    checked={settings.debugMode}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, debugMode: checked }))}
                  />
                </div>
              </div>

              {/* Manual Backup */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Manual Backup</h3>
                    <p className="text-sm text-gray-500">Create an immediate backup of the database</p>
                  </div>
                  <Button onClick={handleBackupNow} variant="outline">
                    <Save className="h-4 w-4 mr-2" />
                    Backup Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Shield className="h-5 w-5" />
                Super Admin Security
              </CardTitle>
              <p className="text-sm text-gray-600">
                Update your super admin login credentials. This will affect your login to this panel.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> After updating your credentials, you will need to login again with the new information.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">New Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={adminCredentials.email}
                    onChange={(e) => setAdminCredentials(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="admin@orderweb.com"
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
                    placeholder="Enter new password (min 8 chars)"
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
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4" />
                      Update Credentials
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Status */}
        <TabsContent value="status" className="space-y-6">
          <div className="grid gap-6">
            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className={`h-3 w-3 rounded-full ${systemStatus.databaseConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div className="flex-1">
                      <p className="font-medium">Database</p>
                      <p className="text-sm text-gray-500">
                        {systemStatus.databaseConnected ? 'Connected' : 'Disconnected'}
                      </p>
                      {!systemStatus.databaseConnected && systemStatus.databaseError && (
                        <p className="text-xs text-red-600 mt-1 break-all">
                          {systemStatus.databaseError}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className={`h-3 w-3 rounded-full ${systemStatus.emailServiceActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      <p className="font-medium">Email Service</p>
                      <p className="text-sm text-gray-500">
                        {systemStatus.emailServiceActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Building className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Total Restaurants</p>
                      <p className="text-sm text-gray-500">{systemStatus.totalRestaurants}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Active Restaurants</p>
                      <p className="text-sm text-gray-500">{systemStatus.activeRestaurants}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">System Uptime</span>
                    <Badge variant="secondary">{systemStatus.systemUptime}</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Last Backup</span>
                    <Badge variant="outline">{systemStatus.lastBackup}</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Application Version</span>
                    <Badge>v2.1.0</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">Database Version</span>
                    <Badge variant="outline">MySQL 8.0</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Settings Button */}
      <div className="flex justify-end sticky bottom-6 bg-white p-4 border rounded-lg shadow-lg">
        <Button
          onClick={handleSaveSettings}
          disabled={isLoading}
          size="lg"
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save All Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
