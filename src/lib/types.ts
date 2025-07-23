export interface Addon {
  id: string;
  name: string;
  price: number;
  type: 'size' | 'extra' | 'sauce' | 'sides' | 'drink' | 'dessert';
  required?: boolean; // Whether this addon is required
  multiple?: boolean; // Whether multiple selections are allowed
  maxSelections?: number; // Maximum number of selections (for multiple=true)
  options?: AddonOption[]; // For grouped addon options
}

export interface AddonOption {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export interface SetMenuItem {
  id: string;
  menuItemId: string;
  quantity: number;
  name: string; // For display purposes
  replaceable?: boolean; // Whether this item can be replaced with another
  replaceableWith?: string[]; // Array of category IDs that can replace this item
}

export type Characteristic = 
  | 'vegetarian' | 'vegan' | 'halal' | 'nut-free'
  | 'gluten-free' | 'dairy-free' | 'sugar-free' | 'with-stevia'
  | 'spicy-1' | 'spicy-2' | 'spicy-3' | 'frozen-ingredients'
  | 'celery' | 'wheat' | 'crustaceans' | 'eggs'
  | 'fish' | 'lupin' | 'dairy' | 'molluscs'
  | 'mustard' | 'nuts' | 'peanuts' | 'sesame'
  | 'soya' | 'sulphur-dioxide' | 'barley' | 'cinnamon' | 'citric-acid';

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string; // Changed from imageUrl to image for base64 storage
  imageHint?: string;
  available: boolean;
  categoryId: string;
  addons?: Addon[];
  characteristics?: Characteristic[];
  nutrition?: NutritionInfo;
  isSetMenu?: boolean; // Whether this is a set menu
  setMenuItems?: SetMenuItem[]; // Items included in set menu
  preparationTime?: number; // Time in minutes to prepare this item
  tags?: string[]; // Tags for better organization and search
}

export interface Category {
    id: string;
    name: string;
    active: boolean;
    order: number;
    parentId?: string; // For sub-categories
    image?: string; // Category image
    icon?: string; // Category icon
    color?: string; // Category color theme
}

export interface OrderItem extends MenuItem {
  orderItemId: string;
  quantity: number;
  selectedAddons: Addon[];
  specialInstructions?: string;
}


