'use server';

import pool from './db';
import type { Order, OrderStatus } from './types';
import { v4 as uuidv4 } from 'uuid';
import { generateOrderNumber } from './order-utils';
import { getTenantSettings } from './tenant-service';
import { defaultRestaurantSettings } from './defaultRestaurantSettings';

export async function getTenantOrders(tenantId: string): Promise<Order[]> {
    const [orderRows] = await pool.query(
        `SELECT o.*, 
                o.order_number as orderNumber,
                o.created_at as createdAt,
                o.customer_name as customerName,
                o.customer_phone as customerPhone,
                o.customer_email as customerEmail,
                o.order_type as orderType,
                o.is_advance_order as isAdvanceOrder,
                o.scheduled_time as scheduledTime,
                o.subtotal,
                o.delivery_fee as deliveryFee,
                o.discount,
                o.tax,
                o.voucher_code as voucherCode,
                o.printed,
                o.customer_id as customerId,
                o.payment_method as paymentMethod
         FROM orders o 
         WHERE o.tenant_id = ? 
         ORDER BY o.created_at DESC`,
        [tenantId]
    );
    
    const orders = orderRows as any[];
    
    // Get order items for all orders
    const orderIds = orders.map(order => order.id);
    if (orderIds.length === 0) return [];
    
    const [itemRows] = await pool.query(
        `SELECT oi.*, mi.name as menuItemName, mi.price as menuItemPrice 
         FROM order_items oi 
         LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id 
         WHERE oi.order_id IN (${orderIds.map(() => '?').join(',')})`,
        orderIds
    );
    
    const items = itemRows as any[];
    
    // Group items by order
    const itemsByOrder: { [orderId: string]: any[] } = {};
    items.forEach(item => {
        if (!itemsByOrder[item.order_id]) {
            itemsByOrder[item.order_id] = [];
        }
        itemsByOrder[item.order_id].push({
            ...item,
            selectedAddons: item.selected_addons ? 
                (typeof item.selected_addons === 'string' ? JSON.parse(item.selected_addons) : item.selected_addons) : 
                [],
            specialInstructions: item.special_instructions,
            menuItem: {
                id: item.menu_item_id,
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
}

export async function createTenantOrder(tenantId: string, orderData: Omit<Order, 'id' | 'createdAt' | 'status' | 'orderNumber'>): Promise<void> {
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
    
    if (process.env.NODE_ENV === 'development') {
        console.log('Creating order with data:', JSON.stringify(orderData, null, 2));
        console.log('Generated order number:', orderNumber);
    }
    
    await pool.execute(
        `INSERT INTO orders (
            id, tenant_id, order_number, created_at, customer_name, customer_phone, customer_email, 
            address, total, status, order_type, is_advance_order, scheduled_time,
            subtotal, delivery_fee, discount, tax, voucher_code, printed, customer_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            orderId, tenantId, orderNumber, createdAt, orderData.customerName, orderData.customerPhone,
            orderData.customerEmail || null, orderData.address, orderData.total, 'confirmed',
            orderData.orderType, orderData.isAdvanceOrder, orderData.scheduledTime || null,
            orderData.subtotal, orderData.deliveryFee, orderData.discount, orderData.tax,
            orderData.voucherCode || null, false, orderData.customerId || null
        ]
    );
    
    // Insert order items
    if (orderData.items && orderData.items.length > 0) {
        const itemValues = orderData.items.map(item => [
            uuidv4(), orderId, item.menuItem.id, item.quantity,
            item.menuItem.price, item.menuItem.price * item.quantity,
            JSON.stringify(item.selectedAddons || []), item.specialInstructions
        ]);
        
        const placeholders = itemValues.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(',');
        const flatValues = itemValues.flat();
        
        await pool.execute(
            `INSERT INTO order_items (id, order_id, menu_item_id, quantity, unit_price, total_price, selected_addons, special_instructions) 
             VALUES ${placeholders}`,
            flatValues
        );
    }
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
