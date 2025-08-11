import { NextRequest, NextResponse } from 'next/server';
import { getCartItems, addToCart, updateCartItem, removeFromCart, clearCart } from '@/lib/shop-service';

export async function GET(
    request: NextRequest,
    { params }: { params: { tenant: string } }
) {
    try {
        const tenant = params.tenant;
        const { searchParams } = new URL(request.url);
        
        const sessionId = searchParams.get('session_id');
        const customerId = searchParams.get('customer_id');
        
        const items = await getCartItems(tenant, sessionId || undefined, customerId || undefined);
        
        return NextResponse.json(items);
    } catch (error) {
        console.error('Error fetching cart items:', error);
        return NextResponse.json(
            { error: 'Failed to fetch cart items' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { tenant: string } }
) {
    try {
        const tenant = params.tenant;
        const body = await request.json();
        
        if (!body.itemId || !body.quantity || !body.price) {
            return NextResponse.json(
                { error: 'Item ID, quantity, and price are required' },
                { status: 400 }
            );
        }
        
        const cartItem = await addToCart(tenant, body);
        
        return NextResponse.json(cartItem, { status: 201 });
    } catch (error) {
        console.error('Error adding to cart:', error);
        return NextResponse.json(
            { error: 'Failed to add to cart' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { tenant: string } }
) {
    try {
        const body = await request.json();
        const { id, quantity } = body;
        
        if (!id || !quantity) {
            return NextResponse.json(
                { error: 'Cart item ID and quantity are required' },
                { status: 400 }
            );
        }
        
        await updateCartItem(id, quantity);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating cart item:', error);
        return NextResponse.json(
            { error: 'Failed to update cart item' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { tenant: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const action = searchParams.get('action');
        
        if (action === 'clear') {
            const sessionId = searchParams.get('session_id');
            const customerId = searchParams.get('customer_id');
            
            await clearCart(params.tenant, sessionId || undefined, customerId || undefined);
            return NextResponse.json({ success: true });
        }
        
        if (!id) {
            return NextResponse.json(
                { error: 'Cart item ID is required' },
                { status: 400 }
            );
        }
        
        await removeFromCart(id);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing from cart:', error);
        return NextResponse.json(
            { error: 'Failed to remove from cart' },
            { status: 500 }
        );
    }
}
