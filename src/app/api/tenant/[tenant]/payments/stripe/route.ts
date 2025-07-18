import { NextRequest, NextResponse } from 'next/server';
import { getTenantSettingsBySlug } from '@/lib/tenant-service';
import { createStripeService } from '@/lib/stripe-service';

export async function GET(request: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  try {
    const { tenant } = await params;
    
    // Get tenant settings
    const tenantSettings = await getTenantSettingsBySlug(tenant);
    
    if (!tenantSettings) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Check if Stripe is enabled
    const stripeConfig = tenantSettings.paymentSettings?.stripe;
    if (!stripeConfig?.enabled) {
      return NextResponse.json(
        { error: 'Stripe not enabled' },
        { status: 400 }
      );
    }

    if (!stripeConfig.publishableKey || !stripeConfig.secretKey) {
      return NextResponse.json(
        { error: 'Stripe not configured properly. Missing publishable key or secret key.' },
        { status: 400 }
      );
    }

    // Return configuration status
    return NextResponse.json({
      enabled: stripeConfig.enabled,
      configured: true,
      publishableKey: stripeConfig.publishableKey,
      environment: stripeConfig.environment || 'sandbox'
    });

  } catch (error) {
    console.error('Error fetching Stripe configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  try {
    const { tenant } = await params;
    const body = await request.json();
    
    // Get tenant settings
    const tenantSettings = await getTenantSettingsBySlug(tenant);
    
    if (!tenantSettings) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Check if Stripe is enabled
    const stripeConfig = tenantSettings.paymentSettings?.stripe;
    if (!stripeConfig?.enabled) {
      return NextResponse.json(
        { error: 'Stripe not enabled' },
        { status: 400 }
      );
    }

    if (!stripeConfig.publishableKey || !stripeConfig.secretKey) {
      return NextResponse.json(
        { error: 'Stripe not configured properly. Missing publishable key or secret key.' },
        { status: 400 }
      );
    }

    // Create Stripe service instance
    const stripeService = createStripeService({
      publishableKey: stripeConfig.publishableKey,
      secretKey: stripeConfig.secretKey,
      environment: stripeConfig.environment || 'sandbox'
    });

    // Handle different actions
    switch (body.action) {
      case 'test_connection':
        try {
          const result = await stripeService.testConnection();
          
          if (result.success) {
            return NextResponse.json({
              success: true,
              message: 'Stripe connection test successful',
              accountId: result.accountId,
              environment: stripeService.getEnvironment()
            });
          } else {
            return NextResponse.json(
              { 
                error: 'Stripe connection test failed',
                details: result.message
              },
              { status: 400 }
            );
          }
        } catch (error) {
          console.error('Stripe connection test failed:', error);
          return NextResponse.json(
            { 
              error: 'Stripe connection test failed',
              details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 400 }
          );
        }

      case 'create_payment_intent':
        try {
          const {
            amount,
            currency = 'usd',
            orderId,
            customerEmail,
            customerName,
            description,
            metadata,
            receiptEmail
          } = body;

          if (!amount || !orderId) {
            return NextResponse.json(
              { error: 'Amount and orderId are required' },
              { status: 400 }
            );
          }

          const result = await stripeService.createPaymentIntent({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            orderId,
            customerEmail,
            customerName,
            description,
            metadata,
            receiptEmail
          });

          if (result.success) {
            return NextResponse.json({
              success: true,
              clientSecret: result.clientSecret,
              paymentIntentId: result.paymentIntent?.id,
              publishableKey: stripeService.getPublishableKey()
            });
          } else {
            return NextResponse.json(
              { 
                error: 'Failed to create payment intent',
                details: result.error
              },
              { status: 400 }
            );
          }
        } catch (error) {
          console.error('Failed to create payment intent:', error);
          return NextResponse.json(
            { 
              error: 'Failed to create payment intent',
              details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
          );
        }

      case 'update_payment_intent':
        try {
          const {
            paymentIntentId,
            amount,
            description,
            metadata
          } = body;

          if (!paymentIntentId) {
            return NextResponse.json(
              { error: 'Payment Intent ID is required' },
              { status: 400 }
            );
          }

          const updateParams: any = {};
          if (amount !== undefined) {
            updateParams.amount = Math.round(amount * 100); // Convert to cents
          }
          if (description !== undefined) {
            updateParams.description = description;
          }
          if (metadata !== undefined) {
            updateParams.metadata = metadata;
          }

          const result = await stripeService.updatePaymentIntent(paymentIntentId, updateParams);

          if (result.success) {
            return NextResponse.json({
              success: true,
              paymentIntent: result.paymentIntent
            });
          } else {
            return NextResponse.json(
              { 
                error: 'Failed to update payment intent',
                details: result.error
              },
              { status: 400 }
            );
          }
        } catch (error) {
          console.error('Failed to update payment intent:', error);
          return NextResponse.json(
            { 
              error: 'Failed to update payment intent',
              details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
          );
        }

      case 'cancel_payment_intent':
        try {
          const { paymentIntentId } = body;

          if (!paymentIntentId) {
            return NextResponse.json(
              { error: 'Payment Intent ID is required' },
              { status: 400 }
            );
          }

          const result = await stripeService.cancelPaymentIntent(paymentIntentId);

          if (result.success) {
            return NextResponse.json({
              success: true,
              paymentIntent: result.paymentIntent
            });
          } else {
            return NextResponse.json(
              { 
                error: 'Failed to cancel payment intent',
                details: result.error
              },
              { status: 400 }
            );
          }
        } catch (error) {
          console.error('Failed to cancel payment intent:', error);
          return NextResponse.json(
            { 
              error: 'Failed to cancel payment intent',
              details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
          );
        }

      case 'create_refund':
        try {
          const {
            paymentIntentId,
            amount,
            reason = 'requested_by_customer',
            metadata
          } = body;

          if (!paymentIntentId) {
            return NextResponse.json(
              { error: 'Payment Intent ID is required' },
              { status: 400 }
            );
          }

          const refundParams: any = {
            paymentIntentId,
            reason,
            metadata
          };

          if (amount !== undefined) {
            refundParams.amount = Math.round(amount * 100); // Convert to cents
          }

          const result = await stripeService.createRefund(refundParams);

          if (result.success) {
            return NextResponse.json({
              success: true,
              refund: result.refund
            });
          } else {
            return NextResponse.json(
              { 
                error: 'Failed to create refund',
                details: result.error
              },
              { status: 400 }
            );
          }
        } catch (error) {
          console.error('Failed to create refund:', error);
          return NextResponse.json(
            { 
              error: 'Failed to create refund',
              details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in Stripe API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
