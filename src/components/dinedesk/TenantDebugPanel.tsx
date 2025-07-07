'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

interface TenantDebugInfo {
  requestInfo: {
    url: string;
    method: string;
    timestamp: string;
    source: string;
  };
  tenantContext: {
    tenantSlug: string;
    contextType: string;
    headerSlug: string;
    requestedSlug: string;
    isAdminContext: boolean;
    isCustomerContext: boolean;
  };
  tenantData: {
    id: string;
    name: string;
    slug: string;
    status: string;
    subscriptionPlan: string;
    createdAt: string;
  } | null;
  tenantDetails: {
    settings: any;
    orders: { count: number } | null;
    users: { count: number } | null;
    databaseStatus: boolean;
  };
  debugInfo: {
    headers: Record<string, string>;
    params: Record<string, string>;
  };
}

export function TenantDebugPanel() {
  const [debugInfo, setDebugInfo] = useState<TenantDebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchDebugInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/debug/tenant-session?t=${timestamp}`);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDebugInfo(data);
    } catch (err) {
      console.error('Error fetching tenant debug info:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDebugInfo();
  }, []);
  
  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Tenant Debug Information</AlertTitle>
        <AlertDescription>
          {error}
        </AlertDescription>
        <Button onClick={fetchDebugInfo} variant="outline" size="sm" className="mt-2">
          Try Again
        </Button>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex justify-between">
            <span>Tenant Context Debug</span>
            <Button onClick={fetchDebugInfo} variant="outline" size="sm">
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading || !debugInfo ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm mb-2">Tenant Information</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Slug:</span>
                      <Badge variant="outline">{debugInfo.tenantContext.tenantSlug || 'None'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Context:</span>
                      <Badge variant="secondary">{debugInfo.tenantContext.contextType || 'None'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={debugInfo.tenantData?.status === 'active' ? 'default' : 'secondary'}>
                        {debugInfo.tenantData?.status || 'Unknown'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan:</span>
                      <span>{debugInfo.tenantData?.subscriptionPlan || 'None'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-sm mb-2">Tenant Statistics</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Users:</span>
                      <span>{debugInfo.tenantDetails.users?.count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Orders:</span>
                      <span>{debugInfo.tenantDetails.orders?.count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Database Status:</span>
                      {debugInfo.tenantDetails.databaseStatus ? (
                        <span className="text-green-600 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Connected
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <XCircle className="h-4 w-4 mr-1" />
                          Disconnected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Technical Details</h3>
                <div className="text-xs p-2 bg-muted rounded-md overflow-auto max-h-32">
                  <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Development Only</AlertTitle>
                  <AlertDescription>
                    This panel is for development and debugging purposes. Remove it in production.
                  </AlertDescription>
                </Alert>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
