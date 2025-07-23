'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { KitchenDisplayScreen } from '@/components/kitchen-display/KitchenDisplayScreen';
import { DisplaySelector } from '@/components/kitchen-display/DisplaySelector';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface KitchenDisplay {
  id: string;
  displayName: string;
  theme: 'light' | 'dark' | 'high-contrast';
  fontSize: 'small' | 'medium' | 'large';
  layoutConfig: any;
  soundAlerts: boolean;
  refreshIntervalSeconds: number;
}

export default function KitchenDisplayPage() {
  const params = useParams();
  const tenantId = params.tenant as string;
  
  const [displays, setDisplays] = useState<KitchenDisplay[]>([]);
  const [selectedDisplay, setSelectedDisplay] = useState<KitchenDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDisplays();
  }, [tenantId]);

  const loadDisplays = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/kitchen-display?tenant=${tenantId}`);
      const data = await response.json();
      
      if (data.success) {
        setDisplays(data.displays);
        // Auto-select first display if available
        if (data.displays.length > 0 && !selectedDisplay) {
          setSelectedDisplay(data.displays[0]);
        }
      } else {
        setError('Failed to load kitchen displays');
      }
    } catch (err) {
      setError('Error loading displays');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <Alert className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (displays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <Alert className="max-w-md">
          <AlertDescription>
            No kitchen displays configured. Please contact your administrator to set up kitchen displays.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!selectedDisplay) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <DisplaySelector 
          displays={displays}
          onSelect={setSelectedDisplay}
        />
      </div>
    );
  }

  return (
    <KitchenDisplayScreen 
      display={selectedDisplay}
      tenantId={tenantId}
      onBack={() => setSelectedDisplay(null)}
    />
  );
}
