'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Store, 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink,
  AlertCircle,
  Loader2,
  Calendar,
  Mail,
  Phone
} from "lucide-react";
import Link from 'next/link';
import type { Tenant } from '@/lib/types';

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    ownerName: '',
    ownerPassword: ''
  });

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await fetch('/api/super-admin/tenants');
      const result = await response.json();
      
      if (result.success) {
        setRestaurants(result.data);
      } else {
        setError(result.error || 'Failed to fetch restaurants');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching restaurants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch('/api/super-admin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        await fetchRestaurants(); // Refresh the list
        setShowCreateDialog(false);
        setFormData({
          name: '',
          slug: '',
          email: '',
          phone: '',
          address: '',
          ownerName: '',
          ownerPassword: ''
        });
      } else {
        setError(result.error || 'Failed to create restaurant');
      }
    } catch (err) {
      setError('Failed to create restaurant');
      console.error('Error creating restaurant:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const updateTenantStatus = async (tenantId: string, status: string) => {
    try {
      const response = await fetch(`/api/super-admin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchRestaurants(); // Refresh the list
      } else {
        setError(result.error || 'Failed to update restaurant status');
      }
    } catch (err) {
      setError('Failed to update restaurant status');
      console.error('Error updating restaurant status:', err);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Restaurants</h1>
          <p className="text-muted-foreground">
            Manage all restaurants on your platform
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Restaurant
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Restaurant</DialogTitle>
              <DialogDescription>
                Add a new restaurant to your platform. An owner account will be created automatically.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateRestaurant} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Mario's Pizza"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="e.g., marios-pizza"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    URL: yoursite.com/{formData.slug}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Restaurant Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@restaurant.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main St, City, State 12345"
                  rows={2}
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Owner Account</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Owner Name</Label>
                    <Input
                      id="ownerName"
                      value={formData.ownerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerPassword">Password</Label>
                    <Input
                      id="ownerPassword"
                      type="password"
                      value={formData.ownerPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownerPassword: e.target.value }))}
                      placeholder="Secure password"
                      required
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Restaurant'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Message */}
      {error && !showCreateDialog && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Restaurants List */}
      {restaurants.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Store className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No restaurants yet</h3>
              <p className="text-muted-foreground max-w-sm mb-4">
                Create your first restaurant to start building your platform.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Restaurant
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => (
            <Card key={restaurant.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{restaurant.name}</CardTitle>
                  <Badge className={getStatusColor(restaurant.status)}>
                    {restaurant.status}
                  </Badge>
                </div>
                <CardDescription>
                  /{restaurant.slug}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{restaurant.email}</span>
                  </div>
                  {restaurant.phone && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{restaurant.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(restaurant.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{restaurant.subscription_plan}</Badge>
                  <Badge variant={restaurant.subscription_status === 'active' ? 'default' : 'secondary'}>
                    {restaurant.subscription_status}
                  </Badge>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Link href={`/${restaurant.slug}`} target="_blank">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                <div className="flex space-x-2 pt-2">
                  {restaurant.status !== 'active' && (
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => updateTenantStatus(restaurant.id, 'active')}
                    >
                      Activate
                    </Button>
                  )}
                  {restaurant.status === 'active' && (
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => updateTenantStatus(restaurant.id, 'suspended')}
                    >
                      Suspend
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