// New types for the admin panel orders
export interface PlacedOrderItem {
    id: string;
    quantity: number;
    menuItem: MenuItem; // Contains all menu item details
    selectedAddons: Addon[];
    specialInstructions?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface Order {
    id: string;
    orderNumber: string; // Auto-generated order number with prefix (e.g., "BIS-1234")
    createdAt: Date;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    address?: string;
    items: PlacedOrderItem[];
    total: number;
    status: OrderStatus;
    orderType: 'delivery' | 'pickup' | 'advance' | 'collection';
    isAdvanceOrder: boolean;
    scheduledTime?: Date;
    subtotal: number;
    deliveryFee: number;
    discount: number;
    tax: number;
    voucherCode?: string; // Used to store applied voucher from the admin panel
    printed: boolean;
    customerId?: string;
    paymentMethod: 'cash' | 'card' | 'voucher'; // Now supports voucher as a payment method
    paymentTransactionId?: string; // For storing payment gateway transaction reference
}

export interface Address {
    id: string;
    street: string;
    city: string;
    postcode: string;
    isDefault: boolean;
}

export interface Customer {
    id: string;
    tenant_id?: string; // For multi-tenant support
    name: string;
    email: string;
    phone?: string;
    password?: string; // Only for mock data simulation or authentication
    addresses?: Address[];
}


export interface DeliveryZone {
    id: string;
    name: string;
    type: 'postcode';
    postcodes: string[];
    deliveryFee: number;
    minOrder: number;
    deliveryTime: number; // in minutes
    collectionTime: number; // in minutes
}

export type PrinterType = 'kitchen' | 'receipt' | 'bar' | 'dot-matrix' | 'label' | 'kitchen-display';

export interface Printer {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  type: PrinterType;
  active: boolean;
  tenantId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastTestResult?: {
    success: boolean;
    message: string;
    testedAt: Date;
    responseTime?: number;
  };
}

export interface OpeningHoursPerDay {
  closed: boolean;
  timeMode: 'single' | 'split'; // New field to choose between single time or split morning/evening
  // Single time mode fields
  openTime?: string;
  closeTime?: string;
  // Split time mode fields (existing)
  morningOpen?: string;
  morningClose?: string;
  eveningOpen?: string;
  eveningClose?: string;
}

export interface OpeningHours {
  [key: string]: OpeningHoursPerDay;
  monday: OpeningHoursPerDay;
  tuesday: OpeningHoursPerDay;
  wednesday: OpeningHoursPerDay;
  thursday: OpeningHoursPerDay;
  friday: OpeningHoursPerDay;
  saturday: OpeningHoursPerDay;
  sunday: OpeningHoursPerDay;
}

export interface OrderThrottlingDaySettings {
  interval: number; // in minutes
  ordersPerInterval: number;
  enabled: boolean;
}

export interface OrderThrottlingSettings {
  [key: string]: OrderThrottlingDaySettings;
  monday: OrderThrottlingDaySettings;
  tuesday: OrderThrottlingDaySettings;
  wednesday: OrderThrottlingDaySettings;
  thursday: OrderThrottlingDaySettings;
  friday: OrderThrottlingDaySettings;
  saturday: OrderThrottlingDaySettings;
  sunday: OrderThrottlingDaySettings;
}

export interface PaymentGatewaySettings {
    enabled: boolean;
    apiKey?: string;
    apiSecret?: string;
    merchantId?: string;
    environment?: 'sandbox' | 'production';
    accountId?: string;
    appId?: string; // For Global Payments REST API
    appKey?: string; // For Global Payments REST API
    // Stripe-specific fields
    publishableKey?: string; // Stripe publishable key
    secretKey?: string; // Stripe secret key
    // Global Payments specific fields
    webhookSecret?: string; // For webhook signature verification
    // Worldpay-specific fields
    username?: string; // Worldpay username
    password?: string; // Worldpay password
    entity?: string; // Worldpay entity (default is 'default')
}

export interface PaymentSettings {
    cash: {
        enabled: boolean;
    };
    stripe: PaymentGatewaySettings;
    globalPayments: PaymentGatewaySettings;
    worldpay: PaymentGatewaySettings;
}

export interface ThemeSettings {
  primary: string;
  primaryForeground: string;
  background: string;
  accent: string;
}

export interface RestaurantSettings {
  name: string;
  description: string;
  logo?: string;
  logoHint?: string;
  coverImage?: string;
  coverImageHint?: string;
  favicon?: string;
  currency: string;
  taxRate: number; // as a decimal, e.g., 0.2 for 20%
  website?: string;
  openingHours: OpeningHours;
  orderThrottling: OrderThrottlingSettings;
  phone: string;
  email: string;
  address: string;
  paymentSettings: PaymentSettings;
  orderTypeSettings: {
    deliveryEnabled: boolean;
    advanceOrderEnabled: boolean;
    collectionEnabled: boolean;
  };
  collectionTimeSettings: {
    collectionTimeMinutes: number;
    enabled: boolean;
    displayMessage: string;
  };
  deliveryTimeSettings: {
    deliveryTimeMinutes: number;
    enabled: boolean;
    displayMessage: string;
  };
  theme: ThemeSettings;
}

export interface Voucher {
    id: string;
    code: string;
    type: 'percentage' | 'amount';
    value: number; // e.g., 10 for 10% or 10 for £10
    minOrder: number;
    maxDiscount?: number;
    expiryDate: Date;
    active: boolean;
    usageLimit?: number;
    usedCount: number;
}

// Multi-tenant types
export interface Tenant {
  id: string;
  slug: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status: 'active' | 'suspended' | 'trial' | 'cancelled';
  subscription_plan: 'starter' | 'professional' | 'enterprise';
  subscription_status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  trial_ends_at?: string;
  created_at: string;
  updated_at: string;
  
  // License information
  license_id?: string;
  license_expires_at?: string;
  license_status?: string;
  key_code?: string;
  duration_days?: number;
  isTrialActive?: boolean;
  trialDaysRemaining?: number;
  licenseDaysRemaining?: number;
  licenseStatus?: string;
  overallStatus?: string;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  email: string;
  password?: string; // Optional for security
  name: string;
  role: 'owner' | 'manager' | 'staff';
  permissions?: any;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SuperAdminUser {
  id: string;
  email: string;
  password?: string; // Optional for security
  name: string;
  role: 'super_admin' | 'support';
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantStats {
  totalOrders: number;
  todayOrders: number;
  advanceOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  totalCustomers: number;
}

export interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  totalRevenue: number;
  monthlyRevenue: number;
}
