'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  ShoppingBag, 
  Star, 
  MapPin,
  LogOut,
  Gift,
  Award,
  History,
  CreditCard,
  Sparkles,
  Crown,
  TrendingUp,
  Calendar,
  Phone,
  Mail
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  customer_segment: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
}

interface LoyaltyData {
  points_balance: number;
  tier_level: string;
  total_points_earned: number;
  total_points_redeemed: number;
  next_tier_points: number;
}

interface RecentOrder {
  id: string;
  total: number;
  status: string;
  created_at: string;
  items_count: number;
}

const TIER_COLORS = {
  bronze: 'bg-amber-100 text-amber-800 border-amber-200',
  silver: 'bg-gray-100 text-gray-800 border-gray-200',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  platinum: 'bg-purple-100 text-purple-800 border-purple-200'
};

const TIER_ICONS = {
  bronze: Award,
  silver: Award,
  gold: Crown,
  platinum: Sparkles
};

export default function CustomerDashboard({ params }: { params: Promise<{ tenant: string }> }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantName, setTenantName] = useState('');

  useEffect(() => {
    checkAuthentication();
    fetchTenantInfo();
  }, []);

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/customer/auth/logout', {
        method: 'GET'
      });
      const data = await response.json();

      if (!data.authenticated) {
        router.push(`/${resolvedParams.tenant}`);
        return;
      }

      setCustomer(data.customer);
      await fetchDashboardData(data.customer.id);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push(`/${resolvedParams.tenant}`);
    }
  };

  const fetchTenantInfo = async () => {
    try {
      const response = await fetch(`/api/tenant/info?tenantId=${resolvedParams.tenant}`);
      const data = await response.json();
      if (data.success) {
        setTenantName(data.tenant.name);
      }
    } catch (error) {
      console.error('Failed to fetch tenant info:', error);
    }
  };

  const fetchDashboardData = async (customerId: string) => {
    try {
      // Fetch loyalty data
      const loyaltyResponse = await fetch(`/api/customer/loyalty?customerId=${customerId}&tenantId=${resolvedParams.tenant}`);
      const loyaltyData = await loyaltyResponse.json();
      if (loyaltyData.success) {
        setLoyaltyData(loyaltyData.loyalty);
      }

      // Fetch recent orders (last 5)
      const ordersResponse = await fetch(`/api/customer/orders?customerId=${customerId}&tenantId=${resolvedParams.tenant}&limit=5`);
      const ordersData = await ordersResponse.json();
      if (ordersData.success) {
        setRecentOrders(ordersData.orders);
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/customer/auth/logout', {
        method: 'POST'
      });
      router.push(`/${resolvedParams.tenant}`);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTierIcon = (tier: string) => {
    const IconComponent = TIER_ICONS[tier as keyof typeof TIER_ICONS] || Award;
    return IconComponent;
  };

  const getTierProgress = () => {
    if (!loyaltyData) return 0;
    
    const tierThresholds = { bronze: 0, silver: 500, gold: 1500, platinum: 3000 };
    const currentTier = loyaltyData.tier_level as keyof typeof tierThresholds;
    const currentThreshold = tierThresholds[currentTier];
    const nextTier = currentTier === 'platinum' ? 'platinum' : 
                    currentTier === 'gold' ? 'platinum' :
                    currentTier === 'silver' ? 'gold' : 'silver';
    const nextThreshold = tierThresholds[nextTier as keyof typeof tierThresholds];
    
    if (currentTier === 'platinum') return 100;
    
    const progress = ((loyaltyData.total_points_earned - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">Please log in to access your account</p>
          <Link href={`/${resolvedParams.tenant}`}>
            <Button>Go to Restaurant</Button>
          </Link>
        </div>
      </div>
    );
  }

  const TierIcon = getTierIcon(loyaltyData?.tier_level || 'bronze');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href={`/${resolvedParams.tenant}`} className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                Back to Menu
              </Link>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">My Account</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-lg font-semibold text-blue-600">
                {tenantName || 'Restaurant'}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout} className="hover:bg-blue-50 hover:text-blue-600 border-blue-200">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {customer.name}!</h1>
          <p className="text-gray-600">Manage your orders, profile, and loyalty rewards</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Loyalty Status */}
          <Card className={`border-2 ${TIER_COLORS[loyaltyData?.tier_level as keyof typeof TIER_COLORS] || 'border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loyalty Status</CardTitle>
              <TierIcon className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {loyaltyData?.tier_level || 'Bronze'}
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getTierProgress()}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600">{Math.round(getTierProgress())}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Points Balance */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Points Balance</CardTitle>
              <Gift className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{loyaltyData?.points_balance?.toLocaleString() || 0}</div>
              <p className="text-xs text-blue-600">
                Worth {formatCurrency((loyaltyData?.points_balance || 0) * 0.01)}
              </p>
            </CardContent>
          </Card>

          {/* Total Orders */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{customer.total_orders}</div>
              <p className="text-xs text-green-600">
                Since {formatDate(customer.created_at)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <Card className="border-blue-200">
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center space-x-2 text-blue-800">
                  <History className="w-5 h-5 text-blue-600" />
                  <span>Recent Orders</span>
                </CardTitle>
                <CardDescription className="text-blue-600">Your latest orders from the past 3 months</CardDescription>
              </CardHeader>
              <CardContent className="bg-white">
                {recentOrders.length > 0 ? (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Order #{order.id.slice(-8)}</p>
                            <p className="text-sm text-blue-600">{order.items_count} items • {formatDate(order.created_at)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-blue-600">{formatCurrency(order.total)}</p>
                          <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className={order.status === 'completed' ? 'bg-green-100 text-green-800' : ''}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingBag className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-blue-600 mb-4">Start exploring our menu and place your first order!</p>
                    <Link href={`/${resolvedParams.tenant}`}>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">Browse Menu</Button>
                    </Link>
                  </div>
                )}
                
                {recentOrders.length > 0 && (
                  <div className="mt-6 text-center">
                    <Link href={`/${resolvedParams.tenant}/customer/orders`}>
                      <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">View All Orders</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Account Navigation */}
            <Card className="border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-800">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 bg-white">
                <Link href={`/${resolvedParams.tenant}/customer/orders`}>
                  <Button variant="outline" className="w-full justify-start border-blue-200 text-blue-600 hover:bg-blue-50">
                    <History className="w-4 h-4 mr-2" />
                    Order History
                  </Button>
                </Link>
                <Link href={`/${resolvedParams.tenant}/customer/profile`}>
                  <Button variant="outline" className="w-full justify-start border-blue-200 text-blue-600 hover:bg-blue-50">
                    <User className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
                <Link href={`/${resolvedParams.tenant}/customer/addresses`}>
                  <Button variant="outline" className="w-full justify-start border-blue-200 text-blue-600 hover:bg-blue-50">
                    <MapPin className="w-4 h-4 mr-2" />
                    Delivery Addresses
                  </Button>
                </Link>
                <Link href={`/${resolvedParams.tenant}/customer/loyalty`}>
                  <Button variant="outline" className="w-full justify-start border-green-200 text-green-600 hover:bg-green-50">
                    <Gift className="w-4 h-4 mr-2" />
                    Loyalty Points
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Loyalty Insights */}
            {loyaltyData && (
              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="flex items-center space-x-2 text-green-800">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span>Loyalty Insights</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 bg-white">
                  <div>
                    <p className="text-sm text-green-600">Points Earned</p>
                    <p className="text-2xl font-bold text-green-600">{loyaltyData.total_points_earned.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Points Redeemed</p>
                    <p className="text-2xl font-bold text-blue-600">{loyaltyData.total_points_redeemed.toLocaleString()}</p>
                  </div>
                  {loyaltyData.tier_level !== 'platinum' && (
                    <div>
                      <p className="text-sm text-blue-600">Points to Next Tier</p>
                      <p className="text-lg font-semibold text-blue-600">{loyaltyData.next_tier_points - loyaltyData.total_points_earned}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
