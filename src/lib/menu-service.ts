'use server';

import pool from './db';
import type { MenuItem, Category } from './types';

// Helper to parse JSON fields which might be null or strings
function parseJsonField<T>(field: any): T | undefined {
    if (typeof field === 'string') {
        try {
            return JSON.parse(field) as T;
        } catch (e) {
            return undefined;
        }
    }
    return field ?? undefined;
}


export async function getCategories(): Promise<Category[]> {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY `order` ASC');
    return (rows as any[]).map(category => ({
        ...category,
        active: Boolean(category.active), // Ensure 'active' is a boolean
    }));
}

export async function getMenuItems(): Promise<MenuItem[]> {
    const [rows] = await pool.query('SELECT * FROM menu_items');
    
    // MariaDB/MySQL returns several fields as strings or numbers that need to be correctly typed.
    const items = (rows as any[]).map(item => ({
        ...item,
        price: parseFloat(item.price), // Ensure 'price' is a number
        available: Boolean(item.available), // Ensure 'available' is a boolean
        addons: parseJsonField(item.addons),
        characteristics: parseJsonField(item.characteristics),
        nutrition: parseJsonField(item.nutrition),
    }));

    return items as MenuItem[];
}

export async function saveCategory(category: Category): Promise<void> {
    const { id, name, description, active, order, parentId } = category;
    const sql = `
        INSERT INTO categories (id, name, description, active, \`order\`, parentId)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        active = VALUES(active),
        \`order\` = VALUES(\`order\`),
        parentId = VALUES(parentId)
    `;
    await pool.query(sql, [id, name, description, active, order, parentId || null]);
}

export async function deleteCategory(categoryId: string): Promise<void> {
    // The FOREIGN KEY on menu_items is ON DELETE SET NULL, so items will be un-categorized automatically.
    await pool.query('DELETE FROM categories WHERE id = ?', [categoryId]);
}

export async function saveMenuItem(item: MenuItem): Promise<void> {
    const { id, name, description, price, imageUrl, imageHint, available, categoryId, addons, characteristics, nutrition } = item;
    const sql = `
        INSERT INTO menu_items (id, name, description, price, imageUrl, imageHint, available, categoryId, addons, characteristics, nutrition)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        price = VALUES(price),
        imageUrl = VALUES(imageUrl),
        imageHint = VALUES(imageHint),
        available = VALUES(available),
        categoryId = VALUES(categoryId),
        addons = VALUES(addons),
        characteristics = VALUES(characteristics),
        nutrition = VALUES(nutrition)
    `;
    // Stringify JSON fields for storage
    await pool.query(sql, [
        id, name, description, price, imageUrl, imageHint, available, categoryId,
        JSON.stringify(addons || null),
        JSON.stringify(characteristics || null),
        JSON.stringify(nutrition || null)
    ]);
}

export async function deleteMenuItem(itemId: string): Promise<void> {
    await pool.query('DELETE FROM menu_items WHERE id = ?', [itemId]);
}
