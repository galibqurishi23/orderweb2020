import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export interface GiftCard {
    id: string;
    tenant_id: string;
    card_number: string;
    card_type: 'digital' | 'physical';
    amount: number;
    remaining_balance: number;
    status: 'active' | 'redeemed' | 'expired' | 'cancelled';
    expiry_date: string | null;
    created_at: string;
    updated_at: string;
}

export interface GiftCardOrder {
    id: string;
    tenant_id: string;
    gift_card_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    recipient_name?: string;
    recipient_email?: string;
    recipient_address?: string;
    personal_message?: string;
    order_amount: number;
    payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
    payment_method?: string;
    payment_transaction_id?: string;
    delivery_status: 'pending' | 'sent' | 'delivered';
    order_date: string;
    sent_date?: string;
    delivered_date?: string;
}

export interface GiftCardTransaction {
    id: string;
    tenant_id: string;
    gift_card_id: string;
    transaction_type: 'purchase' | 'redemption' | 'refund' | 'adjustment';
    amount: number;
    remaining_balance: number;
    description?: string;
    reference_order_id?: string;
    created_by?: string;
    created_at: string;
}

export interface GiftCardSettings {
    id: string;
    tenant_id: string;
    fixed_amounts: string[];
    allow_custom_amount: boolean;
    min_custom_amount: number;
    max_custom_amount: number;
    default_expiry_months: number;
    auto_cleanup_expired: boolean;
    auto_cleanup_zero_balance: boolean;
    digital_card_template?: string;
    physical_card_instructions?: string;
    terms_and_conditions?: string;
    display_name?: string;
    cover_image_url?: string;
    created_at: string;
    updated_at: string;
}

// Generate unique gift card number
export function generateCardNumber(): string {
    const prefix = 'GC';
    const randomNum = Math.floor(Math.random() * 10000000000000000).toString().padStart(16, '0');
    return `${prefix}${randomNum}`;
}

// Gift Card Settings
export async function getGiftCardSettings(tenantId: string): Promise<GiftCardSettings | null> {
    const [rows] = await db.query(
        'SELECT * FROM gift_card_settings WHERE tenant_id = ?',
        [tenantId]
    ) as any[];
    
    if (rows.length === 0) return null;
    
    const settings = rows[0];
    return {
        ...settings,
        fixed_amounts: JSON.parse(settings.fixed_amounts || '[]')
    };
}

export async function updateGiftCardSettings(tenantId: string, settings: Partial<GiftCardSettings>): Promise<GiftCardSettings> {
    const updates = { ...settings };
    if (updates.fixed_amounts) {
        updates.fixed_amounts = JSON.stringify(updates.fixed_amounts) as any;
    }
    
    // Remove undefined/null values and fields that shouldn't be updated
    const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([key, value]) => 
            value !== undefined && 
            value !== null && 
            key !== 'id' && 
            key !== 'tenant_id' && 
            key !== 'created_at' && 
            key !== 'updated_at'
        )
    );
    
    if (Object.keys(cleanUpdates).length === 0) {
        throw new Error('No valid fields to update');
    }
    
    const fields = Object.keys(cleanUpdates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(cleanUpdates);
    
    const query = `UPDATE gift_card_settings SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = ?`;
    
    const [result] = await db.execute(query, [...values, tenantId]) as any[];
    
    if (result.affectedRows === 0) {
        throw new Error(`No gift card settings found for tenant: ${tenantId}`);
    }
    
    // Return the updated settings
    const updatedSettings = await getGiftCardSettings(tenantId);
    if (!updatedSettings) {
        throw new Error('Failed to retrieve updated settings');
    }
    return updatedSettings;
}

