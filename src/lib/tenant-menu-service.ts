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
    try {
        const [rows] = await pool.query(
            'SELECT * FROM categories WHERE tenant_id = ? ORDER BY display_order ASC',
            [tenantId]
        );
        return (rows as any[]).map(category => ({
            id: category.id,
            name: category.name,
            active: Boolean(category.active),
            order: category.display_order,
            parentId: category.parentId,
            image: category.image,
            icon: category.icon,
            color: category.color,
        }));
    } catch (error) {
        console.error('Error in getTenantCategories:', error);
        // Fallback: try without ORDER BY if the column doesn't exist
        try {
            const [rows] = await pool.query(
                'SELECT * FROM categories WHERE tenant_id = ?',
                [tenantId]
            );
            return (rows as any[]).map(category => ({
                id: category.id,
                name: category.name,
                active: Boolean(category.active),
                order: category.display_order || category.order || 0,
                parentId: category.parentId,
                image: category.image,
                icon: category.icon,
                color: category.color,
            }));
        } catch (fallbackError) {
            console.error('Fallback query also failed:', fallbackError);
            return [];
        }
    }
}

export async function getTenantMenuItems(tenantId: string): Promise<MenuItem[]> {
    const [rows] = await pool.query(
        'SELECT * FROM menu_items WHERE tenant_id = ?',
        [tenantId]
    );
    
    // MariaDB/MySQL returns several fields as strings or numbers that need to be correctly typed.
    const items = (rows as any[]).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: parseFloat(item.price),
        image: item.image || item.imageUrl, // Support both old and new format
        imageHint: item.imageHint,
        available: Boolean(item.available),
        categoryId: item.categoryId,
        addons: parseJsonField(item.addons),
        characteristics: parseJsonField(item.characteristics),
        nutrition: parseJsonField(item.nutrition),
        isSetMenu: Boolean(item.is_set_menu),
        setMenuItems: parseJsonField(item.set_menu_items),
        preparationTime: item.preparation_time || 15,
        tags: parseJsonField(item.tags) || [],
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
        image: item.image || '',
        imageHint: item.imageHint || '',
        available: item.available ? 1 : 0,
        categoryId: item.categoryId || null,
        addons: JSON.stringify(item.addons || []),
        characteristics: JSON.stringify(item.characteristics || []),
        nutrition: item.nutrition ? JSON.stringify(item.nutrition) : null,
        isSetMenu: item.isSetMenu ? 1 : 0,
        setMenuItems: item.setMenuItems ? JSON.stringify(item.setMenuItems) : null,
        preparationTime: item.preparationTime || 15,
        tags: JSON.stringify(item.tags || []),
        tenant_id: tenantId
    };

    if ((existingItem as any[])[0].length > 0) {
        // Update existing item
        await pool.query(
            `UPDATE menu_items SET 
                name = ?, description = ?, price = ?, image = ?, imageHint = ?,
                available = ?, categoryId = ?, addons = ?, characteristics = ?, nutrition = ?,
                is_set_menu = ?, set_menu_items = ?, preparation_time = ?, tags = ?
            WHERE id = ? AND tenant_id = ?`,
            [
                itemData.name, itemData.description, itemData.price, itemData.image, itemData.imageHint,
                itemData.available, itemData.categoryId, itemData.addons, itemData.characteristics, itemData.nutrition,
                itemData.isSetMenu, itemData.setMenuItems, itemData.preparationTime, itemData.tags,
                item.id, tenantId
            ]
        );
    } else {
        // Insert new item
        await pool.query(
            `INSERT INTO menu_items 
                (id, name, description, price, image, imageHint, available, categoryId, addons, characteristics, nutrition, is_set_menu, set_menu_items, preparation_time, tags, tenant_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                item.id, itemData.name, itemData.description, itemData.price, itemData.image, itemData.imageHint,
                itemData.available, itemData.categoryId, itemData.addons, itemData.characteristics, itemData.nutrition,
                itemData.isSetMenu, itemData.setMenuItems, itemData.preparationTime, itemData.tags, tenantId
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
    try {
        const existingCategory = await pool.query(
            'SELECT id FROM categories WHERE id = ? AND tenant_id = ?',
            [category.id, tenantId]
        );

        const categoryData = {
            name: category.name,
            active: category.active ? 1 : 0,
            order: category.order || 0,
            parentId: category.parentId || null,
            image: category.image || null,
            icon: category.icon || null,
            color: category.color || null,
            tenant_id: tenantId
        };

        if ((existingCategory as any[])[0].length > 0) {
            // Update existing category
            await pool.query(
                `UPDATE categories SET 
                    name = ?, active = ?, display_order = ?, parentId = ?, image = ?, icon = ?, color = ?
                WHERE id = ? AND tenant_id = ?`,
                [
                    categoryData.name, categoryData.active, categoryData.order, categoryData.parentId,
                    categoryData.image, categoryData.icon, categoryData.color, category.id, tenantId
                ]
            );
        } else {
            // Insert new category
            await pool.query(
                `INSERT INTO categories 
                    (id, name, active, display_order, parentId, image, icon, color, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    category.id, categoryData.name, categoryData.active, categoryData.order,
                    categoryData.parentId, categoryData.image, categoryData.icon, categoryData.color, tenantId
                ]
            );
        }
    } catch (error) {
        console.error('Error in saveTenantCategory:', error);
        console.error('Category data:', category);
        console.error('Tenant ID:', tenantId);
        throw error;
    }
}

