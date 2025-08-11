'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Key,
  CheckCircle,
  XCircle,
  Calendar,
  AlertTriangle,
  Loader2,
  Shield,
  Clock,
  RefreshCw,
  Plus
} from 'lucide-react';
import { usePathname } from 'next/navigation';

interface LicenseStatus {
  hasLicense: boolean;
  status?: 'active' | 'grace_period' | 'expired' | 'suspended';
  keyCode?: string;
  activatedAt?: string;
  expiresAt?: string;
  gracePeriodEndsAt?: string;
  daysRemaining?: number;
  inGracePeriod?: boolean;
  graceDaysRemaining?: number;
}

export default function LicenseManagementPage() {
  const { toast } = useToast();
  const pathname = usePathname();
  const tenant = pathname.split('/')[1];
  
  const [licenseKey, setLicenseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus>({ hasLicense: false });

  useEffect(() => {
    checkCurrentLicenseStatus();
  }, []);

  const checkCurrentLicenseStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const response = await fetch('/api/tenant/license-status');
      if (response.ok) {
        const data = await response.json();
        setLicenseStatus(data);
      }
    } catch (error) {
      console.error('Failed to check license status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to check license status',
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleActivateLicense = async () => {
    if (!licenseKey.trim()) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please enter a license key',
      });
      return;
    }

    // Validate license key format (OW + 6 characters)
    const formattedKey = licenseKey.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (formattedKey.length !== 8 || !formattedKey.startsWith('OW')) {
      toast({
        variant: 'destructive',
        title: 'Invalid Format',
        description: 'License key must be in format: OW + 6 characters (e.g., OWAB1234)',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/tenant/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          licenseKey: formattedKey,
          tenantSlug: tenant 
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'License Activated Successfully!',
          description: data.message,
        });
        setLicenseKey('');
        await checkCurrentLicenseStatus();
      } else {
        throw new Error(data.error || data.message);
      }

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Activation Failed',
        description: error instanceof Error ? error.message : 'Failed to activate license',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = () => {
    if (!licenseStatus.hasLicense) {
      return <Badge variant="destructive">No License</Badge>;
    }

    switch (licenseStatus.status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'grace_period':
        return <Badge variant="destructive" className="bg-orange-500">Grace Period</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'suspended':
        return <Badge variant="destructive" className="bg-red-600">Suspended</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusDisplay = () => {
    if (!licenseStatus.hasLicense) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>No Active License</strong>
            <br />
            Your restaurant needs a valid license key to access all OrderWeb services.
            Please activate a license key below.
          </AlertDescription>
        </Alert>
      );
    }

    if (licenseStatus.status === 'expired' && licenseStatus.inGracePeriod) {
      return (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>License Expired - Grace Period Active</strong>
            <br />
            Your license expired on {formatDate(licenseStatus.expiresAt!)} but you have {licenseStatus.graceDaysRemaining} days remaining in the grace period.
            <br />
            <span className="font-semibold">Please renew your license immediately to avoid service interruption.</span>
          </AlertDescription>
        </Alert>
      );
    }

    if (licenseStatus.status === 'expired') {
      return (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>License Expired - Service Suspended</strong>
            <br />
            Your license expired on {formatDate(licenseStatus.expiresAt!)} and the grace period has ended.
            <br />
            <span className="font-semibold">Service has been suspended. Please activate a new license immediately.</span>
          </AlertDescription>
        </Alert>
      );
    }

    const isExpiringSoon = licenseStatus.daysRemaining! <= 7;

    return (
      <Alert className={isExpiringSoon ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}>
        <CheckCircle className={`h-4 w-4 ${isExpiringSoon ? 'text-orange-600' : 'text-green-600'}`} />
        <AlertDescription className={isExpiringSoon ? 'text-orange-800' : 'text-green-800'}>
          <strong>License Active</strong>
          <br />
          <div className="mt-2 space-y-1">
            <div><strong>License Key:</strong> {licenseStatus.keyCode}</div>
            <div><strong>Activated:</strong> {formatDate(licenseStatus.activatedAt!)}</div>
            <div><strong>Expires:</strong> {formatDate(licenseStatus.expiresAt!)}</div>
            <div>
              {isExpiringSoon ? (
                <span className="font-semibold text-orange-700">⚠️ Warning: Only {licenseStatus.daysRemaining} days remaining!</span>
              ) : (
                <span className="text-green-700">{licenseStatus.daysRemaining} days remaining</span>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  if (isCheckingStatus) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Checking license status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900">License Management</h1>
        <p className="text-gray-600">Manage your restaurant's OrderWeb license</p>
      </div>

      {/* Current License Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Current License Status
            </div>
            {getStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getStatusDisplay()}
          
          <div className="mt-4 flex justify-center">
            <Button 
              onClick={checkCurrentLicenseStatus}
              variant="outline"
              size="sm"
              disabled={isCheckingStatus}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isCheckingStatus ? 'animate-spin' : ''}`} />
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activate New License */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Activate New License
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="licenseKey">License Key</Label>
            <Input
              id="licenseKey"
              placeholder="OWAB1234"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
              className="font-mono text-center text-lg"
              maxLength={8}
            />
            <p className="text-sm text-gray-500">
              Enter your 8-character OrderWeb license key (Format: OW + 6 characters)
            </p>
          </div>

          <Button
            onClick={handleActivateLicense}
            disabled={isLoading || !licenseKey.trim()}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Activating License...
              </>
            ) : (
              <>
                <Key className="w-4 h-4 mr-2" />
                Activate License
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* License Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            License Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">License Key Format</h4>
              <p className="text-sm text-gray-600">
                OrderWeb license keys are 8 characters long and start with "OW".
                <br />
                <strong>Example:</strong> OWAB1234, OWCD5678
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">License Duration</h4>
              <p className="text-sm text-gray-600">
                • Standard licenses are valid for up to 365 days
                <br />
                • Grace period of 7 days after expiration
                <br />
                • Email reminders sent before expiration
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">What Happens When Expired?</h4>
              <p className="text-sm text-gray-600">
                • 7-day grace period with warnings
                <br />
                • After grace period: Admin panel blocked
                <br />
                • Customer ordering continues normally
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Need Help?</h4>
              <p className="text-sm text-gray-600">
                Contact your OrderWeb administrator for:
                <br />
                • New license keys
                <br />
                • License extensions
                <br />
                • Technical support
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {licenseStatus.hasLicense && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button 
                variant="outline" 
                onClick={() => window.open(`/${tenant}`, '_blank')}
              >
                View Live Restaurant
              </Button>
              <Button 
                variant="outline"
                onClick={checkCurrentLicenseStatus}
                disabled={isCheckingStatus}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                Check License Status
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
