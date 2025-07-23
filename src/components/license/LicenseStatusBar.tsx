'use client';

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock, XCircle } from 'lucide-react';

// React hook for client-side license status checking
export function useLicenseStatus() {
  const [licenseStatus, setLicenseStatus] = useState<{
    status: string;
    message?: string;
    isValid: boolean;
  }>({ status: 'unknown', isValid: true });

  useEffect(() => {
    // Check if running in browser
    if (typeof window === 'undefined') return;

    // Get license status from response headers or make API call
    const checkLicenseStatus = async () => {
      try {
        // Extract tenant ID from URL
        const pathParts = window.location.pathname.split('/');
        const tenantId = pathParts[1];

        if (!tenantId || tenantId === 'super-admin') return;

        const response = await fetch(`/api/tenant/license/status`);
        if (response.ok) {
          const data = await response.json();
          setLicenseStatus({
            status: data.status || 'unknown',
            message: data.message,
            isValid: data.isValid !== false
          });
        }
      } catch (error) {
        console.error('Failed to check license status:', error);
      }
    };

    checkLicenseStatus();
  }, []);

  return licenseStatus;
}

// React component for displaying license warnings
export function LicenseStatusBar() {
  const licenseStatus = useLicenseStatus();

  if (!licenseStatus.message || licenseStatus.status === 'active') {
    return null;
  }

  const getAlertVariant = () => {
    switch (licenseStatus.status) {
      case 'expired':
        return 'destructive';
      case 'grace_period':
      case 'expiring_soon':
        return 'default';
      default:
        return 'default';
    }
  };

  const getIcon = () => {
    switch (licenseStatus.status) {
      case 'expired':
        return <XCircle className="h-4 w-4" />;
      case 'grace_period':
      case 'expiring_soon':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Alert variant={getAlertVariant() as any} className="mb-4">
      {getIcon()}
      <AlertDescription>
        <strong>License Notice:</strong> {licenseStatus.message}
      </AlertDescription>
    </Alert>
  );
}
