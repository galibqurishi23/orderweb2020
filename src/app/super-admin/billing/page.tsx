'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BillingManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Subscriptions</h1>
        <p className="text-gray-600">Manage restaurant subscriptions and billing</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Billing and subscription management features will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
