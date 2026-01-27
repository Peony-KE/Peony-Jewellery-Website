'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Loader2, CreditCard, ArrowLeft, Lock, AlertCircle } from 'lucide-react';
import { formatPrice } from '@/data/products';
import Button from '@/components/ui/Button';
import { createPaymentIntent } from '@/lib/stripepayments';

// Initialize Stripe
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

interface CardPaymentProps {
  amount: number;
  onSuccess: () => void;
  onBack: () => void;
  orderId?: string | null; // Pass orderId from checkout
  onCreateOrder?: () => Promise<string | null>; // Callback to create order if needed
}

// Payment form component
function PaymentForm({ amount, onSuccess, onBack, orderId, onCreateOrder }: CardPaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    // Create payment intent when orderId is available
    const initializePayment = async () => {
      if (!orderId) {
        // If no orderId but we have onCreateOrder, try to create order
        if (onCreateOrder) {
          const newOrderId = await onCreateOrder();
          if (newOrderId) {
            // Order created, will retry when orderId prop updates
            return;
          }
        }
        setError('Please wait while we prepare your payment...');
        return;
      }
      
      setError(null); // Clear loading/error messages
      const result = await createPaymentIntent(amount + 300, orderId);
      if (result.success && result.clientSecret) {
        setClientSecret(result.clientSecret);
      } else {
        setError(result.error || 'Failed to initialize payment');
      }
    };

    initializePayment();
  }, [amount, orderId, onCreateOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Card element not found');
      setIsProcessing(false);
      return;
    }

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        setIsProcessing(false);
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg flex items-center space-x-2 text-red-700 dark:text-red-300">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Card Details *
        </label>
        <div className="px-4 py-3 rounded-xl border border-border bg-background">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <div className="bg-muted/50 rounded-xl p-4">
        <div className="flex justify-between mb-2">
          <span className="text-muted-foreground">Order Amount</span>
          <span className="text-foreground">{formatPrice(amount)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-foreground">KES 300</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-border">
          <span className="font-semibold text-foreground">Total to Pay</span>
          <span className="font-bold text-primary">{formatPrice(amount + 300)}</span>
        </div>
      </div>

      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
        <Lock size={14} />
        <span>Your payment information is encrypted and secure</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex items-center justify-center space-x-2"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </Button>
        <Button
          type="submit"
          fullWidth
          disabled={isProcessing || !clientSecret || !stripe}
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin mr-2" size={18} />
              Processing...
            </>
          ) : (
            `Pay ${formatPrice(amount + 300)}`
          )}
        </Button>
      </div>
    </form>
  );
}

// Main component
export default function CardPayment({ amount, onSuccess, onBack, orderId, onCreateOrder }: CardPaymentProps) {
  if (!stripePublishableKey) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
            <CreditCard className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Card Payment</h3>
            <p className="text-sm text-muted-foreground">Secure payment with Visa, Mastercard, or Amex</p>
          </div>
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300">
          <AlertCircle size={18} className="inline mr-2" />
          <span>Stripe is not configured. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment variables.</span>
        </div>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading payment form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
          <CreditCard className="text-white" size={24} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Card Payment</h3>
          <p className="text-sm text-muted-foreground">Secure payment with Visa, Mastercard, or Amex</p>
        </div>
      </div>

      <Elements stripe={stripePromise}>
        <PaymentForm
          amount={amount}
          onSuccess={onSuccess}
          onBack={onBack}
          orderId={orderId}
          onCreateOrder={onCreateOrder}
        />
      </Elements>
    </div>
  );
}