import { NextRequest, NextResponse } from 'next/server';
import {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    getMenuItems,
    getMenuItemById,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getMenuWithCategories,
    getMenuStats
} from '@/lib/new-menu-service';
import { MenuApiResponse } from '@/lib/menu-types';

// Helper function to get tenant ID from request
function getTenantId(request: NextRequest): string | null {
    const { searchParams } = new URL(request.url);
    return searchParams.get('tenantId');
}

// Helper function to create error response
function createErrorResponse(message: string, status: number = 400): NextResponse {
    return NextResponse.json({
        success: false,
        error: message
    } as MenuApiResponse<never>, { status });
}

// Helper function to create success response
function createSuccessResponse<T>(data: T, message?: string): NextResponse {
    return NextResponse.json({
        success: true,
        data,
        message
    } as MenuApiResponse<T>);
}

// ==================== GET OPERATIONS ====================

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const tenantId = getTenantId(request);
        if (!tenantId) {
            return createErrorResponse('Tenant ID is required', 400);
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action') || 'menu';
        const id = searchParams.get('id');

        switch (action) {
            case 'categories':
                if (id) {
                    const category = await getCategoryById(tenantId, id);
                    if (!category) {
                        return createErrorResponse('Category not found', 404);
                    }
                    return createSuccessResponse(category);
                } else {
                    const categories = await getCategories(tenantId);
                    return createSuccessResponse(categories);
                }

            case 'menu-items':
                if (id) {
                    const menuItem = await getMenuItemById(tenantId, id);
                    if (!menuItem) {
                        return createErrorResponse('Menu item not found', 404);
                    }
                    return createSuccessResponse(menuItem);
                } else {
                    const menuItems = await getMenuItems(tenantId);
                    return createSuccessResponse(menuItems);
                }

            case 'menu':
                const menuData = await getMenuWithCategories(tenantId);
                return createSuccessResponse(menuData);

            case 'stats':
                const stats = await getMenuStats(tenantId);
                return createSuccessResponse(stats);

            default:
                return createErrorResponse('Invalid action specified', 400);
        }
    } catch (error) {
        console.error('Error in GET /api/menu:', error);
        return createErrorResponse(
            error instanceof Error ? error.message : 'Internal server error',
            500
        );
    }
}

// ==================== POST OPERATIONS (CREATE) ====================

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const tenantId = getTenantId(request);
        if (!tenantId) {
            return createErrorResponse('Tenant ID is required', 400);
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        
        if (!action) {
            return createErrorResponse('Action is required', 400);
        }

        const requestBody = await request.json();

        switch (action) {
            case 'create-category':
                const newCategory = await createCategory(tenantId, requestBody);
                return createSuccessResponse(newCategory, 'Category created successfully');

            case 'create-menu-item':
                const newMenuItem = await createMenuItem(tenantId, requestBody);
                return createSuccessResponse(newMenuItem, 'Menu item created successfully');

            default:
                return createErrorResponse('Invalid action specified', 400);
        }
    } catch (error) {
        console.error('Error in POST /api/menu:', error);
        return createErrorResponse(
            error instanceof Error ? error.message : 'Internal server error',
            500
        );
    }
}

// ==================== PUT OPERATIONS (UPDATE) ====================

export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        const tenantId = getTenantId(request);
        if (!tenantId) {
            return createErrorResponse('Tenant ID is required', 400);
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        
        if (!action) {
            return createErrorResponse('Action is required', 400);
        }

        const requestBody = await request.json();

        switch (action) {
            case 'update-category':
                const updatedCategory = await updateCategory(tenantId, requestBody);
                return createSuccessResponse(updatedCategory, 'Category updated successfully');

            case 'update-menu-item':
                const updatedMenuItem = await updateMenuItem(tenantId, requestBody);
                return createSuccessResponse(updatedMenuItem, 'Menu item updated successfully');

            default:
                return createErrorResponse('Invalid action specified', 400);
        }
    } catch (error) {
        console.error('Error in PUT /api/menu:', error);
        return createErrorResponse(
            error instanceof Error ? error.message : 'Internal server error',
            500
        );
    }
}

// ==================== DELETE OPERATIONS ====================

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const tenantId = getTenantId(request);
        if (!tenantId) {
            return createErrorResponse('Tenant ID is required', 400);
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const id = searchParams.get('id');
        
        if (!action) {
            return createErrorResponse('Action is required', 400);
        }

        if (!id) {
            return createErrorResponse('ID is required', 400);
        }

        switch (action) {
            case 'delete-category':
                await deleteCategory(tenantId, id);
                return createSuccessResponse(null, 'Category deleted successfully');

            case 'delete-menu-item':
                await deleteMenuItem(tenantId, id);
                return createSuccessResponse(null, 'Menu item deleted successfully');

            default:
                return createErrorResponse('Invalid action specified', 400);
        }
    } catch (error) {
        console.error('Error in DELETE /api/menu:', error);
        return createErrorResponse(
            error instanceof Error ? error.message : 'Internal server error',
            500
        );
    }
}
