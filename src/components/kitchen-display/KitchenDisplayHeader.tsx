'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Clock,
  Monitor
} from 'lucide-react';

interface KitchenDisplay {
  id: string;
  displayName: string;
  theme: 'light' | 'dark' | 'high-contrast';
  fontSize: 'small' | 'medium' | 'large';
}

interface KitchenDisplayHeaderProps {
  display: KitchenDisplay;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  lastUpdate: Date;
  onBack: () => void;
  onRefresh: () => void;
}

export function KitchenDisplayHeader({ 
  display, 
  connectionStatus, 
  lastUpdate, 
  onBack, 
  onRefresh 
}: KitchenDisplayHeaderProps) {
  
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-5 w-5 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="h-5 w-5 text-red-500" />;
      default:
        return <RefreshCw className="h-5 w-5 text-yellow-500 animate-spin" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Connecting...';
    }
  };

  const getConnectionBadgeVariant = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'default' as const;
      case 'disconnected':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  return (
    <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between p-4">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          
          <div className="flex items-center space-x-2">
            <Monitor className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {display.displayName}
              </h1>
              <p className="text-sm text-gray-500">Kitchen Display System</p>
            </div>
          </div>
        </div>

        {/* Center Section - Time */}
        <div className="text-center">
          <div className="text-2xl font-mono font-bold text-gray-900">
            {new Date().toLocaleTimeString()}
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {getConnectionIcon()}
            <Badge variant={getConnectionBadgeVariant()}>
              {getConnectionText()}
            </Badge>
          </div>

          {/* Last Update */}
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>
              Updated: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>

          {/* Display Settings */}
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {display.theme}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {display.fontSize}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}
