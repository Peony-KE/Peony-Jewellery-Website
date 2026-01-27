'use server'

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
});
export async function createPaymentIntent(amount: number, orderId: string) { 
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: 'kes',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                orderId,
            },
        });
        return {
            success: true,
            clientSecret: paymentIntent.client_secret,
        };
        
    } catch (error) {
        console.error('Error creating payment intent', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred',
        };
        
    }
}
export async function confirmPayment(paymentIntentId: string) { 
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        return {
            success: paymentIntent.status === 'succeeded',
            paymentIntent
        }
     } catch (error) { 
        console.error('Error confirming payment', error);
        return {
            success: false,
            error: error instanceof Error ? error.message: 'Failed to confirm payment',
        }
    }

}