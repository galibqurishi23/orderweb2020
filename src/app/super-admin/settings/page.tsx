'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SuperAdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-gray-600">Configure global platform settings</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Platform configuration settings will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
