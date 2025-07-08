'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { 
    Order, MenuItem, Category, RestaurantSettings, Customer, Address, OrderStatus,
    OpeningHours, OpeningHoursPerDay
} from '@/lib/types';
import * as TenantMenuService from '@/lib/tenant-menu-service';
import * as TenantCustomerService from '@/lib/tenant-customer-service';
import * as TenantOrderService from '@/lib/tenant-order-service';
import { getTenantSettingsAction } from '@/lib/server-actions';
import { defaultRestaurantSettings } from '@/default-setting/defaultRestaurantSettings';
import { useTenant } from './TenantContext';

// Define the shape of the tenant data context
interface TenantDataContextType {
    orders: Order[];
    menuItems: MenuItem[];
    categories: Category[];
    restaurantSettings: RestaurantSettings; // No longer null - always provide default settings
    customers: Customer[];
    currentUser: Customer | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Handler functions to abstract away state setting logic
    createOrder: (order: Omit<Order, 'id' | 'createdAt' | 'status' | 'orderNumber'>) => Promise<void>;
    saveMenuItem: (item: MenuItem) => Promise<void>;
    deleteMenuItem: (itemId: string) => Promise<void>;
    saveCategory: (category: Category) => Promise<void>;
    deleteCategory: (categoryId: string) => Promise<void>;
    updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
    updateOrderPrintStatus: (orderId: string) => Promise<void>;
    login: (email: string, pass: string) => Promise<boolean>;
    logout: () => void;
    updateUserDetails: (updatedDetails: Partial<Customer>) => Promise<void>;
    addAddress: (address: Omit<Address, 'id'>) => Promise<void>;
    deleteAddress: (addressId: string) => Promise<void>;
    getMenuWithCategories: () => { category: Category; items: MenuItem[] }[];
}

// Create the context
const TenantDataContext = createContext<TenantDataContextType | undefined>(undefined);

