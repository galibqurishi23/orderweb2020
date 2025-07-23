'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Search, 
  Filter, 
  Star, 
  Gift,
  Phone,
  Mail,
  MapPin,
  Calendar,
  TrendingUp,
  Award,
  MessageSquare,
  Heart,
  Crown,
  Sparkles,
  Target,
  BarChart3,
  Plus,
  Edit,
  Eye,
  Send
} from "lucide-react";
import { useTenant } from '@/context/TenantContext';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  customer_segment: string;
  marketing_consent: boolean;
  last_order_date?: string;
  total_orders: number;
  total_spent: number;
  average_order_value: number;
  points_balance?: number;
  tier_level?: string;
  created_at: string;
}

interface LoyaltyStats {
  totalCustomers: number;
  activeMembers: number;
  averagePoints: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  tierDistribution: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
}

const TIER_COLORS = {
  bronze: 'bg-amber-100 text-amber-800',
  silver: 'bg-gray-100 text-gray-800',
  gold: 'bg-yellow-100 text-yellow-800',
  platinum: 'bg-purple-100 text-purple-800'
};

const SEGMENT_COLORS = {
  new: 'bg-green-100 text-green-800',
  regular: 'bg-blue-100 text-blue-800',
  vip: 'bg-purple-100 text-purple-800',
  inactive: 'bg-gray-100 text-gray-800'
};

