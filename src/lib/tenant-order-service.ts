'use server';

import pool from './db';
import type { Order, OrderStatus } from './types';
import { v4 as uuidv4 } from 'uuid';
import { generateOrderNumber } from './order-utils';
import { getTenantSettings } from './tenant-service';
import { defaultRestaurantSettings } from './defaultRestaurantSettings';

export async function getTenantOrders(tenantId: string): Promise<Order[]> {
    return await pool.withConnection(async (connection) => {
        const [orderRows] = await connection.query(
            `SELECT o.*, 
                    o.createdAt as createdAt,
                    o.customerName as customerName,
                    o.customerPhone as customerPhone,
                    o.customerEmail as customerEmail,
                    o.orderType as orderType,
                    o.isAdvanceOrder as isAdvanceOrder,
                    o.scheduledTime as scheduledTime,
                    o.subtotal,
                    o.deliveryFee as deliveryFee,
                    o.discount,
                    o.tax,
                    o.voucherCode as voucherCode,
                    o.printed,
                    o.customerId as customerId,
                    o.paymentMethod as paymentMethod
             FROM orders o 
             WHERE o.tenant_id = ? 
             ORDER BY o.createdAt DESC`,
            [tenantId]
        );
        
        const orders = orderRows as any[];
        
        // Get order items for all orders
        const orderIds = orders.map(order => order.id);
        if (orderIds.length === 0) return [];
        
        const [itemRows] = await connection.query(
            `SELECT oi.*, mi.name as menuItemName, mi.price as menuItemPrice 
             FROM order_items oi 
             LEFT JOIN menu_items mi ON oi.menuItemId = mi.id 
             WHERE oi.orderId IN (${orderIds.map(() => '?').join(',')})`,
            orderIds
        );
        
        const items = itemRows as any[];
        
        // Group items by order
        const itemsByOrder: { [orderId: string]: any[] } = {};
        items.forEach(item => {
            if (!itemsByOrder[item.orderId]) {
                itemsByOrder[item.orderId] = [];
            }
            itemsByOrder[item.orderId].push({
                ...item,
                selectedAddons: item.selectedAddons ? 
                    (typeof item.selectedAddons === 'string' ? JSON.parse(item.selectedAddons) : item.selectedAddons) : 
                    [],
                specialInstructions: item.specialInstructions,
                menuItem: {
                    id: item.menuItemId,
                    name: item.menuItemName,
                    price: item.menuItemPrice
                }
            });
        });
        
        // Attach items to orders and ensure orderNumber exists
        return orders.map(order => ({
            ...order,
            orderNumber: order.orderNumber || `ORD-${Math.floor(1000 + Math.random() * 9000)}`, // Fallback for old orders
            items: itemsByOrder[order.id] || []
        }));
    }); // Close the withConnection function
}

export async function createTenantOrder(tenantId: string, orderData: Omit<Order, 'id' | 'createdAt' | 'status' | 'orderNumber'>): Promise<{
    id: string;
    orderNumber: string;
    total: number;
    customerName: string;
    orderType: string;
    scheduledTime?: Date;
}> {
    const orderId = uuidv4();
    const createdAt = new Date();
    
    // Get tenant settings to generate proper order number
    const tenantSettings = await getTenantSettings(tenantId);
    let restaurantSettings = tenantSettings;
    
    // If settings is JSON string, parse it
    if (typeof tenantSettings === 'string') {
        restaurantSettings = JSON.parse(tenantSettings);
    }
    
    // Generate order number with proper prefix (use default if null)
    const orderNumber = generateOrderNumber(restaurantSettings || defaultRestaurantSettings, orderData.isAdvanceOrder);
    
    // Convert scheduledTime to proper format for database
    const scheduledTime = orderData.scheduledTime ? new Date(orderData.scheduledTime) : null;
    
    if (process.env.NODE_ENV === 'development') {
        console.log('Creating order with data:', JSON.stringify(orderData, null, 2));
        console.log('Generated order number:', orderNumber);
        console.log('Scheduled time:', scheduledTime);
    }
    
    await pool.execute(
        `INSERT INTO orders (
            id, tenant_id, orderNumber, createdAt, customerName, customerPhone, customerEmail, 
            address, total, status, orderType, isAdvanceOrder, scheduledTime,
            subtotal, deliveryFee, discount, tax, voucherCode, printed, customerId, paymentMethod
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            orderId, tenantId, orderNumber, createdAt, orderData.customerName, orderData.customerPhone,
            orderData.customerEmail || null, orderData.address, orderData.total, 'confirmed',
            orderData.orderType, orderData.isAdvanceOrder, scheduledTime,
            orderData.subtotal, orderData.deliveryFee, orderData.discount, orderData.tax,
            orderData.voucherCode || null, false, orderData.customerId || null, orderData.paymentMethod || 'cash'
        ]
    );
    
    // Insert order items
    if (orderData.items && orderData.items.length > 0) {
        const itemValues = orderData.items.map(item => [
            tenantId, orderId, item.menuItem.id, item.quantity,
            JSON.stringify(item.selectedAddons || []), item.specialInstructions || null
        ]);
        
        const placeholders = itemValues.map(() => '(?, ?, ?, ?, ?, ?)').join(',');
        const flatValues = itemValues.flat();
        
        await pool.execute(
            `INSERT INTO order_items (tenant_id, orderId, menuItemId, quantity, selectedAddons, specialInstructions) 
             VALUES ${placeholders}`,
            flatValues
        );
    }
    
    // Return order details for confirmation page
    return {
        id: orderId,
        orderNumber,
        total: orderData.total,
        customerName: orderData.customerName,
        orderType: orderData.orderType,
        scheduledTime: orderData.scheduledTime
    };
}

export async function updateTenantOrderStatus(tenantId: string, orderId: string, status: OrderStatus): Promise<void> {
    await pool.execute(
        'UPDATE orders SET status = ? WHERE tenant_id = ? AND id = ?',
        [status, tenantId, orderId]
    );
}

export async function updateTenantOrderPrintStatus(tenantId: string, orderId: string, printed: boolean): Promise<void> {
    await pool.execute(
        'UPDATE orders SET printed = ? WHERE tenant_id = ? AND id = ?',
        [printed, tenantId, orderId]
    );
}
