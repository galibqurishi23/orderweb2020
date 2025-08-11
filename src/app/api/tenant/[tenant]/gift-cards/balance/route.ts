import { NextRequest, NextResponse } from 'next/server';
import { getGiftCard } from '@/lib/gift-card-service';

export async function GET(
    request: NextRequest,
    { params }: { params: { tenant: string } }
) {
    try {
        const { tenant } = params;
        const { searchParams } = new URL(request.url);
        const cardNumber = searchParams.get('card_number');

        if (!cardNumber) {
            return NextResponse.json(
                { error: 'Card number is required' },
                { status: 400 }
            );
        }

        const card = await getGiftCard(tenant, cardNumber);
        
        if (!card) {
            return NextResponse.json(
                { error: 'Gift card not found' },
                { status: 404 }
            );
        }

        // Return only safe information for balance check
        return NextResponse.json({
            card_number: card.card_number,
            remaining_balance: card.remaining_balance,
            status: card.status,
            expiry_date: card.expiry_date
        });
    } catch (error) {
        console.error('Error checking gift card balance:', error);
        return NextResponse.json(
            { error: 'Failed to check balance' },
            { status: 500 }
        );
    }
}
