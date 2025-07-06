import { defaultRestaurantSettings } from '@/default-setting/defaultRestaurantSettings';
import type { OrderThrottlingSettings } from '@/lib/types';

// Data structure templates for initial setup
export const emptyDashboardStats = {
  todaySales: 0,
  todayOrders: 0,
  pendingOrders: 0,
  advanceOrders: 0,
  revenue: {
    weekly: [0, 0, 0, 0, 0, 0, 0],
  },
};

const defaultOrderThrottling: OrderThrottlingSettings = {
    monday:    { interval: 15, ordersPerInterval: 10, enabled: false },
    tuesday:   { interval: 15, ordersPerInterval: 10, enabled: false },
    wednesday: { interval: 15, ordersPerInterval: 10, enabled: false },
    thursday:  { interval: 15, ordersPerInterval: 10, enabled: false },
    friday:    { interval: 15, ordersPerInterval: 10, enabled: false },
    saturday:  { interval: 15, ordersPerInterval: 10, enabled: false },
    sunday:    { interval: 15, ordersPerInterval: 10, enabled: false },
};

// Default structure for new restaurants
export const defaultRestaurantData = defaultRestaurantSettings;
