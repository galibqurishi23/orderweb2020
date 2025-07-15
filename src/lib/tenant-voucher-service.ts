'use server';

import pool from './db';
import type { Voucher } from './types';
import { v4 as uuidv4 } from 'uuid';

export async function getTenantVouchers(tenantId: string): Promise<Voucher[]> {
    const [rows] = await pool.query('SELECT * FROM vouchers WHERE tenant_id = ?', [tenantId]);
    return (rows as any[]).map(v => ({
        ...v,
        value: parseFloat(v.value),
        minOrder: parseFloat(v.minOrder),
        maxDiscount: v.maxDiscount ? parseFloat(v.maxDiscount) : undefined,
        expiryDate: new Date(v.expiryDate),
        active: Boolean(v.active),
        usageLimit: v.usageLimit ? Number(v.usageLimit) : undefined,
        usedCount: Number(v.usedCount)
    }));
}

export async function validateTenantVoucher(tenantId: string, code: string, orderTotal: number): Promise<{ valid: boolean; voucher?: Voucher; error?: string }> {
    const [rows] = await pool.query(
        'SELECT * FROM vouchers WHERE tenant_id = ? AND code = ? AND active = 1',
        [tenantId, code]
    );
    
    const vouchers = rows as any[];
    if (vouchers.length === 0) {
        return { valid: false, error: 'Invalid voucher code' };
    }
    
    const voucher = vouchers[0];
    const voucherData: Voucher = {
        ...voucher,
        value: parseFloat(voucher.value),
        minOrder: parseFloat(voucher.minOrder),
        maxDiscount: voucher.maxDiscount ? parseFloat(voucher.maxDiscount) : undefined,
        expiryDate: new Date(voucher.expiryDate),
        active: Boolean(voucher.active),
        usageLimit: voucher.usageLimit ? Number(voucher.usageLimit) : undefined,
        usedCount: Number(voucher.usedCount)
    };
    
    // Check if voucher has expired
    if (new Date() > voucherData.expiryDate) {
        return { valid: false, error: 'Voucher has expired' };
    }
    
    // Check usage limit
    if (voucherData.usageLimit && voucherData.usedCount >= voucherData.usageLimit) {
        return { valid: false, error: 'Voucher usage limit reached' };
    }
    
    // Check minimum order value
    if (orderTotal < voucherData.minOrder) {
        return { valid: false, error: `Minimum order value is ${voucherData.minOrder}` };
    }
    
    return { valid: true, voucher: voucherData };
}

export async function calculateVoucherDiscount(voucher: Voucher, orderTotal: number): Promise<number> {
    let discount = 0;
    
    if (voucher.type === 'percentage') {
        discount = (orderTotal * voucher.value) / 100;
        // Apply maximum discount limit if specified
        if (voucher.maxDiscount && discount > voucher.maxDiscount) {
            discount = voucher.maxDiscount;
        }
    } else if (voucher.type === 'amount') {
        discount = voucher.value;
        // Don't let discount exceed order total
        if (discount > orderTotal) {
            discount = orderTotal;
        }
    }
    
    return Math.round(discount * 100) / 100; // Round to 2 decimal places
}

export async function saveTenantVoucher(tenantId: string, voucher: Omit<Voucher, 'id'>): Promise<void> {
    const id = uuidv4();
    const { code, type, value, minOrder, maxDiscount, expiryDate, active, usageLimit, usedCount } = voucher;
    
    const sql = `
        INSERT INTO vouchers (id, tenant_id, code, type, value, minOrder, maxDiscount, expiryDate, active, usageLimit, usedCount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await pool.execute(sql, [
        id, tenantId, code, type, value, minOrder, maxDiscount, 
        expiryDate, active, usageLimit || null, usedCount
    ]);
}

export async function updateTenantVoucher(tenantId: string, voucher: Voucher): Promise<void> {
    const { id, code, type, value, minOrder, maxDiscount, expiryDate, active, usageLimit, usedCount } = voucher;
    
    const sql = `
        UPDATE vouchers 
        SET code = ?, type = ?, value = ?, minOrder = ?, maxDiscount = ?, 
            expiryDate = ?, active = ?, usageLimit = ?, usedCount = ?
        WHERE id = ? AND tenant_id = ?
    `;
    
    await pool.execute(sql, [
        code, type, value, minOrder, maxDiscount, 
        expiryDate, active, usageLimit || null, usedCount, id, tenantId
    ]);
}

export async function deleteTenantVoucher(tenantId: string, voucherId: string): Promise<void> {
    await pool.execute('DELETE FROM vouchers WHERE id = ? AND tenant_id = ?', [voucherId, tenantId]);
}

export async function incrementVoucherUsage(tenantId: string, voucherId: string): Promise<void> {
    await pool.execute(
        'UPDATE vouchers SET usedCount = usedCount + 1 WHERE id = ? AND tenant_id = ?',
        [voucherId, tenantId]
    );
}

export async function toggleTenantVoucherStatus(tenantId: string, voucherId: string): Promise<void> {
    await pool.execute(
        'UPDATE vouchers SET active = NOT active WHERE id = ? AND tenant_id = ?',
        [voucherId, tenantId]
    );
}
