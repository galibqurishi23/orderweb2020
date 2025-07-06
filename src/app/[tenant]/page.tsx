'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Clock, 
  MapPin,
  Phone,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useTenant } from '@/context/TenantContext';
import { CharacteristicsReference } from '@/components/CharacteristicsReference';

export default function TenantCustomerPage({ 
  params 
}: { 
  params: { tenant: string } 
}) {
  const { tenantData, isLoading } = useTenant();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading restaurant...</p>
        </div>
      </div>
    );
  }

  if (!tenantData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Restaurant Not Found</h1>
          <p className="text-gray-600">The restaurant "{params.tenant}" does not exist.</p>
          <Link href="/super-admin" className="text-blue-600 hover:underline mt-4 inline-block">
            Go to Super Admin
          </Link>
        </div>
      </div>
    );
  }

  // Mock menu data - in real app, this would be fetched for this specific tenant
  const featuredItems = [
    {
      id: 1,
      name: "Margherita Pizza",
      description: "Fresh tomatoes, mozzarella, and basil",
      price: 18.99,
      image: "/api/placeholder/300/200",
      characteristics: ['vegetarian']
    },
    {
      id: 2,
      name: "Pepperoni Special",
      description: "Classic pepperoni with extra cheese",
      price: 22.99,
      image: "/api/placeholder/300/200",
      characteristics: ['spicy-1']
    },
    {
      id: 3,
      name: "Vegan Delight",
      description: "Plant-based cheese and vegetables",
      price: 20.99,
      image: "/api/placeholder/300/200",
      characteristics: ['vegan', 'dairy-free']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {tenantData.settings?.logo ? (
                <img 
                  src={tenantData.settings.logo} 
                  alt={tenantData.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {tenantData.name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{tenantData.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>4.8 (324 reviews)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>25-40 min</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/${params.tenant}/admin`}>
                  <ExternalLink className="mr-2 w-4 h-4" />
                  Admin Panel
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Restaurant Info */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold mb-2">About {tenantData.name}</h2>
              <p className="text-gray-600 mb-4">
                Welcome to {tenantData.name}! We're dedicated to providing you with the best dining experience. 
                Our chefs use only the freshest ingredients to create delicious meals that you'll love.
              </p>
              <div className="flex space-x-4 text-sm">
                <Badge variant="outline">
                  {tenantData.plan} Plan
                </Badge>
                <Badge variant={tenantData.status === 'active' ? 'default' : 'secondary'}>
                  {tenantData.status}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Contact Information</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>123 Main Street, City, State 12345</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>(555) 123-4567</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Open: 11:00 AM - 10:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Items */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Items</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">Image Placeholder</span>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                
                {/* Characteristics */}
                {item.characteristics && item.characteristics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {/* This would use the characteristics reference component */}
                    {item.characteristics.map((char) => (
                      <Badge key={char} variant="outline" className="text-xs">
                        {char}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-primary">
                    ${item.price}
                  </span>
                  <Button size="sm">
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Coming Soon Notice */}
      <section className="container mx-auto px-4 py-8">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold text-blue-900 mb-2">Full Menu Coming Soon!</h3>
            <p className="text-blue-700 mb-4">
              This is a preview of your tenant-specific customer interface. 
              The full menu system with ordering capabilities will be integrated next.
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" asChild>
                <Link href={`/${params.tenant}/admin`}>
                  Go to Admin Panel
                </Link>
              </Button>
              <Button asChild>
                <Link href="/super-admin">
                  Super Admin Panel
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Characteristics Reference */}
      <CharacteristicsReference />
    </div>
  );
}
