import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import db from '@/lib/db';

// Function to get Stripe settings from database
async function getStripeSettings() {
    try {
        const [rows] = await db.execute('SELECT * FROM stripe_settings WHERE id = 1');
        const settings = (rows as any[])[0];
        return settings;
    } catch (error) {
        console.error('Error fetching Stripe settings:', error);
        return null;
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { tenant: string } }
) {
    try {
        const { tenant } = params;

        // Get Stripe settings from Super Admin configuration
        const stripeSettings = await getStripeSettings();
        
        // If no database settings, fall back to environment variables
        let publishableKey = '';
        let secretKey = '';
        let mode = 'test';
        
        if (stripeSettings && stripeSettings.publishable_key && stripeSettings.secret_key) {
            // Use database settings
            publishableKey = stripeSettings.publishable_key;
            secretKey = stripeSettings.secret_key;
            mode = stripeSettings.mode || 'test';
        } else if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && process.env.STRIPE_SECRET_KEY) {
            // Fall back to environment variables
            publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
            secretKey = process.env.STRIPE_SECRET_KEY;
            mode = 'test';
        } else {
            return NextResponse.json({
                enabled: false,
                configured: false,
                error: 'Stripe not configured by administrator',
                deliveryFees: {
                    normal: 5.00,
                    express: 9.00
                }
            });
        }

        // Return the publishable key and configuration
        const config = {
            enabled: true,
            configured: true,
            publishableKey: publishableKey,
            mode: mode,
            deliveryFees: {
                normal: 5.00,
                express: 9.00
            }
        };

        return NextResponse.json(config);
    } catch (error) {
        console.error('Error fetching payment configuration:', error);
        return NextResponse.json(
            { 
                enabled: false,
                configured: false,
                error: 'Failed to fetch payment configuration',
                deliveryFees: {
                    normal: 5.00,
                    express: 9.00
                }
            },
            { status: 200 } // Return 200 instead of 500 to prevent the error
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { tenant: string } }
) {
    try {
        const { tenant } = params;
        const body = await request.json();
        const { action, amount, currency = 'gbp', orderId, customerEmail, customerName, description, orderType, deliveryType, cartItems, metadata, paymentIntentId } = body;

        // Get Stripe settings from Super Admin configuration
        const stripeSettings = await getStripeSettings();
        
        // Determine which secret key to use
        let secretKey = '';
        if (stripeSettings && stripeSettings.secret_key) {
            secretKey = stripeSettings.secret_key;
        } else if (process.env.STRIPE_SECRET_KEY) {
            secretKey = process.env.STRIPE_SECRET_KEY;
        } else {
            return NextResponse.json(
                { error: 'Stripe not configured by administrator' },
                { status: 400 }
            );
        }

        // Initialize Stripe with the configured secret key
        const stripe = new Stripe(secretKey, {
            apiVersion: '2025-07-30.basil',
        });

        if (action === 'create_payment_intent') {
            // Create a PaymentIntent with Stripe
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to pence/cents
                currency: currency,
                automatic_payment_methods: {
                    enabled: true,
                },
                description: description || `Order for ${tenant}`,
                metadata: {
                    tenant: tenant,
                    orderId: orderId,
                    orderType: orderType,
                    deliveryType: deliveryType || '',
                    customerEmail: customerEmail || '',
                    customerName: customerName || '',
                    ...metadata
                }
            });

            return NextResponse.json({
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id
            });
        }

        if (action === 'confirm_payment') {
            if (!paymentIntentId) {
                return NextResponse.json(
                    { error: 'Payment Intent ID is required' },
                    { status: 400 }
                );
            }

            try {
                // Retrieve the payment intent from Stripe to verify its status
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
                
                if (paymentIntent.status === 'succeeded') {
                    // Payment was successful
                    console.log('Payment confirmed successfully:', {
                        id: paymentIntent.id,
                        amount: paymentIntent.amount,
                        status: paymentIntent.status,
                        tenant: tenant
                    });

                    // Here you can add logic to:
                    // 1. Save the order to your database
                    // 2. Send confirmation emails
                    // 3. Update inventory
                    // 4. Generate order numbers
                    
                    return NextResponse.json({
                        success: true,
                        paymentIntent: {
                            id: paymentIntent.id,
                            status: paymentIntent.status,
                            amount: paymentIntent.amount,
                            currency: paymentIntent.currency
                        },
                        message: 'Payment confirmed successfully'
                    });
                } else {
                    return NextResponse.json(
                        { 
                            error: `Payment not successful. Status: ${paymentIntent.status}`,
                            status: paymentIntent.status 
                        },
                        { status: 400 }
                    );
                }
            } catch (stripeError) {
                console.error('Error retrieving payment intent from Stripe:', stripeError);
                return NextResponse.json(
                    { error: 'Failed to verify payment with Stripe' },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Error processing payment:', error);
        return NextResponse.json(
            { error: 'Failed to process payment' },
            { status: 500 }
        );
    }
}
