import type { RestaurantSettings } from '@/lib/types';

export const defaultRestaurantSettings: RestaurantSettings = {
  name: 'My Restaurant',
  description: 'A great place to dine',
  address: '123 Main Street, City',
  phone: '+1234567890',
  email: 'contact@restaurant.com',
  currency: 'USD',
  taxRate: 0.10,
  orderPrefix: 'ORD',
  advanceOrderPrefix: 'ADV',
  openingHours: {
    monday: { closed: false, timeMode: 'single', openTime: '09:00', closeTime: '22:00' },
    tuesday: { closed: false, timeMode: 'single', openTime: '09:00', closeTime: '22:00' },
    wednesday: { closed: false, timeMode: 'single', openTime: '09:00', closeTime: '22:00' },
    thursday: { closed: false, timeMode: 'single', openTime: '09:00', closeTime: '22:00' },
    friday: { closed: false, timeMode: 'single', openTime: '09:00', closeTime: '23:00' },
    saturday: { closed: false, timeMode: 'single', openTime: '10:00', closeTime: '23:00' },
    sunday: { closed: false, timeMode: 'single', openTime: '10:00', closeTime: '21:00' }
  },
  orderThrottling: {
    monday: { interval: 15, ordersPerInterval: 10, enabled: false },
    tuesday: { interval: 15, ordersPerInterval: 10, enabled: false },
    wednesday: { interval: 15, ordersPerInterval: 10, enabled: false },
    thursday: { interval: 15, ordersPerInterval: 10, enabled: false },
    friday: { interval: 15, ordersPerInterval: 10, enabled: false },
    saturday: { interval: 15, ordersPerInterval: 10, enabled: false },
    sunday: { interval: 15, ordersPerInterval: 10, enabled: false }
  },
  paymentSettings: {
    cash: { enabled: true },
    stripe: { enabled: false, apiKey: '', apiSecret: '' },
    globalPayments: { enabled: false, merchantId: '', apiSecret: '' },
    worldpay: { enabled: false, apiKey: '', merchantId: '' }
  },
  orderTypeSettings: {
    deliveryEnabled: true,
    advanceOrderEnabled: true,
    collectionEnabled: true
  },
  theme: {
    primary: '224 82% 57%',
    primaryForeground: '210 40% 98%',
    background: '210 40% 98%',
    accent: '210 40% 94%'
  }
};
