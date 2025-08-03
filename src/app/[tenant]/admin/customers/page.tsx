'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Search, 
  Mail,
  Phone,
  Calendar,
  Gift,
  ShoppingBag,
  CreditCard,
  Plus,
  UserPlus,
  Star,
  Trash2,
  AlertTriangle,
  FileText
} from "lucide-react";
import { useTenant } from '@/context/TenantContext';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  total_orders: number;
  total_spent: number;
  points_balance?: number;
  tier_level?: string;
  created_at: string;
  last_order_date?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getTierIcon = (tier?: string) => {
  switch (tier?.toLowerCase()) {
    case 'bronze':
      return <span className="text-amber-600">🥉</span>;
    case 'silver':
      return <span className="text-gray-500">🥈</span>;
    case 'gold':
      return <span className="text-yellow-500">🥇</span>;
    case 'platinum':
      return <span className="text-purple-600">💎</span>;
    default:
      return <span className="text-gray-400">⭐</span>;
  }
};

const getTierColor = (tier?: string) => {
  switch (tier?.toLowerCase()) {
    case 'bronze':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'silver':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'gold':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'platinum':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function CustomersPage() {
  const { tenantData } = useTenant();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingCustomerId, setDeletingCustomerId] = useState<number | null>(null);

  useEffect(() => {
    if (tenantData) {
      fetchCustomers();
    }
  }, [tenantData]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`/api/admin/customers?tenantId=${tenantData?.id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.customers) {
        // Ensure customers have required fields with defaults
        const safeCustomers = data.customers.map((customer: any) => ({
          ...customer,
          name: customer.name || 'Unknown Customer',
          email: customer.email || '',
          phone: customer.phone || '',
          total_orders: customer.total_orders || 0,
          total_spent: customer.total_spent || 0,
          points_balance: customer.points_balance || 0,
          tier_level: customer.tier_level || 'bronze'
        }));
        setCustomers(safeCustomers);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (customerId: number, customerName: string) => {
    if (!confirm(`Are you sure you want to delete customer "${customerName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingCustomerId(customerId);
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId: tenantData?.id }),
      });

      if (response.ok) {
        // Remove customer from local state
        setCustomers(customers.filter(customer => customer.id !== customerId));
        alert(`Customer "${customerName}" has been deleted successfully.`);
      } else {
        const error = await response.json();
        alert(`Failed to delete customer: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Failed to delete customer. Please try again.');
    } finally {
      setDeletingCustomerId(null);
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone'];
    
    const csvData = filteredCustomers.map(customer => [
      customer.name || '',
      customer.email || '',
      customer.phone || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `customers-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower)
    );
  });

  const totalCustomers = customers.length;
  const newCustomersThisMonth = customers.filter(customer => {
    const created = new Date(customer.created_at);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-2">Manage your customer database and contact information</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={exportToCSV}>
            <FileText className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{totalCustomers.toLocaleString()}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New This Month</p>
                <p className="text-2xl font-bold text-gray-900">{newCustomersThisMonth.toLocaleString()}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Customer List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div>
              <CardTitle>Customer List</CardTitle>
              <CardDescription>
                All customers who have signed up through your website
              </CardDescription>
            </div>
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    {/* Customer Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                        {customer.tier_level && (
                          <Badge className={`${getTierColor(customer.tier_level)} border`}>
                            <span className="flex items-center space-x-1">
                              {getTierIcon(customer.tier_level)}
                              <span className="capitalize">{customer.tier_level}</span>
                            </span>
                          </Badge>
                        )}
                      </div>
                      
                      {/* Contact Info */}
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-1">
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
                      
                      {/* Stats */}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <ShoppingBag className="w-3 h-3" />
                          <span>{customer.total_orders || 0} orders</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <CreditCard className="w-3 h-3" />
                          <span>{formatCurrency(customer.total_spent || 0)} spent</span>
                        </span>
                        {customer.points_balance !== undefined && customer.points_balance > 0 && (
                          <span className="flex items-center space-x-1">
                            <Gift className="w-3 h-3" />
                            <span>{customer.points_balance} points</span>
                          </span>
                        )}
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Joined {formatDate(customer.created_at)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteCustomer(customer.id, customer.name)}
                      disabled={deletingCustomerId === customer.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      {deletingCustomerId === customer.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-1" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No customers found' : 'No customers yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? 'Try adjusting your search terms' 
                    : 'Customer signups will appear here automatically'
                  }
                </p>
                {!searchTerm && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-blue-700 text-sm">
                      <strong>💡 Tip:</strong> When customers sign up through your website, 
                      their details will automatically appear here with their contact information 
                      and loyalty points.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
