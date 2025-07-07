'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface TenantContextType {
  tenantSlug: string | null;
  tenantData: TenantData | null;
  isLoading: boolean;
  contextType: 'admin' | 'customer' | 'super-admin' | null;
}

interface TenantData {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'pending' | 'inactive';
  plan: 'basic' | 'premium' | 'enterprise';
  settings: {
    logo?: string;
    primaryColor?: string;
    currency?: string;
    timezone?: string;
  };
}

const TenantContext = createContext<TenantContextType>({
  tenantSlug: null,
  tenantData: null,
  isLoading: true,
  contextType: null
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contextType, setContextType] = useState<'admin' | 'customer' | 'super-admin' | null>(null);

  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    
    // Check if we're in super-admin
    if (segments[0] === 'super-admin') {
      setContextType('super-admin');
      setTenantSlug(null);
      setTenantData(null);
      setIsLoading(false);
      return;
    }
    
    // Check for tenant-specific routes
    if (segments.length >= 1) {
      const potentialTenant = segments[0];
      
      // Skip special routes that aren't tenants
      const specialRoutes = ['admin', 'customer', 'super-admin', 'api'];
      if (specialRoutes.includes(potentialTenant)) {
        setTenantSlug(null);
        setTenantData(null);
        setContextType(null);
        setIsLoading(false);
        return;
      }
      
      // Fetch tenant data from API
      setIsLoading(true);
      setTenantSlug(potentialTenant);
      
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      fetch(`/api/tenant/info?slug=${potentialTenant}&t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
        .then(response => {
          if (response.ok) {
            return response.json();
          } else if (response.status === 404) {
            // Tenant not found
            console.error(`Tenant not found: ${potentialTenant}`);
            setTenantSlug(null);
            setTenantData(null);
            setContextType(null);
            return null;
          } else {
            console.error(`Failed to fetch tenant: ${response.status}`);
            throw new Error(`Failed to fetch tenant: ${response.status}`);
          }
        })
        .then(tenantData => {
          if (tenantData) {
            console.log(`Tenant data loaded for ${potentialTenant}:`, tenantData);
            setTenantSlug(potentialTenant);
            setTenantData(tenantData);
            
            // Determine context type
            if (segments.length >= 2 && segments[1] === 'admin') {
              console.log(`Setting context type to admin for ${potentialTenant}`);
              setContextType('admin');
            } else {
              console.log(`Setting context type to customer for ${potentialTenant}`);
              setContextType('customer');
            }
          }
        })
        .catch(error => {
          console.error('Error fetching tenant data:', error);
          setTenantSlug(null);
          setTenantData(null);
          setContextType(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [pathname]);

  return (
    <TenantContext.Provider value={{
      tenantSlug,
      tenantData,
      isLoading,
      contextType
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

// Helper hook for tenant-aware routing
export function useTenantRouter() {
  const { tenantSlug } = useTenant();
  
  const getAdminPath = (path: string = '') => {
    if (!tenantSlug) return '/admin' + (path ? `/${path}` : '');
    return `/${tenantSlug}/admin` + (path ? `/${path}` : '');
  };
  
  const getCustomerPath = (path: string = '') => {
    if (!tenantSlug) return '/customer' + (path ? `/${path}` : '');
    return `/${tenantSlug}` + (path ? `/${path}` : '');
  };
  
  return {
    getAdminPath,
    getCustomerPath
  };
}
