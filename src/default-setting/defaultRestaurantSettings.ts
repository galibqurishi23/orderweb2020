// This file contains all default settings for the application.
// You can import and use these settings anywhere in your project.

export const defaultRestaurantSettings = {
  name: 'Order Web Restaurant',
  description: 'A cozy spot serving modern European cuisine with a twist.',
  logo: 'https://placehold.co/200x200.png',
  logoHint: 'restaurant logo',
  coverImage: 'https://placehold.co/1600x400.png',
  coverImageHint: 'restaurant interior',
  currency: 'GBP',
  taxRate: 0.2,
  website: 'https://www.dinedesk.com',
  phone: '0123 456 7890',
  email: 'contact@dinedesk.com',
  address: '123 Culinary Lane, London, W1A 1AA, United Kingdom',
  orderPrefix: 'ORD',
  advanceOrderPrefix: 'ADV',
  openingHours: {
    monday: { timeMode: 'split', morningOpen: '09:00', morningClose: '14:00', eveningOpen: '17:00', eveningClose: '22:00', closed: false },
    tuesday: { timeMode: 'split', morningOpen: '09:00', morningClose: '14:00', eveningOpen: '17:00', eveningClose: '22:00', closed: false },
    wednesday: { timeMode: 'split', morningOpen: '09:00', morningClose: '14:00', eveningOpen: '17:00', eveningClose: '22:00', closed: false },
    thursday: { timeMode: 'split', morningOpen: '09:00', morningClose: '14:00', eveningOpen: '17:00', eveningClose: '22:00', closed: false },
    friday: { timeMode: 'split', morningOpen: '09:00', morningClose: '14:00', eveningOpen: '17:00', eveningClose: '23:00', closed: false },
    saturday: { timeMode: 'split', morningOpen: '10:00', morningClose: '15:00', eveningOpen: '17:00', eveningClose: '23:00', closed: false },
    sunday: { timeMode: 'split', morningOpen: '11:00', morningClose: '16:00', eveningOpen: '', eveningClose: '', closed: false }
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