export async function deleteTenantCategory(tenantId: string, categoryId: string): Promise<void> {
    // First, set all menu items in this category to have no category
    await pool.query(
        'UPDATE menu_items SET categoryId = NULL WHERE categoryId = ? AND tenant_id = ?',
        [categoryId, tenantId]
    );
    
    // Then delete the category
    await pool.query(
        'DELETE FROM categories WHERE id = ? AND tenant_id = ?',
        [categoryId, tenantId]
    );
}

// New functions for addon groups management

export async function getTenantAddonGroups(tenantId: string): Promise<any[]> {
    const [rows] = await pool.query(
        'SELECT * FROM addon_groups WHERE tenant_id = ? ORDER BY display_order ASC',
        [tenantId]
    );
    return rows as any[];
}

export async function getTenantAddonOptions(addonGroupId: string): Promise<any[]> {
    const [rows] = await pool.query(
        'SELECT * FROM addon_options WHERE addon_group_id = ? ORDER BY display_order ASC',
        [addonGroupId]
    );
    return rows as any[];
}

export async function saveAddonGroup(tenantId: string, addonGroup: any): Promise<void> {
    const existingGroup = await pool.query(
        'SELECT id FROM addon_groups WHERE id = ? AND tenant_id = ?',
        [addonGroup.id, tenantId]
    );

    if ((existingGroup as any[])[0].length > 0) {
        // Update existing group
        await pool.query(
            `UPDATE addon_groups SET 
                name = ?, description = ?, type = ?, required = ?, multiple = ?, max_selections = ?, active = ?, display_order = ?
            WHERE id = ? AND tenant_id = ?`,
            [
                addonGroup.name, addonGroup.description, addonGroup.type, addonGroup.required, 
                addonGroup.multiple, addonGroup.maxSelections, addonGroup.active, addonGroup.displayOrder,
                addonGroup.id, tenantId
            ]
        );
    } else {
        // Insert new group
        await pool.query(
            `INSERT INTO addon_groups 
                (id, tenant_id, name, description, type, required, multiple, max_selections, active, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                addonGroup.id, tenantId, addonGroup.name, addonGroup.description, addonGroup.type,
                addonGroup.required, addonGroup.multiple, addonGroup.maxSelections, addonGroup.active, addonGroup.displayOrder
            ]
        );
    }
}

export async function deleteAddonGroup(tenantId: string, addonGroupId: string): Promise<void> {
    await pool.query(
        'DELETE FROM addon_groups WHERE id = ? AND tenant_id = ?',
        [addonGroupId, tenantId]
    );
}

export async function saveAddonOption(addonGroupId: string, option: any): Promise<void> {
    const existingOption = await pool.query(
        'SELECT id FROM addon_options WHERE id = ? AND addon_group_id = ?',
        [option.id, addonGroupId]
    );

    if ((existingOption as any[])[0].length > 0) {
        // Update existing option
        await pool.query(
            `UPDATE addon_options SET 
                name = ?, price = ?, available = ?, display_order = ?
            WHERE id = ? AND addon_group_id = ?`,
            [
                option.name, option.price, option.available, option.displayOrder,
                option.id, addonGroupId
            ]
        );
    } else {
        // Insert new option
        await pool.query(
            `INSERT INTO addon_options 
                (id, addon_group_id, name, price, available, display_order)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                option.id, addonGroupId, option.name, option.price, option.available, option.displayOrder
            ]
        );
    }
}

