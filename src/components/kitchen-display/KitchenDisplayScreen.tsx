'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { KitchenDisplayHeader } from './KitchenDisplayHeader';
import { OrderCard } from './OrderCard';
import { DisplayStats } from './DisplayStats';
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

interface KitchenDisplayScreenProps {
  display: KitchenDisplay;
  tenantId: string;
  onBack: () => void;
}

export function KitchenDisplayScreen({ display, tenantId, onBack }: KitchenDisplayScreenProps) {
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load initial orders
  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch(`/api/kitchen-display/${display.id}/orders?tenant=${tenantId}`);
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders);
        setLastUpdate(new Date());
      } else {
        setError('Failed to load orders');
      }
    } catch (err) {
      setError('Error loading orders');
    } finally {
      setLoading(false);
    }
  }, [display.id, tenantId]);

  // Initialize WebSocket connection
  useEffect(() => {
    const socketConnection = io({
      path: '/socket.io'
    });

    socketConnection.on('connect', () => {
      console.log('🔌 Connected to WebSocket');
      setConnectionStatus('connected');
      setSocket(socketConnection);
      
      // Join display room
      socketConnection.emit('join-display', {
        displayId: display.id,
        tenantId: tenantId
      });
    });

    socketConnection.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket');
      setConnectionStatus('disconnected');
    });

    socketConnection.on('display-connected', (data) => {
      console.log('🖥️ Display connected:', data);
    });

    socketConnection.on('new-order', (data) => {
      console.log('📦 New order received:', data.order);
      // Play sound if enabled
      if (display.soundAlerts) {
        playNotificationSound();
      }
      // Refresh orders
      loadOrders();
    });

    socketConnection.on('order-status-updated', (data) => {
      console.log('📊 Order status updated:', data);
      // Update specific order status
      setOrders(prev => prev.map(order => 
        order.id === data.displayOrderId 
          ? { ...order, status: data.newStatus }
          : order
      ));
      setLastUpdate(new Date());
    });

    socketConnection.on('display-update', (data) => {
      console.log('🔄 Display update received:', data);
      setOrders(data.orders);
      setLastUpdate(new Date());
    });

    socketConnection.on('error', (error) => {
      console.error('🔌 Socket error:', error);
      setError(error.message);
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, [display.id, tenantId, display.soundAlerts, loadOrders]);

  // Load initial data
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Auto-refresh orders
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders();
    }, display.refreshIntervalSeconds * 1000);

    return () => clearInterval(interval);
  }, [loadOrders, display.refreshIntervalSeconds]);

  // Update order status
  const updateOrderStatus = async (displayOrderId: string, newStatus: 'new' | 'preparing' | 'ready' | 'completed') => {
    try {
      const response = await fetch(`/api/kitchen-display/order-status/${displayOrderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          tenantId: tenantId
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update local state immediately for responsive UI
        setOrders(prev => prev.map(order => 
          order.id === displayOrderId 
            ? { ...order, status: newStatus }
            : order
        ));
        
        // Also emit via socket for real-time updates to other displays
        if (socket) {
          socket.emit('update-order-status', {
            displayOrderId,
            tenantId,
            newStatus
          });
        }
      } else {
        setError('Failed to update order status');
      }
    } catch (err) {
      setError('Error updating order status');
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Sound play failed:', e));
    } catch (e) {
      console.log('Sound not available:', e);
    }
  };

  // Apply theme classes
  const getThemeClasses = () => {
    switch (display.theme) {
      case 'dark':
        return 'bg-gray-900 text-white';
      case 'high-contrast':
        return 'bg-black text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-900';
    }
  };

  const getFontSizeClasses = () => {
    switch (display.fontSize) {
      case 'small':
        return 'text-sm';
      case 'large':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  // Group orders by status
  const ordersByStatus = {
    new: orders.filter(o => o.status === 'new'),
    preparing: orders.filter(o => o.status === 'preparing'),
    ready: orders.filter(o => o.status === 'ready')
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${getThemeClasses()}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${getThemeClasses()} ${getFontSizeClasses()}`}>
      {/* Header */}
      <KitchenDisplayHeader 
        display={display}
        connectionStatus={connectionStatus}
        lastUpdate={lastUpdate}
        onBack={onBack}
        onRefresh={loadOrders}
      />

      {/* Error Alert */}
      {error && (
        <div className="p-4">
          <Alert className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Stats */}
      <DisplayStats orders={orders} />

      {/* Orders Grid */}
      <div className="p-6">
        <div className="grid grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* New Orders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-red-600">
                🔴 New Orders ({ordersByStatus.new.length})
              </h2>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-full">
              {ordersByStatus.new.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusUpdate={updateOrderStatus}
                  theme={display.theme}
                />
              ))}
              {ordersByStatus.new.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No new orders
                </div>
              )}
            </div>
          </div>

          {/* Preparing Orders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-yellow-600">
                🟡 Preparing ({ordersByStatus.preparing.length})
              </h2>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-full">
              {ordersByStatus.preparing.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusUpdate={updateOrderStatus}
                  theme={display.theme}
                />
              ))}
              {ordersByStatus.preparing.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No orders in preparation
                </div>
              )}
            </div>
          </div>

          {/* Ready Orders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-green-600">
                🟢 Ready ({ordersByStatus.ready.length})
              </h2>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-full">
              {ordersByStatus.ready.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusUpdate={updateOrderStatus}
                  theme={display.theme}
                />
              ))}
              {ordersByStatus.ready.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No orders ready
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
