'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Store, 
  ExternalLink, 
  Eye, 
  Settings, 
  Copy,
  Check
} from 'lucide-react';

interface Restaurant {
  id: number;
  name: string;
  slug: string;
  ownerEmail: string;
  status: 'active' | 'pending' | 'inactive';
  plan: 'basic' | 'premium' | 'enterprise';
  createdAt: string;
  orders: number;
  revenue: number;
}

export default function RestaurantManagement() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
  // Restaurant data will be fetched from database in production
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    ownerEmail: '',
    plan: 'basic',
    description: ''
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleCreateRestaurant = () => {
    if (!newRestaurant.name || !newRestaurant.ownerEmail) {
      toast({
        title: "Missing Information",
        description: "Please provide restaurant name and owner email.",
        variant: "destructive",
      });
      return;
    }

    const slug = generateSlug(newRestaurant.name);
    
    // Check if slug already exists
    if (restaurants.some(r => r.slug === slug)) {
      toast({
        title: "Name Already Exists",
        description: "A restaurant with this name already exists. Please choose a different name.",
        variant: "destructive",
      });
      return;
    }

    const restaurant: Restaurant = {
      id: Date.now(),
      name: newRestaurant.name,
      slug,
      ownerEmail: newRestaurant.ownerEmail,
      status: 'pending',
      plan: newRestaurant.plan as 'basic' | 'premium' | 'enterprise',
      createdAt: new Date().toISOString().split('T')[0],
      orders: 0,
      revenue: 0
    };

    setRestaurants([restaurant, ...restaurants]);
    setNewRestaurant({ name: '', ownerEmail: '', plan: 'basic', description: '' });
    setIsCreateDialogOpen(false);

    toast({
      title: "Restaurant Created!",
      description: `${restaurant.name} has been created successfully. Links are ready to share.`,
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(label);
    setTimeout(() => setCopiedLink(null), 2000);
    
    toast({
      title: "Link Copied!",
      description: `${label} link copied to clipboard.`,
    });
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-gold-100 text-gold-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restaurant Management</h1>
          <p className="text-gray-600">Create and manage restaurants on your platform</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Restaurant
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Restaurant</DialogTitle>
              <DialogDescription>
                Set up a new restaurant with admin panel and customer interface
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="restaurantName">Restaurant Name</Label>
                  <Input
                    id="restaurantName"
                    value={newRestaurant.name}
                    onChange={(e) => setNewRestaurant({...newRestaurant, name: e.target.value})}
                    placeholder="e.g., Mario's Pizza"
                  />
                  {newRestaurant.name && (
                    <p className="text-xs text-gray-500 mt-1">
                      URL: /{generateSlug(newRestaurant.name)}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="ownerEmail">Owner Email</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    value={newRestaurant.ownerEmail}
                    onChange={(e) => setNewRestaurant({...newRestaurant, ownerEmail: e.target.value})}
                    placeholder="owner@restaurant.com"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="plan">Subscription Plan</Label>
                <Select 
                  value={newRestaurant.plan} 
                  onValueChange={(value) => setNewRestaurant({...newRestaurant, plan: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic Plan (£29/month)</SelectItem>
                    <SelectItem value="premium">Premium Plan (£79/month)</SelectItem>
                    <SelectItem value="enterprise">Enterprise Plan (£199/month)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newRestaurant.description}
                  onChange={(e) => setNewRestaurant({...newRestaurant, description: e.target.value})}
                  placeholder="Brief description of the restaurant..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRestaurant}>
                Create Restaurant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{restaurants.length}</div>
            <p className="text-sm text-gray-600">Total Restaurants</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {restaurants.filter(r => r.status === 'active').length}
            </div>
            <p className="text-sm text-gray-600">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {restaurants.filter(r => r.status === 'pending').length}
            </div>
            <p className="text-sm text-gray-600">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {restaurants.reduce((sum, r) => sum + r.revenue, 0).toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Total Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Restaurants List */}
      <Card>
        <CardHeader>
          <CardTitle>All Restaurants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {restaurants.length === 0 ? (
              <div className="text-center py-12">
                <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No restaurants yet</h3>
                <p className="text-gray-500 mb-6">Create your first restaurant to start building your platform</p>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Restaurant
                </Button>
              </div>
            ) : (
              restaurants.map((restaurant) => (
                <div key={restaurant.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  {/* ...existing restaurant content... */}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
