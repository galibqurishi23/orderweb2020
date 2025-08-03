// New Menu Management Type Definitions
export interface MenuCategory {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    active: boolean;
    displayOrder: number;
    parentId?: string;
    imageUrl?: string;
    icon?: string;
    color?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface MenuItem {
    id: string;
    tenantId: string;
    categoryId?: string;
    name: string;
    description?: string;
    price: number;
    image?: string; // Changed from imageUrl to image for base64 storage
    imageHint?: string;
    available: boolean;
    isFeatured: boolean;
    isSetMenu: boolean;
    preparationTime: number;
    characteristics?: ItemCharacteristic[];
    nutrition?: NutritionInfo;
    setMenuItems?: SetMenuItem[];
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ItemCharacteristic {
    id: string;
    name: string;
    icon?: string;
    color?: string;
}

export interface NutritionInfo {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
}

export interface SetMenuItem {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    options?: string[];
}

// API Response types
export interface MenuApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface MenuWithCategories {
    category: MenuCategory;
    items: MenuItem[];
}

// Validation schemas (for input validation)
export interface CreateCategoryRequest {
    name: string;
    description?: string;
    active?: boolean;
    displayOrder?: number;
    parentId?: string;
    imageUrl?: string;
    icon?: string;
    color?: string;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
    id: string;
}

export interface CreateMenuItemRequest {
    name: string;
    description?: string;
    price: number;
    categoryId?: string;
    image?: string; // Changed from imageUrl to image for base64 storage
    imageHint?: string;
    available?: boolean;
    isFeatured?: boolean;
    isSetMenu?: boolean;
    preparationTime?: number;
    characteristics?: ItemCharacteristic[];
    nutrition?: NutritionInfo;
    setMenuItems?: SetMenuItem[];
    tags?: string[];
}

export interface UpdateMenuItemRequest extends Partial<CreateMenuItemRequest> {
    id: string;
}

// Database result types
export interface DatabaseResult {
    affectedRows: number;
    insertId: number;
    warningCount: number;
}

export interface MenuStats {
    totalCategories: number;
    totalMenuItems: number;
    totalAddonGroups: number;
    totalAddonOptions: number;
    activeCategories: number;
    activeMenuItems: number;
    featuredItems: number;
    setMenuItems: number;
}
