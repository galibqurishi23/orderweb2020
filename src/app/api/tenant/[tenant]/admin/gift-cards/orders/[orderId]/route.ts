import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/gift-card-service';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { tenant: string; orderId: string } }
) {
    try {
        const { tenant, orderId } = params;
        const body = await request.json();

        await updateOrderStatus(tenant, orderId, body);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating order status:', error);
        return NextResponse.json(
            { error: 'Failed to update order status' },
            { status: 500 }
        );
    }
}
