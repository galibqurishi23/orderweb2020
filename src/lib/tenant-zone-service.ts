'use server';

import pool from './db';
import type { DeliveryZone } from './types';

function parseJsonField<T>(field: any): T {
    if (typeof field === 'string') {
        try {
            return JSON.parse(field);
        } catch (e) {
            return [] as T; 
        }
    }
    return field ?? ([] as T);
}

export async function getTenantDeliveryZones(tenantId: string): Promise<DeliveryZone[]> {
    const [rows] = await pool.query('SELECT * FROM delivery_zones WHERE tenant_id = ?', [tenantId]);
    return (rows as any[]).map(zone => ({
        ...zone,
        postcodes: parseJsonField(zone.postcodes),
        deliveryFee: parseFloat(zone.delivery_fee),
        minOrder: parseFloat(zone.min_order),
        deliveryTime: parseInt(zone.delivery_time, 10),
        collectionTime: parseInt(zone.collection_time, 10),
    }));
}

export async function validateDeliveryPostcode(tenantId: string, postcode: string): Promise<{ valid: boolean; zone?: DeliveryZone; error?: string }> {
    const zones = await getTenantDeliveryZones(tenantId);
    
    if (zones.length === 0) {
        // If no zones are configured, assume delivery is available everywhere
        return { valid: true };
    }
    
    // Normalize postcode (remove spaces, convert to uppercase)
    const normalizedPostcode = postcode.replace(/\s/g, '').toUpperCase();
    
    for (const zone of zones) {
        if (zone.postcodes && zone.postcodes.length > 0) {
            // Check if postcode matches any in this zone
            const matches = zone.postcodes.some(zonePostcode => {
                const normalizedZonePostcode = zonePostcode.replace(/\s/g, '').toUpperCase();
                
                // Exact match
                if (normalizedZonePostcode === normalizedPostcode) {
                    return true;
                }
                
                // Partial match (e.g., "SW1" matches "SW1A 1AA")
                if (normalizedPostcode.startsWith(normalizedZonePostcode)) {
                    return true;
                }
                
                return false;
            });
            
            if (matches) {
                return { valid: true, zone };
            }
        }
    }
    
    return { valid: false, error: 'Delivery not available to this postcode' };
}

export async function calculateDeliveryFee(tenantId: string, postcode: string, orderValue: number): Promise<{ fee: number; zone?: DeliveryZone; error?: string }> {
    const validation = await validateDeliveryPostcode(tenantId, postcode);
    
    if (!validation.valid) {
        return { fee: 0, error: validation.error };
    }
    
    if (!validation.zone) {
        // No specific zone, use default delivery fee
        return { fee: 2.50 }; // Default delivery fee
    }
    
    // Check minimum order value
    if (orderValue < validation.zone.minOrder) {
        return { 
            fee: 0, 
            error: `Minimum order value for this area is £${validation.zone.minOrder.toFixed(2)}` 
        };
    }
    
    return { fee: validation.zone.deliveryFee, zone: validation.zone };
}

export async function getDeliveryTime(tenantId: string, postcode: string): Promise<number> {
    const validation = await validateDeliveryPostcode(tenantId, postcode);
    
    if (validation.zone && validation.zone.deliveryTime) {
        return validation.zone.deliveryTime;
    }
    
    // Default delivery time (30 minutes)
    return 30;
}

export async function saveTenantDeliveryZone(tenantId: string, zone: DeliveryZone): Promise<void> {
    if (zone.id) {
        // Update existing zone
        const { id, name, type, postcodes, deliveryFee, minOrder, deliveryTime, collectionTime } = zone;
        const sql = `
            UPDATE delivery_zones 
            SET name = ?, type = ?, postcodes = ?, delivery_fee = ?, min_order = ?, delivery_time = ?, collection_time = ?
            WHERE id = ? AND tenant_id = ?
        `;
        await pool.execute(sql, [name, type, JSON.stringify(postcodes), deliveryFee, minOrder, deliveryTime, collectionTime, id, tenantId]);
    } else {
        // Create new zone
        const { name, type, postcodes, deliveryFee, minOrder, deliveryTime, collectionTime } = zone;
        const sql = `
            INSERT INTO delivery_zones (id, tenant_id, name, type, postcodes, delivery_fee, min_order, delivery_time, collection_time)
            VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await pool.execute(sql, [tenantId, name, type, JSON.stringify(postcodes), deliveryFee, minOrder, deliveryTime, collectionTime]);
    }
}

export async function deleteTenantDeliveryZone(tenantId: string, zoneId: string): Promise<void> {
    await pool.execute('DELETE FROM delivery_zones WHERE id = ? AND tenant_id = ?', [zoneId, tenantId]);
}