export default function CustomerCRMPage() {
  const { tenantData } = useTenant();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loyaltyStats, setLoyaltyStats] = useState<LoyaltyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSegment, setFilterSegment] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  useEffect(() => {
    if (tenantData) {
      fetchCustomers();
      fetchLoyaltyStats();
    }
  }, [tenantData]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`/api/tenant/crm/customers?tenantId=${tenantData?.id}`);
      const data = await response.json();
      if (data.success) {
        // Ensure customers have required fields with defaults
        const safeCustomers = (data.customers || []).map((customer: any) => ({
          ...customer,
          name: customer.name || 'Unknown',
          email: customer.email || '',
          phone: customer.phone || '',
          customer_segment: customer.customer_segment || 'regular',
          tier_level: customer.tier_level || 'bronze',
          total_orders: customer.total_orders || 0,
          total_spent: customer.total_spent || 0,
          average_order_value: customer.average_order_value || 0,
          points_balance: customer.points_balance || 0
        }));
        setCustomers(safeCustomers);
      } else {
        console.error('Failed to fetch customers:', data.error);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    }
  };

  const fetchLoyaltyStats = async () => {
    try {
      const response = await fetch(`/api/tenant/crm/loyalty-stats?tenantId=${tenantData?.id}`);
      const data = await response.json();
      if (data.success) {
        setLoyaltyStats(data.stats);
      } else {
        console.error('Failed to fetch loyalty stats:', data.error);
        // Set default stats to prevent UI errors
        setLoyaltyStats({
          totalCustomers: 0,
          activeMembers: 0,
          averagePoints: 0,
          totalPointsIssued: 0,
          totalPointsRedeemed: 0,
          tierDistribution: { bronze: 0, silver: 0, gold: 0, platinum: 0 }
        });
      }
    } catch (error) {
      console.error('Error fetching loyalty stats:', error);
      // Set default stats to prevent UI errors
      setLoyaltyStats({
        totalCustomers: 0,
        activeMembers: 0,
        averagePoints: 0,
        totalPointsIssued: 0,
        totalPointsRedeemed: 0,
        tierDistribution: { bronze: 0, silver: 0, gold: 0, platinum: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    // Safe search with null checks
    const nameMatch = customer.name ? customer.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const emailMatch = customer.email ? customer.email.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const phoneMatch = customer.phone ? customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    
    const matchesSearch = nameMatch || emailMatch || phoneMatch;
    const matchesSegment = filterSegment === 'all' || customer.customer_segment === filterSegment;
    const matchesTier = filterTier === 'all' || customer.tier_level === filterTier;
    
    return matchesSearch && matchesSegment && matchesTier;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze': return <Award className="w-4 h-4 text-amber-600" />;
      case 'silver': return <Award className="w-4 h-4 text-gray-600" />;
      case 'gold': return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'platinum': return <Sparkles className="w-4 h-4 text-purple-600" />;
      default: return <Award className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Relationship Management</h1>
          <p className="text-gray-600 mt-2">Manage your customers and loyalty program</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats Cards */}
      {loyaltyStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loyaltyStats.totalCustomers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Loyalty Members</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loyaltyStats.activeMembers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((loyaltyStats.activeMembers / loyaltyStats.totalCustomers) * 100)}% participation rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Points Balance</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(loyaltyStats.averagePoints).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(loyaltyStats.averagePoints * 0.01)} value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points Issued</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loyaltyStats.totalPointsIssued.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {loyaltyStats.totalPointsRedeemed.toLocaleString()} redeemed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="customers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="customers" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Customers</span>
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="flex items-center space-x-2">
            <Award className="w-4 h-4" />
            <span>Loyalty Program</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Marketing</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search customers by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={filterSegment} onValueChange={setFilterSegment}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Segment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Segments</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterTier} onValueChange={setFilterTier}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="bronze">Bronze</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer List */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Database ({filteredCustomers.length})</CardTitle>
              <CardDescription>
                Manage your customer relationships and track their loyalty journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCustomers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {(customer.name || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{customer.name || 'Unknown Customer'}</h3>
                          <Badge className={SEGMENT_COLORS[customer.customer_segment as keyof typeof SEGMENT_COLORS] || 'bg-gray-100 text-gray-800'}>
                            {customer.customer_segment || 'regular'}
                          </Badge>
                          {customer.tier_level && (
                            <Badge className={TIER_COLORS[customer.tier_level as keyof typeof TIER_COLORS] || 'bg-gray-100 text-gray-800'}>
                              <span className="flex items-center space-x-1">
                                {getTierIcon(customer.tier_level)}
                                <span>{customer.tier_level}</span>
                              </span>
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          {customer.email && (
                            <span className="flex items-center space-x-1">
                              <Mail className="w-3 h-3" />
                              <span>{customer.email}</span>
                            </span>
                          )}
                          {customer.phone && (
                            <span className="flex items-center space-x-1">
                              <Phone className="w-3 h-3" />
                              <span>{customer.phone}</span>
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>{customer.total_orders || 0} orders</span>
                          <span>{formatCurrency(customer.total_spent || 0)} spent</span>
                          <span>Avg: {formatCurrency(customer.average_order_value || 0)}</span>
                          {customer.points_balance !== undefined && customer.points_balance > 0 && (
                            <span className="flex items-center space-x-1">
                              <Gift className="w-3 h-3" />
                              <span>{customer.points_balance} points</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Send className="w-4 h-4 mr-1" />
                        Contact
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
                
                {filteredCustomers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                    <p className="text-gray-600">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loyalty Program Tab */}
        <TabsContent value="loyalty" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Loyalty Program Configuration</CardTitle>
              <CardDescription>
                Configure your customer loyalty program settings and tiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loyalty Program Settings</h3>
                <p className="text-gray-600 mb-4">Configure points, tiers, and rewards</p>
                <Button>Configure Loyalty Program</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marketing Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Marketing Campaigns</CardTitle>
              <CardDescription>
                Create and manage targeted marketing campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Marketing Campaigns</h3>
                <p className="text-gray-600 mb-4">Send targeted emails and SMS to your customers</p>
                <Button>Create Campaign</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Analytics</CardTitle>
              <CardDescription>
                Analyze customer behavior and loyalty program performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Analytics</h3>
                <p className="text-gray-600 mb-4">Deep insights into customer behavior and preferences</p>
                <Button>View Analytics</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
