'use server';

import pool from './db';
import type { Voucher } from './types';

export async function getVouchers(): Promise<Voucher[]> {
    const [rows] = await pool.query('SELECT * FROM vouchers');
    return (rows as any[]).map(v => ({
        ...v,
        value: parseFloat(v.value),
        minOrder: parseFloat(v.minOrder),
        maxDiscount: v.maxDiscount ? parseFloat(v.maxDiscount) : undefined,
        expiryDate: new Date(v.expiryDate),
        active: Boolean(v.active),
        usageLimit: Number(v.usageLimit),
        usedCount: Number(v.usedCount)
    }));
}

export async function saveVoucher(voucher: Voucher): Promise<void> {
    const { id, code, type, value, minOrder, maxDiscount, expiryDate, active, usageLimit, usedCount } = voucher;
    const sql = `
        INSERT INTO vouchers (id, code, type, value, minOrder, maxDiscount, expiryDate, active, usageLimit, usedCount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        code = VALUES(code),
        type = VALUES(type),
        value = VALUES(value),
        minOrder = VALUES(minOrder),
        maxDiscount = VALUES(maxDiscount),
        expiryDate = VALUES(expiryDate),
        active = VALUES(active),
        usageLimit = VALUES(usageLimit),
        usedCount = VALUES(usedCount)
    `;
    await pool.query(sql, [id, code, type, value, minOrder, maxDiscount, expiryDate, active, usageLimit, usedCount]);
}

export async function deleteVoucher(voucherId: string): Promise<void> {
    await pool.query('DELETE FROM vouchers WHERE id = ?', [voucherId]);
}
