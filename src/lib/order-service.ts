'use server';

import pool from './db';
import type { Order, OrderStatus, PlacedOrderItem, MenuItem } from './types';
import { RowDataPacket } from 'mysql2';

interface OrderItemRow extends RowDataPacket {
    // fields from orders table
    id: string;
    createdAt: Date;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    address: string;
    total: number;
    status: OrderStatus;
    orderType: 'delivery' | 'pickup' | 'advance' | 'collection';
    isAdvanceOrder: boolean;
    scheduledTime: Date;
    subtotal: number;
    deliveryFee: number;
    discount: number;
    tax: number;
    voucherCode: string;
    printed: boolean;
    customerId: string;
    // fields from order_items table
    order_item_id: number;
    quantity: number;
    selected_addons: any;
    special_instructions: string;
    // fields from menu_items table, prefixed to avoid clashes
    menu_item_id: string;
    menu_item_name: string;
    menu_item_description: string;
    menu_item_price: number;
    menu_item_imageUrl: string;
    menu_item_imageHint: string;
    menu_item_available: boolean;
    menu_item_categoryId: string;
    menu_item_addons: any;
    menu_item_characteristics: any;
    menu_item_nutrition: any;
}

function parseJsonField<T>(field: any): T {
    if (typeof field === 'string') {
        try {
            return JSON.parse(field);
        } catch (e) {
            return field as T;
        }
    }
    return field;
}


export async function getOrders(): Promise<Order[]> {
    const query = `
        SELECT
            o.*,
            oi.id as order_item_internal_id, oi.quantity, oi.selectedAddons as selected_addons, oi.specialInstructions as special_instructions,
            mi.id as menu_item_id, mi.name as menu_item_name, mi.description as menu_item_description,
            mi.price as menu_item_price, mi.imageUrl as menu_item_imageUrl, mi.imageHint as menu_item_imageHint,
            mi.available as menu_item_available, mi.categoryId as menu_item_categoryId, mi.addons as menu_item_addons,
            mi.characteristics as menu_item_characteristics, mi.nutrition as menu_item_nutrition
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.orderId
        LEFT JOIN menu_items mi ON oi.menuItemId = mi.id
        ORDER BY o.createdAt DESC;
    `;

    const [rows] = await pool.query(query);
    const ordersMap = new Map<string, Order>();

    for (const row of rows as OrderItemRow[]) {
        if (!ordersMap.has(row.id)) {
            ordersMap.set(row.id, {
                id: row.id,
                createdAt: new Date(row.createdAt),
                customerName: row.customerName,
                customerPhone: row.customerPhone,
                customerEmail: row.customerEmail,
                address: row.address,
                total: parseFloat(row.total as any),
                status: row.status,
                orderType: row.orderType,
                isAdvanceOrder: !!row.isAdvanceOrder,
                scheduledTime: row.scheduledTime ? new Date(row.scheduledTime) : undefined,
                subtotal: parseFloat(row.subtotal as any),
                deliveryFee: parseFloat(row.deliveryFee as any),
                discount: parseFloat(row.discount as any),
                tax: parseFloat(row.tax as any),
                voucherCode: row.voucherCode,
                printed: !!row.printed,
                customerId: row.customerId,
                items: [],
            });
        }
        
        const order = ordersMap.get(row.id)!;

        if (row.order_item_internal_id) {
             const menuItem: MenuItem = {
                id: row.menu_item_id,
                name: row.menu_item_name,
                description: row.menu_item_description,
                price: row.menu_item_price,
                imageUrl: row.menu_item_imageUrl,
                imageHint: row.menu_item_imageHint,
                available: !!row.menu_item_available,
                categoryId: row.menu_item_categoryId,
                addons: parseJsonField(row.menu_item_addons),
                characteristics: parseJsonField(row.menu_item_characteristics),
                nutrition: parseJsonField(row.menu_item_nutrition),
            };

            const placedItem: PlacedOrderItem = {
                id: String(row.order_item_internal_id),
                quantity: row.quantity,
                menuItem: menuItem,
                selectedAddons: parseJsonField(row.selected_addons),
                specialInstructions: row.special_instructions
            };
            order.items.push(placedItem);
        }
    }

    return Array.from(ordersMap.values());
}

export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<void> {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const orderId = `${orderData.isAdvanceOrder ? 'ADV' : 'ORD'}-${Date.now()}`;
        
        const orderSql = `
            INSERT INTO orders (
                id, customerName, customerPhone, customerEmail, address, total, status, orderType, 
                isAdvanceOrder, scheduledTime, subtotal, deliveryFee, discount, tax, voucherCode, printed, customerId
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        
        await connection.query(orderSql, [
            orderId,
            orderData.customerName,
            orderData.customerPhone,
            orderData.customerEmail,
            orderData.address,
            orderData.total,
            'pending', // Initial status
            orderData.orderType,
            orderData.isAdvanceOrder,
            orderData.scheduledTime,
            orderData.subtotal,
            orderData.deliveryFee,
            orderData.discount || 0,
            orderData.tax,
            orderData.voucherCode,
            false, // Initial printed status
            orderData.customerId
        ]);

        const orderItemSql = `
            INSERT INTO order_items (orderId, menuItemId, quantity, selectedAddons, specialInstructions)
            VALUES ?;
        `;
        
        const orderItemValues = orderData.items.map(item => [
            orderId,
            item.menuItem.id,
            item.quantity,
            JSON.stringify(item.selectedAddons),
            item.specialInstructions
        ]);

        if (orderItemValues.length > 0) {
            await connection.query(orderItemSql, [orderItemValues]);
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error("Failed to create order:", error);
        throw error; // Re-throw the error to be handled by the caller
    } finally {
        connection.release();
    }
}


export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
}

export async function updateOrderPrintStatus(orderId: string, printed: boolean): Promise<void> {
    await pool.query('UPDATE orders SET printed = ? WHERE id = ?', [printed, orderId]);
}
