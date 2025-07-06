import { defaultRestaurantSettings } from '@/default-setting/defaultRestaurantSettings';

// Mock data is now only used as a fallback or for initial seeding.
// The primary data source is the MariaDB database.

export const dashboardStats = {
  todaySales: 1250.75,
  todayOrders: 82,
  pendingOrders: 12,
  advanceOrders: 25,
  revenue: {
    weekly: [1100, 1300, 1500, 1200, 1800, 2100, 1900],
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

// This serves as a default structure if the database is unavailable.
export const mockRestaurantSettings = defaultRestaurantSettings;