// Gift Cards
export async function createGiftCard(tenantId: string, cardData: {
    card_type: 'digital' | 'physical';
    amount: number;
    expiry_months?: number;
}): Promise<GiftCard> {
    const id = uuidv4();
    const cardNumber = generateCardNumber();
    const expiryDate = cardData.expiry_months 
        ? new Date(Date.now() + cardData.expiry_months * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null;
    
    await db.execute(
        `INSERT INTO gift_cards (id, tenant_id, card_number, card_type, amount, remaining_balance, expiry_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, tenantId, cardNumber, cardData.card_type, cardData.amount, cardData.amount, expiryDate]
    );
    
    const [rows] = await db.query('SELECT * FROM gift_cards WHERE id = ?', [id]) as any[];
    return rows[0];
}

export async function getGiftCard(tenantId: string, cardNumber: string): Promise<GiftCard | null> {
    const [rows] = await db.query(
        'SELECT * FROM gift_cards WHERE tenant_id = ? AND card_number = ?',
        [tenantId, cardNumber]
    ) as any[];
    
    return rows.length > 0 ? rows[0] : null;
}

export async function getTenantGiftCards(tenantId: string, status?: string): Promise<GiftCard[]> {
    let query = 'SELECT * FROM gift_cards WHERE tenant_id = ?';
    const params = [tenantId];
    
    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await db.query(query, params) as any[];
    return rows;
}

export async function redeemGiftCard(tenantId: string, cardNumber: string, amount: number, description?: string): Promise<boolean> {
    const card = await getGiftCard(tenantId, cardNumber);
    if (!card || card.status !== 'active' || card.remaining_balance < amount) {
        return false;
    }
    
    const newBalance = card.remaining_balance - amount;
    const newStatus = newBalance === 0 ? 'redeemed' : 'active';
    
    // Update gift card
    await db.execute(
        'UPDATE gift_cards SET remaining_balance = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newBalance, newStatus, card.id]
    );
    
    // Record transaction
    await db.execute(
        `INSERT INTO gift_card_transactions (id, tenant_id, gift_card_id, transaction_type, amount, remaining_balance, description) 
         VALUES (?, ?, ?, 'redemption', ?, ?, ?)`,
        [uuidv4(), tenantId, card.id, amount, newBalance, description || 'Gift card redemption']
    );
    
    return true;
}

// Gift Card Orders
export async function createGiftCardOrder(tenantId: string, orderData: Omit<GiftCardOrder, 'id' | 'tenant_id' | 'order_date'>): Promise<GiftCardOrder> {
    const id = uuidv4();
    
    const fields = Object.keys(orderData).join(', ');
    const placeholders = Object.keys(orderData).map(() => '?').join(', ');
    const values = Object.values(orderData);
    
    await db.execute(
        `INSERT INTO gift_card_orders (id, tenant_id, ${fields}) VALUES (?, ?, ${placeholders})`,
        [id, tenantId, ...values]
    );
    
    const [rows] = await db.query('SELECT * FROM gift_card_orders WHERE id = ?', [id]) as any[];
    return rows[0];
}

export async function getTenantGiftCardOrders(tenantId: string): Promise<GiftCardOrder[]> {
    const [rows] = await db.query(
        `SELECT gco.*, gc.card_number, gc.card_type, gc.amount as gift_card_amount 
         FROM gift_card_orders gco 
         JOIN gift_cards gc ON gco.gift_card_id = gc.id 
         WHERE gco.tenant_id = ? 
         ORDER BY gco.order_date DESC`,
        [tenantId]
    ) as any[];
    
    return rows;
}

export async function updateOrderStatus(tenantId: string, orderId: string, updates: {
    payment_status?: string;
    delivery_status?: string;
    payment_transaction_id?: string;
}): Promise<void> {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    let additionalField = '';
    if (updates.delivery_status === 'sent') {
        additionalField = ', sent_date = CURRENT_TIMESTAMP';
    } else if (updates.delivery_status === 'delivered') {
        additionalField = ', delivered_date = CURRENT_TIMESTAMP';
    }
    
    await db.execute(
        `UPDATE gift_card_orders SET ${fields}${additionalField} WHERE id = ? AND tenant_id = ?`,
        [...values, orderId, tenantId]
    );
}

// Gift Card Transactions
export async function getGiftCardTransactions(tenantId: string, cardId?: string): Promise<GiftCardTransaction[]> {
    let query = 'SELECT * FROM gift_card_transactions WHERE tenant_id = ?';
    const params = [tenantId];
    
    if (cardId) {
        query += ' AND gift_card_id = ?';
        params.push(cardId);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await db.query(query, params) as any[];
    return rows;
}

// Cleanup functions
export async function cleanupExpiredCards(tenantId: string): Promise<number> {
    const [result] = await db.execute(
        `UPDATE gift_cards SET status = 'expired' 
         WHERE tenant_id = ? AND status = 'active' AND expiry_date < CURDATE()`,
        [tenantId]
    ) as any[];
    
    return result.affectedRows;
}

export async function cleanupZeroBalanceCards(tenantId: string): Promise<number> {
    const [result] = await db.execute(
        `DELETE FROM gift_cards 
         WHERE tenant_id = ? AND remaining_balance = 0 AND status = 'redeemed'`,
        [tenantId]
    ) as any[];
    
    return result.affectedRows;
}
