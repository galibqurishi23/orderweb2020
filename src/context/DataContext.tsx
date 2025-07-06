'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { 
    Order, MenuItem, Category, Printer, RestaurantSettings, Voucher, DeliveryZone, OrderStatus, Customer, Address
} from '@/lib/types';
import * as MenuService from '@/lib/menu-service';
import * as VoucherService from '@/lib/voucher-service';
import * as ZoneService from '@/lib/zone-service';
import * as PrinterService from '@/lib/printer-service';
import * as SettingsService from '@/lib/settings-service';
import * as CustomerService from '@/lib/customer-service';
import * as OrderService from '@/lib/order-service';
import { defaultRestaurantData } from '@/data/mockData'; // For initial default before DB loads
import { initializeDatabase } from '@/lib/db-init';


// Define the shape of the context data
interface DataContextType {
    orders: Order[];
    menuItems: MenuItem[];
    categories: Category[];
    deliveryZones: DeliveryZone[];
    printers: Printer[];
    restaurantSettings: RestaurantSettings;
    vouchers: Voucher[];
    customers: Customer[];
    currentUser: Customer | null;
    isAuthenticated: boolean;

    // Handler functions to abstract away state setting logic
    createOrder: (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => Promise<void>;
    saveMenuItem: (item: MenuItem) => Promise<void>;
    deleteMenuItem: (itemId: string) => Promise<void>;
    saveCategory: (category: Category) => Promise<void>;
    deleteCategory: (categoryId: string) => Promise<void>;
    updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
    updateOrderPrintStatus: (orderId: string) => Promise<void>;
    saveVoucher: (voucher: Voucher) => Promise<void>;
    deleteVoucher: (voucherId: string) => Promise<void>;
    saveDeliveryZone: (zone: DeliveryZone) => Promise<void>;
    deleteDeliveryZone: (zoneId: string) => Promise<void>;
    savePrinter: (printer: Printer) => Promise<void>;
    deletePrinter: (printerId: string) => Promise<void>;
    saveSettings: (settings: RestaurantSettings) => Promise<void>;
    login: (email: string, pass: string) => Promise<boolean>;
    logout: () => void;
    updateUserDetails: (updatedDetails: Partial<Customer>) => Promise<void>;
    addAddress: (address: Omit<Address, 'id'>) => Promise<void>;
    deleteAddress: (addressId: string) => Promise<void>;
    toggleVoucherStatus: (voucherId: string) => Promise<void>;
    togglePrinterStatus: (printerId: string) => Promise<void>;
}

// Create the context
const DataContext = createContext<DataContextType | undefined>(undefined);

// Create the provider component
export const DataProvider = ({ children }: { children: ReactNode }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
    const [printers, setPrinters] = useState<Printer[]>([]);
    const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings>(defaultRestaurantData);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [currentUser, setCurrentUser] = useState<Customer | null>(null);
    const isAuthenticated = !!currentUser;

    const refreshData = useCallback(async () => {
        try {
            // Ensure the database is initialized before fetching data
            await initializeDatabase();

            const [
                dbCategories, dbMenuItems, dbVouchers, dbZones,
                dbPrinters, dbSettings, dbCustomers, dbOrders
            ] = await Promise.all([
                MenuService.getCategories(),
                MenuService.getMenuItems(),
                VoucherService.getVouchers(),
                ZoneService.getDeliveryZones(),
                PrinterService.getPrinters(),
                SettingsService.getSettings(),
                CustomerService.getCustomers(),
                OrderService.getOrders()
            ]);
            setCategories(dbCategories);
            setMenuItems(dbMenuItems);
            setVouchers(dbVouchers);
            setDeliveryZones(dbZones);
            setPrinters(dbPrinters);
            if (dbSettings) {
                // Ensure payment settings are properly merged with defaults
               const mergedSettings = {
                   ...defaultRestaurantData,
                   ...dbSettings,
                   paymentSettings: {
                       ...defaultRestaurantData.paymentSettings,
                       ...(dbSettings.paymentSettings || {}),
                       cash: {
                           ...defaultRestaurantData.paymentSettings.cash,
                           ...(dbSettings.paymentSettings?.cash || {}),
                       },
                       stripe: {
                           ...defaultRestaurantData.paymentSettings.stripe,
                           ...(dbSettings.paymentSettings?.stripe || {}),
                       },
                       globalPayments: {
                           ...defaultRestaurantData.paymentSettings.globalPayments,
                           ...(dbSettings.paymentSettings?.globalPayments || {}),
                       },
                       worldpay: {
                           ...defaultRestaurantData.paymentSettings.worldpay,
                           ...(dbSettings.paymentSettings?.worldpay || {}),
                       },
                   },
               };
               setRestaurantSettings(mergedSettings);
           } else {
               // If no settings in DB, use the default settings
               setRestaurantSettings(defaultRestaurantData);
           }
            setCustomers(dbCustomers);
            setOrders(dbOrders);

        } catch (error) {
            console.error("Failed to refresh data from database:", error);
        }
    }, []);


    useEffect(() => {
        refreshData();
    }, [refreshData]);

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
    const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>) => {
        await OrderService.createOrder(orderData);
        await refreshData();
    };

