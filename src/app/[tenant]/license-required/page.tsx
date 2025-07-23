'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Key, AlertTriangle } from 'lucide-react';

export default function LicenseRequiredPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [licenseKey, setLicenseKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [message, setMessage] = useState('');
  const [tenantInfo, setTenantInfo] = useState<any>(null);

  const tenantSlug = params.tenant as string;
  const status = searchParams.get('status') || 'expired';
  const statusMessage = decodeURIComponent(searchParams.get('message') || '');

  useEffect(() => {
    loadTenantInfo();
  }, [tenantSlug]);

  const loadTenantInfo = async () => {
    try {
      const response = await fetch(`/api/tenant/info?slug=${tenantSlug}`);
      if (response.ok) {
        const data = await response.json();
        setTenantInfo(data.data);
      }
    } catch (error) {
      console.error('Error loading tenant info:', error);
    }
  };

  const handleActivateLicense = async () => {
    if (!licenseKey.trim()) {
      setMessage('Please enter a license key');
      return;
    }

    setIsActivating(true);
    setMessage('');

    try {
      const response = await fetch('/api/tenant/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: licenseKey.trim(),
          tenantSlug
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('License activated successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = `/${tenantSlug}/admin`;
        }, 2000);
      } else {
        setMessage(data.error || 'Failed to activate license');
      }
    } catch (error) {
      setMessage('Error activating license. Please try again.');
    } finally {
      setIsActivating(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'trial':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Trial Active</Badge>;
      case 'expired':
        return <Badge variant="destructive">Trial Expired</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Service Suspended</Badge>;
      default:
        return <Badge variant="outline">Unknown Status</Badge>;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'trial':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'expired':
      case 'suspended':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Key className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            License Required
          </CardTitle>
          <CardDescription>
            {tenantInfo?.name && (
              <span className="font-medium">{tenantInfo.name}</span>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            {getStatusBadge()}
          </div>

          {statusMessage && (
            <Alert>
              <AlertDescription className="text-center">
                {statusMessage}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center text-sm text-gray-600">
            {status === 'trial' ? (
              <p>Your 3-day free trial is ending soon. Activate a license key to continue using the service.</p>
            ) : (
              <p>Your 3-day free trial has expired. Please activate a license key to continue using the service.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="license-key">License Key</Label>
            <Input
              id="license-key"
              type="text"
              placeholder="OWLTD-XXXXX-XXXXX"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
              className="text-center font-mono"
            />
          </div>

          {message && (
            <Alert className={message.includes('successfully') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription className={message.includes('successfully') ? 'text-green-800' : 'text-red-800'}>
                {message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <Button 
            onClick={handleActivateLicense}
            disabled={isActivating || !licenseKey.trim()}
            className="w-full"
          >
            {isActivating ? 'Activating...' : 'Activate License'}
          </Button>

          <div className="text-center text-xs text-gray-500">
            <p>Need a license key?</p>
            <p>Contact support: <span className="font-medium">support@owltd.com</span></p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
