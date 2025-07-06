'use server';

import pool from './db';
import type { DeliveryZone } from './types';

function parseJsonField<T>(field: any): T {
    if (typeof field === 'string') {
        try {
            return JSON.parse(field);
        } catch (e) {
            // Return a default value for the generic type if parsing fails
            return [] as T; 
        }
    }
    // Return a default value if the field is not a string or is null/undefined
    return field ?? ([] as T);
}

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
    const [rows] = await pool.query('SELECT * FROM delivery_zones');
    // The database driver might return decimal/numeric fields as strings.
    // We need to parse them into numbers before sending them to the client.
    return (rows as any[]).map(zone => ({
        ...zone,
        postcodes: parseJsonField(zone.postcodes),
        deliveryFee: parseFloat(zone.deliveryFee),
        minOrder: parseFloat(zone.minOrder),
        deliveryTime: parseInt(zone.deliveryTime, 10),
        collectionTime: parseInt(zone.collectionTime, 10),
    }));
}

export async function saveDeliveryZone(zone: DeliveryZone): Promise<void> {
    const { id, name, type, postcodes, deliveryFee, minOrder, deliveryTime, collectionTime } = zone;
    const sql = `
        INSERT INTO delivery_zones (id, name, type, postcodes, deliveryFee, minOrder, deliveryTime, collectionTime)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        type = VALUES(type),
        postcodes = VALUES(postcodes),
        deliveryFee = VALUES(deliveryFee),
        minOrder = VALUES(minOrder),
        deliveryTime = VALUES(deliveryTime),
        collectionTime = VALUES(collectionTime)
    `;
    await pool.query(sql, [id, name, type, JSON.stringify(postcodes), deliveryFee, minOrder, deliveryTime, collectionTime]);
}

export async function deleteDeliveryZone(zoneId: string): Promise<void> {
    await pool.query('DELETE FROM delivery_zones WHERE id = ?', [zoneId]);
}
