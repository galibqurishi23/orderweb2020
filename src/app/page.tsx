'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DineDeskLogo } from '@/components/icons/logo';
import { User, Shield } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex items-center gap-2 text-center">
        <DineDeskLogo className="h-12 w-12 text-primary" />
        <h1 className="font-headline text-5xl font-bold text-foreground">
          Welcome to DineDesk
        </h1>
      </div>
      <p className="mb-12 max-w-2xl text-center text-lg text-muted-foreground">
        Your seamless restaurant ordering experience. Please select your role to continue.
      </p>
      <div className="grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
        <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 font-headline text-2xl">
              <User className="h-7 w-7 text-primary" />
              Customer
            </CardTitle>
            <CardDescription>
              Browse the menu, place an order, and enjoy our delicious food.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/customer" passHref>
              <Button className="w-full font-headline" size="lg">
                Go to Menu
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 font-headline text-2xl">
              <Shield className="h-7 w-7 text-primary" />
              Administrator
            </CardTitle>
            <CardDescription>
              Manage orders, update the menu, and view restaurant analytics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin" passHref>
              <Button className="w-full font-headline" size="lg">
                Admin Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
