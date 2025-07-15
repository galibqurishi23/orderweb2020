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

export async function getTenantCategories(tenantId: string): Promise<Category[]> {
    const [rows] = await pool.query(
        'SELECT * FROM categories WHERE tenant_id = ? ORDER BY display_order ASC',
        [tenantId]
    );
    return (rows as any[]).map(category => ({
        ...category,
        active: Boolean(category.active), // Ensure 'active' is a boolean
    }));
}

export async function getTenantMenuItems(tenantId: string): Promise<MenuItem[]> {
    const [rows] = await pool.query(
        'SELECT * FROM menu_items WHERE tenant_id = ?',
        [tenantId]
    );
    
    // MariaDB/MySQL returns several fields as strings or numbers that need to be correctly typed.
    const items = (rows as any[]).map(item => ({
        ...item,
        categoryId: item.category_id,
        imageUrl: item.image_url,
        imageHint: item.image_hint,
        price: parseFloat(item.price), // Ensure 'price' is a number
        available: Boolean(item.available), // Ensure 'available' is a boolean
        addons: parseJsonField(item.addons),
        characteristics: parseJsonField(item.characteristics),
        nutrition: parseJsonField(item.nutrition),
    }));

    return items as MenuItem[];
}

export async function getTenantMenuWithCategories(tenantId: string) {
    const [categories, menuItems] = await Promise.all([
        getTenantCategories(tenantId),
        getTenantMenuItems(tenantId)
    ]);

    return categories.map(category => ({
        category,
        items: menuItems.filter(item => item.categoryId === category.id)
    }));
}

export async function saveTenantMenuItem(tenantId: string, item: MenuItem): Promise<void> {
    const existingItem = await pool.query(
        'SELECT id FROM menu_items WHERE id = ? AND tenant_id = ?',
        [item.id, tenantId]
    );

    const itemData = {
        name: item.name,
        description: item.description || '',
        price: item.price,
        image_url: item.imageUrl || '',
        image_hint: item.imageHint || '',
        available: item.available ? 1 : 0,
        category_id: item.categoryId || null,
        addons: JSON.stringify(item.addons || []),
        characteristics: JSON.stringify(item.characteristics || []),
        nutrition: item.nutrition ? JSON.stringify(item.nutrition) : null,
        tenant_id: tenantId
    };

    if ((existingItem as any[])[0].length > 0) {
        // Update existing item
        await pool.query(
            `UPDATE menu_items SET 
                name = ?, description = ?, price = ?, image_url = ?, image_hint = ?,
                available = ?, category_id = ?, addons = ?, characteristics = ?, nutrition = ?
            WHERE id = ? AND tenant_id = ?`,
            [
                itemData.name, itemData.description, itemData.price, itemData.image_url, itemData.image_hint,
                itemData.available, itemData.category_id, itemData.addons, itemData.characteristics, itemData.nutrition,
                item.id, tenantId
            ]
        );
    } else {
        // Insert new item
        await pool.query(
            `INSERT INTO menu_items 
                (id, name, description, price, image_url, image_hint, available, category_id, addons, characteristics, nutrition, tenant_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                item.id, itemData.name, itemData.description, itemData.price, itemData.image_url, itemData.image_hint,
                itemData.available, itemData.category_id, itemData.addons, itemData.characteristics, itemData.nutrition, tenantId
            ]
        );
    }
}

export async function deleteTenantMenuItem(tenantId: string, itemId: string): Promise<void> {
    await pool.query(
        'DELETE FROM menu_items WHERE id = ? AND tenant_id = ?',
        [itemId, tenantId]
    );
}

export async function saveTenantCategory(tenantId: string, category: Category): Promise<void> {
    const existingCategory = await pool.query(
        'SELECT id FROM categories WHERE id = ? AND tenant_id = ?',
        [category.id, tenantId]
    );

    const categoryData = {
        name: category.name,
        description: category.description || '',
        active: category.active ? 1 : 0,
        display_order: category.order || 0,
        parent_id: category.parentId || null,
        tenant_id: tenantId
    };

    if ((existingCategory as any[])[0].length > 0) {
        // Update existing category
        await pool.query(
            `UPDATE categories SET 
                name = ?, description = ?, active = ?, display_order = ?, parent_id = ?
            WHERE id = ? AND tenant_id = ?`,
            [
                categoryData.name, categoryData.description, categoryData.active, categoryData.display_order, categoryData.parent_id,
                category.id, tenantId
            ]
        );
    } else {
        // Insert new category
        await pool.query(
            `INSERT INTO categories 
                (id, name, description, active, display_order, parent_id, tenant_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                category.id, categoryData.name, categoryData.description, categoryData.active, 
                categoryData.display_order, categoryData.parent_id, tenantId
            ]
        );
    }
}

export async function deleteTenantCategory(tenantId: string, categoryId: string): Promise<void> {
    // First, set all menu items in this category to have no category
    await pool.query(
        'UPDATE menu_items SET category_id = NULL WHERE category_id = ? AND tenant_id = ?',
        [categoryId, tenantId]
    );
    
    // Then delete the category
    await pool.query(
        'DELETE FROM categories WHERE id = ? AND tenant_id = ?',
        [categoryId, tenantId]
    );
}
