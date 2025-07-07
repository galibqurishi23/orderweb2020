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
  Network,
  Wheat
} from 'lucide-react';
import { DineDeskLogo } from '@/components/icons/logo';
import AdminLogo from '@/components/icons/admin-logo';
import { cn } from '@/lib/utils';
import { useTenant } from '@/context/TenantContext';

export default function TenantAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { tenantData, isLoading } = useTenant();
  
  // Extract tenant from pathname to avoid async params issue
  const tenant = pathname.split('/')[1];
  
  // Navigation items with tenant-aware paths
  const navItems = [
    { href: `/${tenant}/admin/dashboard`, icon: LayoutDashboard, label: 'Dashboard' },
    { href: `/${tenant}/admin/orders`, icon: ShoppingBag, label: 'All Orders' },
    { href: `/${tenant}/admin/advance-orders`, icon: Clock, label: 'Advance Orders' },
    { href: `/${tenant}/admin/menu`, icon: ChefHat, label: 'Menu' },
    { href: `/${tenant}/admin/vouchers`, icon: Tag, label: 'Vouchers' },
    { href: `/${tenant}/admin/zones`, icon: MapPin, label: 'Order Zones' },
    { href: `/${tenant}/admin/printers`, icon: Printer, label: 'Printers' },
    { href: `/${tenant}/admin/payments`, icon: CreditCard, label: 'Payments' },
    { href: `/${tenant}/admin/allergens`, icon: Wheat, label: 'Allergen Icons' },
    { href: `/${tenant}/admin/connect-pos`, icon: Network, label: 'Connect POS' },
    { href: `/${tenant}/admin/reports`, icon: BarChart3, label: 'Reports' },
    { href: `/${tenant}/admin/settings`, icon: Settings, label: 'Settings' }
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading restaurant...</p>
        </div>
      </div>
    );
  }

  if (!tenantData) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Restaurant Not Found</h1>
          <p className="text-gray-600">The restaurant "{tenant}" does not exist.</p>
          <Link href="/super-admin" className="text-blue-600 hover:underline mt-4 inline-block">
            Go to Super Admin
          </Link>
        </div>
      </div>
    );
  }

  if (pathname === `/${tenant}/admin`) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="w-64 bg-card shadow-lg border-r border-border flex flex-col">
        <div className="p-6 border-b border-border flex flex-col items-start space-y-2">
          <div className="flex items-center space-x-3 w-full">
            {/* Use tenant logo if available, else show AdminLogo */}
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
              {tenantData.settings?.logo ? (
                <img src={tenantData.settings.logo} alt={tenantData.name} className="w-10 h-10 object-cover rounded-xl" />
              ) : (
                <AdminLogo className="w-8 h-8" />
              )}
            </div>
            <div className="flex-1">
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-blue-800 bg-clip-text text-transparent">
                {tenantData.name}
              </span>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
          
          {/* Quick links */}
          <div className="flex space-x-2 w-full">
            <Link
              href={`/${tenant}`}
              target="_blank"
              className="flex-1 text-center text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
            >
              View Store
            </Link>
          </div>
          
          {/* Logout button */}
          <Link
            href={`/${tenant}/admin`}
            className="flex items-center space-x-2 text-foreground hover:text-destructive transition-colors px-4 py-2 rounded-md border border-border bg-card shadow mt-2 w-full justify-center"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
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
        
        {/* Tenant info */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="text-center">
            <p className="text-xs text-gray-500">Plan: {tenantData.plan}</p>
            <p className="text-xs text-gray-500">Status: {tenantData.status}</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        <main className="h-full overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
