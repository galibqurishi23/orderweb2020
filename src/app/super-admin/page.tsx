'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Lock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SuperAdminLogin() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual authentication
    // For now, just redirect to dashboard
    router.push('/super-admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Crown className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Super Admin Portal
          </CardTitle>
          <p className="text-gray-600 text-sm">Platform Management Access</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email Address</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@platform.com"
                  value={credentials.email}
                  onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                  className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2.5 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Access Platform
            </Button>
          </form>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Platform Administrator Access Only
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
