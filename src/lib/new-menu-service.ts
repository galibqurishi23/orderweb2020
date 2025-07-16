'use server';

import db from './db';
import { RowDataPacket } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import {
    MenuCategory,
    MenuItem,
    AddonGroup,
    AddonOption,
    CreateCategoryRequest,
    UpdateCategoryRequest,
    CreateMenuItemRequest,
    UpdateMenuItemRequest,
    CreateAddonGroupRequest,
    UpdateAddonGroupRequest,
    CreateAddonOptionRequest,
    UpdateAddonOptionRequest,
    MenuWithCategories,
    MenuStats,
    DatabaseResult
} from './menu-types';

// ==================== UTILITY FUNCTIONS ====================

function parseJsonField<T>(field: any): T | null {
    if (typeof field === 'string') {
        try {
            return JSON.parse(field) as T;
        } catch (e) {
            console.warn('Failed to parse JSON field:', field);
            return null;
        }
    }
    return field ?? null;
}

function validateTenantId(tenantId: string): void {
    if (!tenantId || typeof tenantId !== 'string') {
        throw new Error('Valid tenant ID is required');
    }
}

function generateId(): string {
    return uuidv4();
}

// ==================== CATEGORY OPERATIONS ====================

export async function getCategories(tenantId: string): Promise<MenuCategory[]> {
    validateTenantId(tenantId);
    
    try {
        const [rows] = await db.query<RowDataPacket[]>(
            `SELECT 
                id, tenant_id, name, description, active, display_order, 
                parent_id, image_url, icon, color, created_at, updated_at
            FROM categories 
            WHERE tenant_id = ? 
            ORDER BY display_order ASC, name ASC`,
            [tenantId]
        );

        return rows.map(row => ({
            id: row.id,
            tenantId: row.tenant_id,
            name: row.name,
            description: row.description,
            active: Boolean(row.active),
            displayOrder: row.display_order || 0,
            parentId: row.parent_id,
            imageUrl: row.image_url,
            icon: row.icon,
            color: row.color,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw new Error('Failed to fetch categories');
    }
}

export async function getCategoryById(tenantId: string, categoryId: string): Promise<MenuCategory | null> {
    validateTenantId(tenantId);
    
    if (!categoryId) {
        throw new Error('Category ID is required');
    }

    try {
        const [rows] = await db.query<RowDataPacket[]>(
            `SELECT 
                id, tenant_id, name, description, active, display_order, 
                parent_id, image_url, icon, color, created_at, updated_at
            FROM categories 
            WHERE tenant_id = ? AND id = ?`,
            [tenantId, categoryId]
        );

        if (rows.length === 0) {
            return null;
        }

        const row = rows[0];
        return {
            id: row.id,
            tenantId: row.tenant_id,
            name: row.name,
            description: row.description,
            active: Boolean(row.active),
            displayOrder: row.display_order || 0,
            parentId: row.parent_id,
            imageUrl: row.image_url,
            icon: row.icon,
            color: row.color,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    } catch (error) {
        console.error('Error fetching category by ID:', error);
        throw new Error('Failed to fetch category');
    }
}

export async function createCategory(tenantId: string, categoryData: CreateCategoryRequest): Promise<MenuCategory> {
    validateTenantId(tenantId);
    
    if (!categoryData.name?.trim()) {
        throw new Error('Category name is required');
    }

    const categoryId = generateId();
    const now = new Date();

    try {
        await db.execute(
            `INSERT INTO categories (
                id, tenant_id, name, description, active, display_order, 
                parent_id, image_url, icon, color, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                categoryId,
                tenantId,
                categoryData.name.trim(),
                categoryData.description?.trim() || null,
                categoryData.active !== false,
                categoryData.displayOrder || 0,
                categoryData.parentId || null,
                categoryData.imageUrl?.trim() || null,
                categoryData.icon?.trim() || null,
                categoryData.color?.trim() || null,
                now,
                now
            ]
        );

        const createdCategory = await getCategoryById(tenantId, categoryId);
        if (!createdCategory) {
            throw new Error('Failed to retrieve created category');
        }

        return createdCategory;
    } catch (error) {
        console.error('Error creating category:', error);
        throw new Error('Failed to create category');
    }
}

export async function updateCategory(tenantId: string, categoryData: UpdateCategoryRequest): Promise<MenuCategory> {
    validateTenantId(tenantId);
    
    if (!categoryData.id) {
        throw new Error('Category ID is required');
    }

    // Check if category exists
    const existingCategory = await getCategoryById(tenantId, categoryData.id);
    if (!existingCategory) {
        throw new Error('Category not found');
    }

    try {
        const updates: string[] = [];
        const values: any[] = [];

        if (categoryData.name !== undefined) {
            if (!categoryData.name.trim()) {
                throw new Error('Category name cannot be empty');
            }
            updates.push('name = ?');
            values.push(categoryData.name.trim());
        }

        if (categoryData.description !== undefined) {
            updates.push('description = ?');
            values.push(categoryData.description?.trim() || null);
        }

        if (categoryData.active !== undefined) {
            updates.push('active = ?');
            values.push(categoryData.active);
        }

        if (categoryData.displayOrder !== undefined) {
            updates.push('display_order = ?');
            values.push(categoryData.displayOrder);
        }

        if (categoryData.parentId !== undefined) {
            updates.push('parent_id = ?');
            values.push(categoryData.parentId || null);
        }

        if (categoryData.imageUrl !== undefined) {
            updates.push('image_url = ?');
            values.push(categoryData.imageUrl?.trim() || null);
        }

        if (categoryData.icon !== undefined) {
            updates.push('icon = ?');
            values.push(categoryData.icon?.trim() || null);
        }

        if (categoryData.color !== undefined) {
            updates.push('color = ?');
            values.push(categoryData.color?.trim() || null);
        }

        if (updates.length === 0) {
            return existingCategory;
        }

        updates.push('updated_at = ?');
        values.push(new Date());

        values.push(categoryData.id);
        values.push(tenantId);

        await db.execute(
            `UPDATE categories SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`,
            values
        );

        const updatedCategory = await getCategoryById(tenantId, categoryData.id);
        if (!updatedCategory) {
            throw new Error('Failed to retrieve updated category');
        }

        return updatedCategory;
    } catch (error) {
        console.error('Error updating category:', error);
        throw new Error('Failed to update category');
    }
}

export async function deleteCategory(tenantId: string, categoryId: string): Promise<void> {
    validateTenantId(tenantId);
    
    if (!categoryId) {
        throw new Error('Category ID is required');
    }

    try {
        // Update menu items to remove category reference
        await db.execute(
            'UPDATE menu_items SET category_id = NULL WHERE category_id = ? AND tenant_id = ?',
            [categoryId, tenantId]
        );

        // Delete the category
        const [result] = await db.execute(
            'DELETE FROM categories WHERE id = ? AND tenant_id = ?',
            [categoryId, tenantId]
        );

        if ((result as DatabaseResult).affectedRows === 0) {
            throw new Error('Category not found');
        }
    } catch (error) {
        console.error('Error deleting category:', error);
        throw new Error('Failed to delete category');
    }
}

// ==================== MENU ITEM OPERATIONS ====================

export async function getMenuItems(tenantId: string): Promise<MenuItem[]> {
    validateTenantId(tenantId);
    
    try {
        const [rows] = await db.query<RowDataPacket[]>(
            `SELECT 
                id, tenant_id, category_id, name, description, price, image_url, 
                image_hint, available, is_featured, is_set_menu, preparation_time,
                addons, characteristics, nutrition, set_menu_items, tags, created_at, updated_at
            FROM menu_items 
            WHERE tenant_id = ? 
            ORDER BY name ASC`,
            [tenantId]
        );

        return rows.map(row => ({
            id: row.id,
            tenantId: row.tenant_id,
            categoryId: row.category_id,
            name: row.name,
            description: row.description,
            price: parseFloat(row.price),
            imageUrl: row.image_url,
            imageHint: row.image_hint,
            available: Boolean(row.available),
            isFeatured: Boolean(row.is_featured),
            isSetMenu: Boolean(row.is_set_menu),
            preparationTime: row.preparation_time || 15,
            addons: parseJsonField(row.addons) || [],
            characteristics: parseJsonField(row.characteristics) || [],
            nutrition: parseJsonField(row.nutrition) || undefined,
            setMenuItems: parseJsonField(row.set_menu_items) || [],
            tags: parseJsonField(row.tags) || [],
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));
    } catch (error) {
        console.error('Error fetching menu items:', error);
        throw new Error('Failed to fetch menu items');
    }
}

export async function getMenuItemById(tenantId: string, itemId: string): Promise<MenuItem | null> {
    validateTenantId(tenantId);
    
    if (!itemId) {
        throw new Error('Item ID is required');
    }

    try {
        const [rows] = await db.query<RowDataPacket[]>(
            `SELECT 
                id, tenant_id, category_id, name, description, price, image_url, 
                image_hint, available, is_featured, is_set_menu, preparation_time,
                addons, characteristics, nutrition, set_menu_items, tags, created_at, updated_at
            FROM menu_items 
            WHERE tenant_id = ? AND id = ?`,
            [tenantId, itemId]
        );

        if (rows.length === 0) {
            return null;
        }

        const row = rows[0];
        return {
            id: row.id,
            tenantId: row.tenant_id,
            categoryId: row.category_id,
            name: row.name,
            description: row.description,
            price: parseFloat(row.price),
            imageUrl: row.image_url,
            imageHint: row.image_hint,
            available: Boolean(row.available),
            isFeatured: Boolean(row.is_featured),
            isSetMenu: Boolean(row.is_set_menu),
            preparationTime: row.preparation_time || 15,
            addons: parseJsonField(row.addons) || [],
            characteristics: parseJsonField(row.characteristics) || [],
            nutrition: parseJsonField(row.nutrition) || undefined,
            setMenuItems: parseJsonField(row.set_menu_items) || [],
            tags: parseJsonField(row.tags) || [],
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    } catch (error) {
        console.error('Error fetching menu item by ID:', error);
        throw new Error('Failed to fetch menu item');
    }
}

export async function createMenuItem(tenantId: string, itemData: CreateMenuItemRequest): Promise<MenuItem> {
    validateTenantId(tenantId);
    
    if (!itemData.name?.trim()) {
        throw new Error('Menu item name is required');
    }

    if (itemData.price === undefined || itemData.price < 0) {
        throw new Error('Valid price is required');
    }

    const itemId = generateId();
    const now = new Date();

    try {
        await db.execute(
            `INSERT INTO menu_items (
                id, tenant_id, category_id, name, description, price, image_url, 
                image_hint, available, is_featured, is_set_menu, preparation_time,
                addons, characteristics, nutrition, set_menu_items, tags, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                itemId,
                tenantId,
                itemData.categoryId || null,
                itemData.name.trim(),
                itemData.description?.trim() || null,
                itemData.price,
                itemData.imageUrl?.trim() || null,
                itemData.imageHint?.trim() || null,
                itemData.available !== false,
                itemData.isFeatured || false,
                itemData.isSetMenu || false,
                itemData.preparationTime || 15,
                JSON.stringify(itemData.addons || []),
                JSON.stringify(itemData.characteristics || []),
                JSON.stringify(itemData.nutrition || null),
                JSON.stringify(itemData.setMenuItems || []),
                JSON.stringify(itemData.tags || []),
                now,
                now
            ]
        );

        const createdItem = await getMenuItemById(tenantId, itemId);
        if (!createdItem) {
            throw new Error('Failed to retrieve created menu item');
        }

        return createdItem;
    } catch (error) {
        console.error('Error creating menu item:', error);
        throw new Error('Failed to create menu item');
    }
}

export async function updateMenuItem(tenantId: string, itemData: UpdateMenuItemRequest): Promise<MenuItem> {
    validateTenantId(tenantId);
    
    if (!itemData.id) {
        throw new Error('Menu item ID is required');
    }

    // Check if item exists
    const existingItem = await getMenuItemById(tenantId, itemData.id);
    if (!existingItem) {
        throw new Error('Menu item not found');
    }

    try {
        const updates: string[] = [];
        const values: any[] = [];

        if (itemData.name !== undefined) {
            if (!itemData.name.trim()) {
                throw new Error('Menu item name cannot be empty');
            }
            updates.push('name = ?');
            values.push(itemData.name.trim());
        }

        if (itemData.description !== undefined) {
            updates.push('description = ?');
            values.push(itemData.description?.trim() || null);
        }

        if (itemData.price !== undefined) {
            if (itemData.price < 0) {
                throw new Error('Price cannot be negative');
            }
            updates.push('price = ?');
            values.push(itemData.price);
        }

        if (itemData.categoryId !== undefined) {
            updates.push('category_id = ?');
            values.push(itemData.categoryId || null);
        }

        if (itemData.imageUrl !== undefined) {
            updates.push('image_url = ?');
            values.push(itemData.imageUrl?.trim() || null);
        }

        if (itemData.imageHint !== undefined) {
            updates.push('image_hint = ?');
            values.push(itemData.imageHint?.trim() || null);
        }

        if (itemData.available !== undefined) {
            updates.push('available = ?');
            values.push(itemData.available);
        }

        if (itemData.isFeatured !== undefined) {
            updates.push('is_featured = ?');
            values.push(itemData.isFeatured);
        }

        if (itemData.isSetMenu !== undefined) {
            updates.push('is_set_menu = ?');
            values.push(itemData.isSetMenu);
        }

        if (itemData.preparationTime !== undefined) {
            updates.push('preparation_time = ?');
            values.push(itemData.preparationTime);
        }

        if (itemData.addons !== undefined) {
            updates.push('addons = ?');
            values.push(JSON.stringify(itemData.addons || []));
        }

        if (itemData.characteristics !== undefined) {
            updates.push('characteristics = ?');
            values.push(JSON.stringify(itemData.characteristics || []));
        }

        if (itemData.nutrition !== undefined) {
            updates.push('nutrition = ?');
            values.push(JSON.stringify(itemData.nutrition || null));
        }

        if (itemData.setMenuItems !== undefined) {
            updates.push('set_menu_items = ?');
            values.push(JSON.stringify(itemData.setMenuItems || []));
        }

        if (itemData.tags !== undefined) {
            updates.push('tags = ?');
            values.push(JSON.stringify(itemData.tags || []));
        }

        if (updates.length === 0) {
            return existingItem;
        }

        updates.push('updated_at = ?');
        values.push(new Date());

        values.push(itemData.id);
        values.push(tenantId);

        await db.execute(
            `UPDATE menu_items SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`,
            values
        );

        const updatedItem = await getMenuItemById(tenantId, itemData.id);
        if (!updatedItem) {
            throw new Error('Failed to retrieve updated menu item');
        }

        return updatedItem;
    } catch (error) {
        console.error('Error updating menu item:', error);
        throw new Error('Failed to update menu item');
    }
}

export async function deleteMenuItem(tenantId: string, itemId: string): Promise<void> {
    validateTenantId(tenantId);
    
    if (!itemId) {
        throw new Error('Menu item ID is required');
    }

    try {
        const [result] = await db.execute(
            'DELETE FROM menu_items WHERE id = ? AND tenant_id = ?',
            [itemId, tenantId]
        );

        if ((result as DatabaseResult).affectedRows === 0) {
            throw new Error('Menu item not found');
        }
    } catch (error) {
        console.error('Error deleting menu item:', error);
        throw new Error('Failed to delete menu item');
    }
}

// ==================== COMBINED OPERATIONS ====================

export async function getMenuWithCategories(tenantId: string): Promise<MenuWithCategories[]> {
    validateTenantId(tenantId);
    
    try {
        const [categories, menuItems] = await Promise.all([
            getCategories(tenantId),
            getMenuItems(tenantId)
        ]);

        return categories.map(category => ({
            category,
            items: menuItems.filter(item => item.categoryId === category.id)
        }));
    } catch (error) {
        console.error('Error fetching menu with categories:', error);
        throw new Error('Failed to fetch menu with categories');
    }
}

export async function getMenuStats(tenantId: string): Promise<MenuStats> {
    validateTenantId(tenantId);
    
    try {
        const [stats] = await db.query<RowDataPacket[]>(
            `SELECT 
                (SELECT COUNT(*) FROM categories WHERE tenant_id = ?) as total_categories,
                (SELECT COUNT(*) FROM menu_items WHERE tenant_id = ?) as total_menu_items,
                (SELECT COUNT(*) FROM addon_groups WHERE tenant_id = ?) as total_addon_groups,
                (SELECT COUNT(*) FROM addon_options ao JOIN addon_groups ag ON ao.addon_group_id = ag.id WHERE ag.tenant_id = ?) as total_addon_options,
                (SELECT COUNT(*) FROM categories WHERE tenant_id = ? AND active = true) as active_categories,
                (SELECT COUNT(*) FROM menu_items WHERE tenant_id = ? AND available = true) as active_menu_items,
                (SELECT COUNT(*) FROM menu_items WHERE tenant_id = ? AND is_featured = true) as featured_items,
                (SELECT COUNT(*) FROM menu_items WHERE tenant_id = ? AND is_set_menu = true) as set_menu_items`,
            [tenantId, tenantId, tenantId, tenantId, tenantId, tenantId, tenantId, tenantId]
        );

        const row = stats[0];
        return {
            totalCategories: row.total_categories || 0,
            totalMenuItems: row.total_menu_items || 0,
            totalAddonGroups: row.total_addon_groups || 0,
            totalAddonOptions: row.total_addon_options || 0,
            activeCategories: row.active_categories || 0,
            activeMenuItems: row.active_menu_items || 0,
            featuredItems: row.featured_items || 0,
            setMenuItems: row.set_menu_items || 0
        };
    } catch (error) {
        console.error('Error fetching menu stats:', error);
        throw new Error('Failed to fetch menu stats');
    }
}
