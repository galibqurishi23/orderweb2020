'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  DollarSign
} from 'lucide-react';

interface DisplayOrder {
  id: string;
  status: 'new' | 'preparing' | 'ready' | 'completed';
  totalAmount: number;
  createdAt: string;
  priorityLevel: 'low' | 'normal' | 'high' | 'urgent';
}

interface DisplayStatsProps {
  orders: DisplayOrder[];
}

export function DisplayStats({ orders }: DisplayStatsProps) {
  // Calculate statistics
  const stats = {
    totalOrders: orders.length,
    newOrders: orders.filter(o => o.status === 'new').length,
    preparingOrders: orders.filter(o => o.status === 'preparing').length,
    readyOrders: orders.filter(o => o.status === 'ready').length,
    urgentOrders: orders.filter(o => o.priorityLevel === 'urgent').length,
    totalValue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
    averageAge: calculateAverageAge(orders),
    oldestOrder: getOldestOrder(orders)
  };

  function calculateAverageAge(orders: DisplayOrder[]): number {
    if (orders.length === 0) return 0;
    const now = new Date();
    const totalAge = orders.reduce((sum, order) => {
      const age = now.getTime() - new Date(order.createdAt).getTime();
      return sum + age;
    }, 0);
    return Math.floor(totalAge / orders.length / 1000 / 60); // in minutes
  }

  function getOldestOrder(orders: DisplayOrder[]): number {
    if (orders.length === 0) return 0;
    const now = new Date();
    const oldest = Math.min(...orders.map(o => new Date(o.createdAt).getTime()));
    return Math.floor((now.getTime() - oldest) / 1000 / 60); // in minutes
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm border-b">
      <div className="p-4">
        <div className="grid grid-cols-8 gap-4">
          {/* Total Orders */}
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalOrders}
              </div>
              <div className="text-xs text-gray-500">Total Orders</div>
            </CardContent>
          </Card>

          {/* New Orders */}
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600">
                {stats.newOrders}
              </div>
              <div className="text-xs text-gray-500">New</div>
            </CardContent>
          </Card>

          {/* Preparing */}
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.preparingOrders}
              </div>
              <div className="text-xs text-gray-500">Preparing</div>
            </CardContent>
          </Card>

          {/* Ready */}
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {stats.readyOrders}
              </div>
              <div className="text-xs text-gray-500">Ready</div>
            </CardContent>
          </Card>

          {/* Urgent Orders */}
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {stats.urgentOrders}
              </div>
              <div className="text-xs text-gray-500">Urgent</div>
            </CardContent>
          </Card>

          {/* Total Value */}
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <DollarSign className="h-4 w-4 text-green-700" />
              </div>
              <div className="text-lg font-bold text-green-700">
                ${stats.totalValue.toFixed(0)}
              </div>
              <div className="text-xs text-gray-500">Total Value</div>
            </CardContent>
          </Card>

          {/* Average Age */}
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div className="text-lg font-bold text-orange-600">
                {stats.averageAge}m
              </div>
              <div className="text-xs text-gray-500">Avg Age</div>
            </CardContent>
          </Card>

          {/* Oldest Order */}
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <AlertCircle className={`h-4 w-4 ${stats.oldestOrder > 30 ? 'text-red-600' : 'text-orange-600'}`} />
              </div>
              <div className={`text-lg font-bold ${stats.oldestOrder > 30 ? 'text-red-600' : 'text-orange-600'}`}>
                {stats.oldestOrder}m
              </div>
              <div className="text-xs text-gray-500">Oldest</div>
            </CardContent>
          </Card>
        </div>

        {/* Alert for old orders */}
        {stats.oldestOrder > 30 && (
          <div className="mt-2 flex items-center justify-center">
            <Badge variant="destructive" className="animate-pulse">
              ⚠️ Order over 30 minutes old!
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
