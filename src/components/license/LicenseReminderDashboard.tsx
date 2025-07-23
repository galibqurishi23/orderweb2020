'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  Clock,
  Mail,
  RefreshCw,
  Calendar,
  Building,
  Loader2
} from 'lucide-react';

interface ExpiringLicense {
  id: string;
  key_code: string;
  expires_at: string;
  tenant_name: string;
  tenant_email: string;
  days_until_expiry: number;
}

interface ReminderStats {
  totalChecked: number;
  sent: number;
  failed: number;
}

export default function LicenseReminderDashboard() {
  const { toast } = useToast();
  const [expiringLicenses, setExpiringLicenses] = useState<ExpiringLicense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [lastReminderCheck, setLastReminderCheck] = useState<string>('');

  useEffect(() => {
    loadExpiringLicenses();
  }, []);

  const loadExpiringLicenses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/super-admin/license-reminders');
      if (response.ok) {
        const data = await response.json();
        setExpiringLicenses(data.expiringLicenses || []);
        setLastReminderCheck(data.lastCheck || '');
      }
    } catch (error) {
      console.error('Failed to load expiring licenses:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load expiring licenses',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendRemindersManually = async () => {
    setIsSendingReminders(true);
    try {
      const response = await fetch('/api/cron/license-reminders', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `Reminder check completed. ${data.result.sent} reminders sent.`,
        });
        
        // Reload the data
        await loadExpiringLicenses();
      } else {
        throw new Error(data.error);
      }

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Send Reminders',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsSendingReminders(false);
    }
  };

  const getUrgencyColor = (days: number) => {
    if (days <= 1) return 'bg-red-100 text-red-800 border-red-200';
    if (days <= 3) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (days <= 7) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getUrgencyIcon = (days: number) => {
    if (days <= 1) return <AlertTriangle className="h-4 w-4" />;
    if (days <= 3) return <Clock className="h-4 w-4" />;
    return <Calendar className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">License Reminders</h2>
          <p className="text-gray-600">Monitor and manage expiring licenses</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={loadExpiringLicenses}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button
            onClick={sendRemindersManually}
            disabled={isSendingReminders}
            size="sm"
          >
            {isSendingReminders ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Send Reminders
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiring (1 day)</p>
                <p className="text-2xl font-bold text-red-600">
                  {expiringLicenses.filter(l => l.days_until_expiry <= 1).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiring (3 days)</p>
                <p className="text-2xl font-bold text-orange-600">
                  {expiringLicenses.filter(l => l.days_until_expiry <= 3).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiring (7 days)</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {expiringLicenses.filter(l => l.days_until_expiry <= 7).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Monitored</p>
                <p className="text-2xl font-bold text-blue-600">
                  {expiringLicenses.length}
                </p>
              </div>
              <Building className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Licenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Expiring Licenses (Next 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expiringLicenses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No licenses expiring in the next 30 days</p>
              </div>
            ) : (
              expiringLicenses.map((license) => (
                <div
                  key={license.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${getUrgencyColor(license.days_until_expiry)}`}>
                      {getUrgencyIcon(license.days_until_expiry)}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {license.tenant_name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {license.tenant_email}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        License: {license.key_code}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        Expires: {formatDate(license.expires_at)}
                      </p>
                      <Badge className={getUrgencyColor(license.days_until_expiry)}>
                        {license.days_until_expiry === 0 ? 'Today' :
                         license.days_until_expiry === 1 ? 'Tomorrow' :
                         `${license.days_until_expiry} days`}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {lastReminderCheck && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">
              Last automatic reminder check: {formatDate(lastReminderCheck)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