    // Menu Items
    const saveMenuItem = async (itemData: MenuItem) => {
        await MenuService.saveMenuItem(itemData);
        await refreshData();
    };
    const deleteMenuItem = async (itemId: string) => {
        await MenuService.deleteMenuItem(itemId);
        await refreshData();
    };

    // Categories
    const saveCategory = async (catData: Category) => {
        await MenuService.saveCategory(catData);
        await refreshData();
    };
    const deleteCategory = async (catId: string) => {
        await MenuService.deleteCategory(catId);
        await refreshData();
    };
    
    // Orders
    const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
        await OrderService.updateOrderStatus(orderId, status);
        await refreshData();
    };
    const updateOrderPrintStatus = async (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (order) {
            await OrderService.updateOrderPrintStatus(orderId, !order.printed);
            await refreshData();
        }
    };

    // Vouchers
    const saveVoucher = async (voucherData: Voucher) => {
        await VoucherService.saveVoucher(voucherData);
        await refreshData();
    };
    const deleteVoucher = async (voucherId: string) => {
        await VoucherService.deleteVoucher(voucherId);
        await refreshData();
    };
     const toggleVoucherStatus = async (voucherId: string) => {
        const voucher = vouchers.find(v => v.id === voucherId);
        if (voucher) {
            await VoucherService.saveVoucher({ ...voucher, active: !voucher.active });
            await refreshData();
        }
    };


    // Delivery Zones
    const saveDeliveryZone = async (zoneData: DeliveryZone) => {
        await ZoneService.saveDeliveryZone(zoneData);
        await refreshData();
    };
    const deleteDeliveryZone = async (zoneId: string) => {
        await ZoneService.deleteDeliveryZone(zoneId);
        await refreshData();
    };

    // Printers
    const savePrinter = async (printerData: Printer) => {
        await PrinterService.savePrinter(printerData);
        await refreshData();
    };
    const deletePrinter = async (printerId: string) => {
        await PrinterService.deletePrinter(printerId);
        await refreshData();
    };
     const togglePrinterStatus = async (printerId: string) => {
        const printer = printers.find(p => p.id === printerId);
        if (printer) {
            await PrinterService.savePrinter({ ...printer, active: !printer.active });
            await refreshData();
        }
    };

    // Settings
    const saveSettings = async (settings: RestaurantSettings) => {
        await SettingsService.saveSettings(settings);
        await refreshData();
    };

    // Customer Auth
    const login = async (email: string, pass: string): Promise<boolean> => {
        const user = await CustomerService.validateCustomer(email, pass);
        if (user) {
            setCurrentUser(user);
            return true;
        }
        return false;
    };
    
    const logout = () => {
        setCurrentUser(null);
    };

    const updateUserDetails = async (updatedDetails: Partial<Omit<Customer, 'id'>>) => {
        if (!currentUser) return;
        const updatedUser = { ...currentUser, ...updatedDetails };
        await CustomerService.updateCustomerDetails(currentUser.id, updatedUser);
        setCurrentUser(updatedUser);
        await refreshData();
    };

    const addAddress = async (address: Omit<Address, 'id'>) => {
        if (!currentUser) return;
        await CustomerService.addAddress(currentUser.id, address);
        await refreshData(); // This will re-fetch the user with the new address
        const updatedUser = await CustomerService.getCustomerById(currentUser.id);
        if(updatedUser) setCurrentUser(updatedUser);
    };

    const deleteAddress = async (addressId: string) => {
        if (!currentUser) return;
        await CustomerService.deleteAddress(addressId);
        await refreshData();
        const updatedUser = await CustomerService.getCustomerById(currentUser.id);
        if(updatedUser) setCurrentUser(updatedUser);
    };


    const value = {
        orders, 
        menuItems,
        categories,
        deliveryZones,
        printers,
        restaurantSettings,
        vouchers,
        customers,
        currentUser, 
        isAuthenticated,
        createOrder,
        saveMenuItem, 
        deleteMenuItem,
        saveCategory, 
        deleteCategory,
        updateOrderStatus, 
        updateOrderPrintStatus,
        saveVoucher, 
        deleteVoucher,
        toggleVoucherStatus,
        saveDeliveryZone, 
        deleteDeliveryZone,
        savePrinter, 
        deletePrinter,
        togglePrinterStatus,
        saveSettings,
        login, 
        logout,
        updateUserDetails, 
        addAddress, 
        deleteAddress,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// Create a custom hook to use the context
export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
