'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ChefHat, 
  MapPin, 
  BarChart3, 
  Settings,
  LogOut,
  Printer,
  Tag,
  Clock,
  CreditCard,
  Network
} from 'lucide-react';
import { DineDeskLogo } from '@/components/icons/logo';
import AdminLogo from '@/components/icons/admin-logo';
import { cn } from '@/lib/utils';
import { DataProvider } from '@/context/DataContext';

const navItems = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/orders', icon: ShoppingBag, label: 'All Order' },
    { href: '/admin/advance-orders', icon: Clock, label: 'Advance Orders' },
    { href: '/admin/menu', icon: ChefHat, label: 'Menu' },
    { href: '/admin/vouchers', icon: Tag, label: 'Vouchers' },
    { href: '/admin/zones', icon: MapPin, label: 'Order Zones' },
    { href: '/admin/printers', icon: Printer, label: 'Printers' },
    { href: '/admin/payments', icon: CreditCard, label: 'Payments' },
    { href: '/admin/connect-pos', icon: Network, label: 'Connect POS' },
    { href: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' }
];

export default function AdminLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
  const pathname = usePathname();
  const { restaurantSettings } = require('@/context/DataContext').useData();

  if (pathname === '/admin') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="w-64 bg-card shadow-lg border-r border-border flex flex-col">
        <div className="p-6 border-b border-border flex flex-col items-start space-y-2">
          <div className="flex items-center space-x-3 w-full">
            {/* Use uploaded logo if available, else show AdminLogo */}
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
              {restaurantSettings?.logo ? (
                <img src={restaurantSettings.logo} alt={restaurantSettings.name} className="w-10 h-10 object-cover rounded-xl" />
              ) : (
                <AdminLogo className="w-8 h-8" />
              )}
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-800 bg-clip-text text-transparent">
              Admin Panel
            </span>
          </div>
          {/* Logout button directly under Admin Panel */}
          <Link
            href="/admin"
            className="flex items-center space-x-2 text-foreground hover:text-destructive transition-colors px-4 py-2 rounded-md border border-border bg-card shadow mt-2"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Link>
        </div>

        <nav className="mt-6 flex-grow">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                    'flex items-center space-x-3 px-6 py-4 text-left hover:bg-muted hover:text-primary transition-all duration-200',
                    isActive ? 'bg-gradient-to-r from-muted to-background text-primary border-r-4 border-primary font-bold' : 'text-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <main className="h-full overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
