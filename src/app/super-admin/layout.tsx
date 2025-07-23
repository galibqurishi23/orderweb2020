'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  CreditCard,
  Settings,
  LogOut,
  Crown,
  Mail,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlobalSettingsProvider, useGlobalSettings } from '@/context/GlobalSettingsContext';

const navItems = [
  { href: '/super-admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/super-admin/health-dashboard', icon: Activity, label: 'Health Dashboard' },
  { href: '/super-admin/restaurants', icon: Store, label: 'Restaurants' },
  { href: '/super-admin/users', icon: Users, label: 'Users' },
  { href: '/super-admin/email-monitoring', icon: Mail, label: 'Email Monitoring' },
  { href: '/super-admin/license-management', icon: Crown, label: 'License Keys' },
  { href: '/super-admin/billing', icon: CreditCard, label: 'Billing' },
  { href: '/super-admin/settings', icon: Settings, label: 'Settings' }
];

// Inner Layout Component (uses settings context)
function SuperAdminLayoutInner({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const { settings } = useGlobalSettings();

  if (pathname === '/super-admin') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="w-64 bg-white shadow-xl border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200 flex flex-col items-start space-y-3">
          <div className="flex items-center space-x-3 w-full">
            {/* Dynamic Logo Display */}
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
              {settings.appLogo && settings.appLogo !== '/icons/logo.svg' ? (
                <Image 
                  src={settings.appLogo} 
                  alt={settings.appName || 'Super Admin'}
                  width={48}
                  height={48}
                  className="object-contain rounded-xl"
                />
              ) : (
                <Crown className="w-7 h-7 text-white" />
              )}
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {settings.appName || 'Super Admin'}
              </span>
              <p className="text-sm text-gray-500">Platform Control</p>
            </div>
          </div>
          
          {/* Logout button */}
          <Link
            href="/super-admin"
            className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors px-4 py-2 rounded-md border border-gray-200 bg-gray-50 shadow-sm mt-2 w-full justify-center"
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
                  'flex items-center space-x-3 px-6 py-4 text-left hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 border-r-4 border-transparent',
                  isActive ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border-purple-500 font-semibold shadow-sm' : 'text-gray-700'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Platform Stats */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-xs text-gray-500">Platform Status</p>
            <div className="flex items-center justify-center space-x-1 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">Online</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        <main className="h-full overflow-y-auto p-8 bg-white bg-opacity-70">
          {children}
        </main>
      </div>
    </div>
  );
}

// Main Layout Component (provides settings context)
export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <GlobalSettingsProvider>
      <SuperAdminLayoutInner>
        {children}
      </SuperAdminLayoutInner>
    </GlobalSettingsProvider>
  );
}
