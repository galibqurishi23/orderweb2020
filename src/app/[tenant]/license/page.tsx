'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Key,
  CheckCircle,
  XCircle,
  Calendar,
  AlertTriangle,
  Loader2,
  Shield,
  Clock
} from 'lucide-react';

interface LicenseStatus {
  isValid: boolean;
  keyCode?: string;
  status?: 'active' | 'expired' | 'in_grace_period';
  activatedAt?: string;
  expiresAt?: string;
  daysRemaining?: number;
  inGracePeriod?: boolean;
  graceDaysRemaining?: number;
}

export default function LicensePortal() {
  const { toast } = useToast();
  const [licenseKey, setLicenseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus>({ isValid: false });

  useEffect(() => {
    checkCurrentLicenseStatus();
  }, []);

  const checkCurrentLicenseStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const response = await fetch('/api/tenant/license/status');
      if (response.ok) {
        const data = await response.json();
        setLicenseStatus(data);
      }
    } catch (error) {
      console.error('Failed to check license status:', error);
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

    // Format license key to OWLTD-XXXXX-XXXXX format
    const formattedKey = licenseKey.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (formattedKey.length !== 15 || !formattedKey.startsWith('OWLTD')) {
      toast({
        variant: 'destructive',
        title: 'Invalid Format',
        description: 'License key must be in format: OWLTD-XXXXX-XXXXX',
      });
      return;
    }

    const displayKey = `${formattedKey.slice(0, 5)}-${formattedKey.slice(5, 10)}-${formattedKey.slice(10, 15)}`;

    setIsLoading(true);
    try {
      const response = await fetch('/api/tenant/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: displayKey })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'License Activated',
          description: data.message,
        });
        setLicenseKey('');
        await checkCurrentLicenseStatus();
      } else {
        throw new Error(data.error);
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
      day: 'numeric'
    });
  };

  const getStatusDisplay = () => {
    if (!licenseStatus.isValid) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>No Active License</strong>
            <br />
            Your restaurant needs a valid license key to access OrderWeb services.
          </AlertDescription>
        </Alert>
      );
    }

    if (licenseStatus.status === 'expired' && licenseStatus.inGracePeriod) {
      return (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>License Expired - Grace Period</strong>
            <br />
            Your license expired on {formatDate(licenseStatus.expiresAt!)} but you have {licenseStatus.graceDaysRemaining} days remaining in the grace period.
            <br />
            Please renew your license to continue service.
          </AlertDescription>
        </Alert>
      );
    }

    if (licenseStatus.status === 'expired') {
      return (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>License Expired</strong>
            <br />
            Your license expired on {formatDate(licenseStatus.expiresAt!)} and the grace period has ended.
            <br />
            Service has been suspended. Please activate a new license.
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
          License Key: {licenseStatus.keyCode}
          <br />
          Activated: {formatDate(licenseStatus.activatedAt!)}
          <br />
          Expires: {formatDate(licenseStatus.expiresAt!)}
          <br />
          {isExpiringSoon ? (
            <span className="font-semibold">⚠️ Warning: Only {licenseStatus.daysRemaining} days remaining!</span>
          ) : (
            <span>{licenseStatus.daysRemaining} days remaining</span>
          )}
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900">OrderWeb License</h1>
        <p className="text-gray-600">Manage your restaurant's license key</p>
      </div>

      {/* Current License Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            License Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getStatusDisplay()}
          
          <div className="mt-4 flex justify-center">
            <Button 
              onClick={checkCurrentLicenseStatus}
              variant="outline"
              size="sm"
            >
              <Clock className="w-4 h-4 mr-2" />
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activate New License */}
      <Card>
        <CardHeader>
          <CardTitle>Activate License Key</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="licenseKey">License Key</Label>
            <Input
              id="licenseKey"
              placeholder="OWLTD-XXXXX-XXXXX"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
              className="font-mono text-center text-lg"
              maxLength={17} // Including dashes
            />
            <p className="text-sm text-gray-500">
              Enter your 15-character OrderWeb license key
            </p>
          </div>

          <Button
            onClick={handleActivateLicense}
            disabled={isLoading || !licenseKey.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Activating...
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

      {/* Help Information */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">License Key Format</h4>
            <p className="text-sm text-gray-600">
              OrderWeb license keys are 15 characters long and start with "OWLTD".
              <br />
              Example: OWLTD-AB123-CD456
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">License Duration</h4>
            <p className="text-sm text-gray-600">
              • Standard licenses are valid for 30, 182, or 365 days
              <br />
              • You'll receive reminders before expiration
              <br />
              • Grace period of 7 days after expiration
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Contact Support</h4>
            <p className="text-sm text-gray-600">
              If you need a new license key or have activation issues, please contact your OrderWeb administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