export async function deleteAddonOption(optionId: string): Promise<void> {
    await pool.query(
        'DELETE FROM addon_options WHERE id = ?',
        [optionId]
    );
}

// Set menu templates management

export async function getTenantSetMenuTemplates(tenantId: string): Promise<any[]> {
    const [rows] = await pool.query(
        'SELECT * FROM set_menu_templates WHERE tenant_id = ? ORDER BY name ASC',
        [tenantId]
    );
    return (rows as any[]).map(template => ({
        ...template,
        templateItems: parseJsonField(template.template_items)
    }));
}

export async function saveSetMenuTemplate(tenantId: string, template: any): Promise<void> {
    const existingTemplate = await pool.query(
        'SELECT id FROM set_menu_templates WHERE id = ? AND tenant_id = ?',
        [template.id, tenantId]
    );

    if ((existingTemplate as any[])[0].length > 0) {
        // Update existing template
        await pool.query(
            `UPDATE set_menu_templates SET 
                name = ?, description = ?, template_items = ?, active = ?
            WHERE id = ? AND tenant_id = ?`,
            [
                template.name, template.description, JSON.stringify(template.templateItems), template.active,
                template.id, tenantId
            ]
        );
    } else {
        // Insert new template
        await pool.query(
            `INSERT INTO set_menu_templates 
                (id, tenant_id, name, description, template_items, active)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                template.id, tenantId, template.name, template.description, 
                JSON.stringify(template.templateItems), template.active
            ]
        );
    }
}

export async function deleteSetMenuTemplate(tenantId: string, templateId: string): Promise<void> {
    await pool.query(
        'DELETE FROM set_menu_templates WHERE id = ? AND tenant_id = ?',
        [templateId, tenantId]
    );
}

// Helper functions for hierarchical categories

export async function getCategoriesWithSubcategories(tenantId: string): Promise<any[]> {
    const categories = await getTenantCategories(tenantId);
    
    const categoryMap = new Map();
    const rootCategories: any[] = [];
    
    // First pass: create category map
    categories.forEach(category => {
        categoryMap.set(category.id, { ...category, subcategories: [] });
    });
    
    // Second pass: organize hierarchy
    categories.forEach(category => {
        if (category.parentId) {
            const parent = categoryMap.get(category.parentId);
            if (parent) {
                parent.subcategories.push(categoryMap.get(category.id));
            }
        } else {
            rootCategories.push(categoryMap.get(category.id));
        }
    });
    
    return rootCategories;
}

export async function getMenuItemsWithFullDetails(tenantId: string): Promise<any[]> {
    const items = await getTenantMenuItems(tenantId);
    const categories = await getTenantCategories(tenantId);
    
    const categoryMap = new Map();
    categories.forEach(cat => categoryMap.set(cat.id, cat));
    
    return items.map(item => ({
        ...item,
        category: categoryMap.get(item.categoryId),
        hasImage: !!(item.image && item.image.length > 0),
        isSetMenu: item.isSetMenu || false,
        setMenuItemCount: item.setMenuItems ? item.setMenuItems.length : 0
    }));
}
