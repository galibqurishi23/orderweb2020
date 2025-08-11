import { NextRequest, NextResponse } from 'next/server';
import { createGiftCard, createGiftCardOrder, getGiftCardSettings } from '@/lib/gift-card-service';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
    request: NextRequest,
    { params }: { params: { tenant: string } }
) {
    try {
        const { tenant } = params;
        const body = await request.json();
        
        const {
            card_type,
            amount,
            customer_name,
            customer_email,
            customer_phone,
            recipient_name,
            recipient_email,
            recipient_address,
            personal_message
        } = body;

        // Validate required fields
        if (!card_type || !amount || !customer_name || !customer_email) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get gift card settings for validation
        const settings = await getGiftCardSettings(tenant);
        if (!settings) {
            return NextResponse.json(
                { error: 'Gift card settings not configured' },
                { status: 400 }
            );
        }

        // Validate amount
        if (amount < settings.min_custom_amount || amount > settings.max_custom_amount) {
            return NextResponse.json(
                { error: `Amount must be between £${settings.min_custom_amount} and £${settings.max_custom_amount}` },
                { status: 400 }
            );
        }

        // Validate card type specific requirements
        if (card_type === 'digital' && !recipient_email) {
            return NextResponse.json(
                { error: 'Recipient email required for digital gift cards' },
                { status: 400 }
            );
        }

        if (card_type === 'physical' && !recipient_address) {
            return NextResponse.json(
                { error: 'Delivery address required for physical gift cards' },
                { status: 400 }
            );
        }

        // Create gift card
        const giftCard = await createGiftCard(tenant, {
            card_type,
            amount,
            expiry_months: settings.default_expiry_months
        });

        // Create order
        const order = await createGiftCardOrder(tenant, {
            gift_card_id: giftCard.id,
            customer_name,
            customer_email,
            customer_phone,
            recipient_name: recipient_name || customer_name,
            recipient_email: card_type === 'digital' ? recipient_email : customer_email,
            recipient_address: card_type === 'physical' ? recipient_address : null,
            personal_message,
            order_amount: amount,
            payment_status: 'pending',
            delivery_status: 'pending'
        });

        // For demo purposes, return success. In production, integrate with your payment system
        return NextResponse.json({
            success: true,
            order_id: order.id,
            gift_card_number: giftCard.card_number,
            amount: amount,
            message: 'Gift card order created successfully',
            // In production, return payment URL from your payment processor
            payment_url: `/api/tenant/${tenant}/payments/process?order_id=${order.id}`
        });

    } catch (error) {
        console.error('Error creating gift card order:', error);
        return NextResponse.json(
            { error: 'Failed to create gift card order' },
            { status: 500 }
        );
    }
}
