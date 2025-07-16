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
import { TenantDataProvider } from '@/context/TenantDataContext';

export default function TenantAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { tenantData, isLoading } = useTenant();
  
  // Extract tenant from pathname to avoid async params issue
  const tenant = pathname.split('/')[1];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      // Redirect to login page
      window.location.href = `/${tenant}/admin`;
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout call fails
      window.location.href = `/${tenant}/admin`;
    }
  };
  
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
    <TenantDataProvider>
      <div className="flex h-screen bg-slate-50">
        {/* Sidebar */}
        <div className="w-72 bg-white shadow-xl border-r border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                  {tenantData.settings?.logo ? (
                    <img src={tenantData.settings.logo} alt={tenantData.name} className="w-12 h-12 object-cover rounded-xl" />
                  ) : (
                    <AdminLogo className="w-8 h-8 text-white" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-slate-800 leading-tight">
                  {tenantData.name}
                </h1>
                <p className="text-sm text-slate-500 font-medium">Restaurant Admin</p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="space-y-2">
              <Link
                href={`/${tenant}`}
                target="_blank"
                className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
              >
                <span>👀</span>
                <span>View Live Store</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6">
            <div className="space-y-1 px-4">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group',
                      isActive 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    )}
                  >
                    <Icon className={cn(
                      'w-5 h-5 transition-transform duration-200',
                      isActive ? 'scale-110' : 'group-hover:scale-105'
                    )} />
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-700">Plan: {tenantData.plan}</p>
                <p className="text-xs text-slate-500">Status: {tenantData.status}</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <main className="h-full overflow-y-auto">
            <div className="p-8">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </TenantDataProvider>
  );
}