// Create the provider component
export const TenantDataProvider = ({ children }: { children: ReactNode }) => {
    const { tenantData, isLoading: tenantLoading } = useTenant();
    const [orders, setOrders] = useState<Order[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [currentUser, setCurrentUser] = useState<Customer | null>(null);
    const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const isAuthenticated = !!currentUser;

    const refreshData = useCallback(async () => {
        if (!tenantData?.id) return;
        
        try {
            setIsLoading(true);
            const [
                dbCategories, 
                dbMenuItems, 
                dbCustomers, 
                dbOrders,
                dbSettings
            ] = await Promise.all([
                TenantMenuService.getTenantCategories(tenantData.id),
                TenantMenuService.getTenantMenuItems(tenantData.id),
                TenantCustomerService.getTenantCustomers(tenantData.id),
                TenantOrderService.getTenantOrders(tenantData.id),
                getTenantSettingsAction(tenantData.id)
            ]);
            
            setCategories(dbCategories);
            setMenuItems(dbMenuItems);
            setCustomers(dbCustomers);
            setOrders(dbOrders);
            
            // Process and set restaurant settings
            if (dbSettings) {
                // Parse JSON if it's a string
                const parsedSettings = typeof dbSettings === 'string' 
                    ? JSON.parse(dbSettings) 
                    : dbSettings;
                
                // Create type-safe opening hours
                const openingHours: OpeningHours = {
                    monday: ensureTimeMode(parsedSettings?.openingHours?.monday || defaultRestaurantSettings.openingHours.monday),
                    tuesday: ensureTimeMode(parsedSettings?.openingHours?.tuesday || defaultRestaurantSettings.openingHours.tuesday),
                    wednesday: ensureTimeMode(parsedSettings?.openingHours?.wednesday || defaultRestaurantSettings.openingHours.wednesday),
                    thursday: ensureTimeMode(parsedSettings?.openingHours?.thursday || defaultRestaurantSettings.openingHours.thursday),
                    friday: ensureTimeMode(parsedSettings?.openingHours?.friday || defaultRestaurantSettings.openingHours.friday),
                    saturday: ensureTimeMode(parsedSettings?.openingHours?.saturday || defaultRestaurantSettings.openingHours.saturday),
                    sunday: ensureTimeMode(parsedSettings?.openingHours?.sunday || defaultRestaurantSettings.openingHours.sunday)
                };
                
                // Ensure we have all default settings fields as fallbacks
                const settings: RestaurantSettings = {
                    ...defaultRestaurantSettings,
                    ...parsedSettings,
                    // Override with tenant info
                    name: tenantData.name,
                    // Keep logo from tenant settings if available
                    logo: tenantData.settings.logo || parsedSettings?.logo || defaultRestaurantSettings.logo,
                    // Ensure nested objects are properly merged
                    openingHours,
                    paymentSettings: {
                        ...defaultRestaurantSettings.paymentSettings,
                        ...(parsedSettings.paymentSettings || {})
                    },
                    orderTypeSettings: {
                        ...defaultRestaurantSettings.orderTypeSettings,
                        ...(parsedSettings.orderTypeSettings || {})
                    },
                    theme: {
                        ...defaultRestaurantSettings.theme,
                        primary: tenantData.settings.primaryColor || parsedSettings?.theme?.primary || defaultRestaurantSettings.theme.primary,
                        ...(parsedSettings.theme || {})
                    }
                };
                
                setRestaurantSettings(settings);
            } else {
                // If no settings found, use default settings with tenant info
                const openingHours: OpeningHours = {
                    monday: ensureTimeMode(defaultRestaurantSettings.openingHours.monday),
                    tuesday: ensureTimeMode(defaultRestaurantSettings.openingHours.tuesday),
                    wednesday: ensureTimeMode(defaultRestaurantSettings.openingHours.wednesday),
                    thursday: ensureTimeMode(defaultRestaurantSettings.openingHours.thursday),
                    friday: ensureTimeMode(defaultRestaurantSettings.openingHours.friday),
                    saturday: ensureTimeMode(defaultRestaurantSettings.openingHours.saturday),
                    sunday: ensureTimeMode(defaultRestaurantSettings.openingHours.sunday)
                };
                
                const defaultSettings: RestaurantSettings = {
                    ...defaultRestaurantSettings,
                    name: tenantData.name,
                    description: `Welcome to ${tenantData.name}`,
                    logo: tenantData.settings.logo,
                    currency: tenantData.settings.currency || 'GBP',
                    openingHours,
                    theme: {
                        ...defaultRestaurantSettings.theme,
                        primary: tenantData.settings.primaryColor || defaultRestaurantSettings.theme.primary
                    }
                };
                
                setRestaurantSettings(defaultSettings);
            }
            
            // Helper function to ensure timeMode is correctly typed
            function ensureTimeMode(daySettings: any): OpeningHoursPerDay {
                return {
                    ...daySettings,
                    timeMode: (daySettings.timeMode === 'single' || daySettings.timeMode === 'split') 
                        ? daySettings.timeMode 
                        : 'split' as 'split' | 'single'
                };
            }
        } catch (error) {
            console.error("Failed to refresh tenant data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [tenantData?.id, tenantData?.name, tenantData?.settings]);

    useEffect(() => {
        if (tenantData?.id) {
            refreshData();
        }
    }, [refreshData, tenantData?.id]);

    // Apply tenant theme if available
    useEffect(() => {
        if (restaurantSettings?.theme) {
            const root = document.documentElement;
            root.style.setProperty('--primary', restaurantSettings.theme.primary);
            root.style.setProperty('--primary-foreground', restaurantSettings.theme.primaryForeground);
            root.style.setProperty('--background', restaurantSettings.theme.background);
            root.style.setProperty('--accent', restaurantSettings.theme.accent);
        }
    }, [restaurantSettings?.theme]);

    // --- Handler Functions ---
    const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'status' | 'orderNumber'>) => {
        if (!tenantData?.id) throw new Error('No tenant selected');
        await TenantOrderService.createTenantOrder(tenantData.id, orderData);
        await refreshData();
    };

    const saveMenuItem = async (item: MenuItem) => {
        if (!tenantData?.id) throw new Error('No tenant selected');
        await TenantMenuService.saveTenantMenuItem(tenantData.id, item);
        await refreshData();
    };

    const deleteMenuItem = async (itemId: string) => {
        if (!tenantData?.id) throw new Error('No tenant selected');
        await TenantMenuService.deleteTenantMenuItem(tenantData.id, itemId);
        await refreshData();
    };

    const saveCategory = async (category: Category) => {
        if (!tenantData?.id) throw new Error('No tenant selected');
        await TenantMenuService.saveTenantCategory(tenantData.id, category);
        await refreshData();
    };

    const deleteCategory = async (categoryId: string) => {
        if (!tenantData?.id) throw new Error('No tenant selected');
        await TenantMenuService.deleteTenantCategory(tenantData.id, categoryId);
        await refreshData();
    };

    const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
        if (!tenantData?.id) throw new Error('No tenant selected');
        await TenantOrderService.updateTenantOrderStatus(tenantData.id, orderId, status);
        await refreshData();
    };

    const updateOrderPrintStatus = async (orderId: string) => {
        if (!tenantData?.id) throw new Error('No tenant selected');
        const order = orders.find(o => o.id === orderId);
        if (order) {
            await TenantOrderService.updateTenantOrderPrintStatus(tenantData.id, orderId, !order.printed);
            await refreshData();
        }
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        if (!tenantData?.id) return false;
        
        const customer = await TenantCustomerService.authenticateTenantCustomer(tenantData.id, email, password);
        if (customer) {
            // Get customer addresses
            const addresses = await TenantCustomerService.getTenantCustomerAddresses(tenantData.id, customer.id);
            customer.addresses = addresses;
            setCurrentUser(customer);
            return true;
        }
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
    };

    const updateUserDetails = async (updatedDetails: Partial<Customer>) => {
        if (!currentUser || !tenantData?.id) return;
        
        // This would need to be implemented in the tenant customer service
        // For now, just update local state
        setCurrentUser(prev => prev ? { ...prev, ...updatedDetails } : null);
    };

    const addAddress = async (address: Omit<Address, 'id'>) => {
        if (!currentUser || !tenantData?.id) throw new Error('User not authenticated');
        
        await TenantCustomerService.addTenantCustomerAddress(tenantData.id, currentUser.id, address);
        
        // Refresh customer addresses
        const addresses = await TenantCustomerService.getTenantCustomerAddresses(tenantData.id, currentUser.id);
        setCurrentUser(prev => prev ? { ...prev, addresses } : null);
    };

    const deleteAddress = async (addressId: string) => {
        if (!currentUser || !tenantData?.id) throw new Error('User not authenticated');
        
        await TenantCustomerService.deleteTenantCustomerAddress(tenantData.id, addressId);
        
        // Refresh customer addresses
        const addresses = await TenantCustomerService.getTenantCustomerAddresses(tenantData.id, currentUser.id);
        setCurrentUser(prev => prev ? { ...prev, addresses } : null);
    };

    const getMenuWithCategories = (): { category: Category; items: MenuItem[] }[] => {
        return categories.map(category => ({
            category,
            items: menuItems.filter(item => item.categoryId === category.id)
        }));
    };

    const contextValue: TenantDataContextType = {
        orders,
        menuItems,
        categories,
        // Make sure we always provide a non-null restaurantSettings to avoid breaking components
        restaurantSettings: restaurantSettings || {
            ...defaultRestaurantSettings,
            openingHours: {
                monday: { ...defaultRestaurantSettings.openingHours.monday, timeMode: 'split' as 'split' },
                tuesday: { ...defaultRestaurantSettings.openingHours.tuesday, timeMode: 'split' as 'split' },
                wednesday: { ...defaultRestaurantSettings.openingHours.wednesday, timeMode: 'split' as 'split' },
                thursday: { ...defaultRestaurantSettings.openingHours.thursday, timeMode: 'split' as 'split' },
                friday: { ...defaultRestaurantSettings.openingHours.friday, timeMode: 'split' as 'split' },
                saturday: { ...defaultRestaurantSettings.openingHours.saturday, timeMode: 'split' as 'split' },
                sunday: { ...defaultRestaurantSettings.openingHours.sunday, timeMode: 'split' as 'split' }
            }
        },
        customers,
        currentUser,
        isAuthenticated,
        isLoading: isLoading || tenantLoading,
        createOrder,
        saveMenuItem,
        deleteMenuItem,
        saveCategory,
        deleteCategory,
        updateOrderStatus,
        updateOrderPrintStatus,
        login,
        logout,
        updateUserDetails,
        addAddress,
        deleteAddress,
        getMenuWithCategories,
    };

    return (
        <TenantDataContext.Provider value={contextValue}>
            {children}
        </TenantDataContext.Provider>
    );
};

// Custom hook to use the tenant data context
export const useTenantData = () => {
    const context = useContext(TenantDataContext);
    if (context === undefined) {
        throw new Error('useTenantData must be used within a TenantDataProvider');
    }
    return context;
};
