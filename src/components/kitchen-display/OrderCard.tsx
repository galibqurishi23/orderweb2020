'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  AlertTriangle,
  DollarSign,
  Play,
  CheckCircle,
  Package
} from 'lucide-react';

interface DisplayOrder {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  orderType: string;
  totalAmount: number;
  items: any[];
  specialInstructions?: string;
  status: 'new' | 'preparing' | 'ready' | 'completed';
  priorityLevel: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  acknowledgedAt?: string;
  estimatedReadyTime?: string;
}

interface OrderCardProps {
  order: DisplayOrder;
  onStatusUpdate: (displayOrderId: string, newStatus: 'new' | 'preparing' | 'ready' | 'completed') => void;
  theme: 'light' | 'dark' | 'high-contrast';
}

export function OrderCard({ order, onStatusUpdate, theme }: OrderCardProps) {
  const [updating, setUpdating] = useState(false);

  // Calculate elapsed time
  const getElapsedTime = () => {
    const now = new Date();
    const created = new Date(order.createdAt);
    const diff = now.getTime() - created.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    return minutes;
  };

  // Get time display with color coding
  const getTimeDisplay = () => {
    const minutes = getElapsedTime();
    let color = 'text-green-600';
    
    if (minutes > 30) color = 'text-red-600';
    else if (minutes > 20) color = 'text-orange-600';
    else if (minutes > 10) color = 'text-yellow-600';

    return { minutes, color };
  };

  // Get priority badge
  const getPriorityBadge = () => {
    switch (order.priorityLevel) {
      case 'urgent':
        return <Badge variant="destructive" className="animate-pulse">🚨 URGENT</Badge>;
      case 'high':
        return <Badge variant="destructive">🔥 HIGH</Badge>;
      case 'low':
        return <Badge variant="secondary">LOW</Badge>;
      default:
        return null;
    }
  };

  // Get status buttons based on current status
  const getStatusButtons = () => {
    switch (order.status) {
      case 'new':
        return (
          <Button
            size="sm"
            onClick={() => handleStatusUpdate('preparing')}
            disabled={updating}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Play className="h-4 w-4 mr-1" />
            Start Preparing
          </Button>
        );
      case 'preparing':
        return (
          <Button
            size="sm"
            onClick={() => handleStatusUpdate('ready')}
            disabled={updating}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Mark Ready
          </Button>
        );
      case 'ready':
        return (
          <Button
            size="sm"
            onClick={() => handleStatusUpdate('completed')}
            disabled={updating}
            className="w-full bg-gray-600 hover:bg-gray-700"
          >
            <Package className="h-4 w-4 mr-1" />
            Completed
          </Button>
        );
      default:
        return null;
    }
  };

  const handleStatusUpdate = async (newStatus: 'preparing' | 'ready' | 'completed') => {
    setUpdating(true);
    try {
      await onStatusUpdate(order.id, newStatus);
    } finally {
      setUpdating(false);
    }
  };

  const getCardClassName = () => {
    let baseClass = 'transition-all duration-200 hover:shadow-lg border-l-4';
    
    // Status-based border color
    switch (order.status) {
      case 'new':
        baseClass += ' border-l-red-500 bg-red-50';
        break;
      case 'preparing':
        baseClass += ' border-l-yellow-500 bg-yellow-50';
        break;
      case 'ready':
        baseClass += ' border-l-green-500 bg-green-50';
        break;
      default:
        baseClass += ' border-l-gray-500 bg-gray-50';
    }

    // Priority highlighting
    if (order.priorityLevel === 'urgent') {
      baseClass += ' ring-2 ring-red-500 animate-pulse';
    } else if (order.priorityLevel === 'high') {
      baseClass += ' ring-1 ring-orange-500';
    }

    return baseClass;
  };

  const timeInfo = getTimeDisplay();

  return (
    <Card className={getCardClassName()}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="font-mono">
              #{order.orderNumber}
            </Badge>
            {getPriorityBadge()}
          </div>
          <div className={`text-lg font-bold ${timeInfo.color}`}>
            <Clock className="h-4 w-4 inline mr-1" />
            {timeInfo.minutes}m
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Customer Info */}
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <User className="h-4 w-4 mr-2 text-gray-500" />
            <span className="font-medium">{order.customerName}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
            <span>{order.orderType}</span>
            <Badge variant="outline" className="ml-2 text-xs">
              <DollarSign className="h-3 w-3 mr-1" />
              {order.totalAmount.toFixed(2)}
            </Badge>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-700">Items:</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {order.items?.map((item, index) => (
              <div key={index} className="text-sm bg-white p-2 rounded border">
                <div className="flex justify-between">
                  <span className="font-medium">
                    {item.quantity}x {item.menuItem?.name || item.name}
                  </span>
                </div>
                {item.selectedAddons?.length > 0 && (
                  <div className="text-xs text-gray-600 mt-1">
                    + {item.selectedAddons.map((addon: any) => addon.name).join(', ')}
                  </div>
                )}
                {item.specialInstructions && (
                  <div className="text-xs text-orange-600 mt-1 italic">
                    Note: {item.specialInstructions}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="bg-yellow-100 border border-yellow-300 rounded p-2">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-yellow-800">Special Instructions:</div>
                <div className="text-sm text-yellow-700">{order.specialInstructions}</div>
              </div>
            </div>
          </div>
        )}

        {/* Status Action Button */}
        <div className="pt-2">
          {getStatusButtons()}
        </div>

        {/* Order Timestamps */}
        <div className="text-xs text-gray-500 space-y-1 border-t pt-2">
          <div>Created: {new Date(order.createdAt).toLocaleTimeString()}</div>
          {order.acknowledgedAt && (
            <div>Started: {new Date(order.acknowledgedAt).toLocaleTimeString()}</div>
          )}
          {order.estimatedReadyTime && (
            <div>Est. Ready: {new Date(order.estimatedReadyTime).toLocaleTimeString()}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
