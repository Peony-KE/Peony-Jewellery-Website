'use client';

import React, { useState } from 'react';
import { Loader2, CreditCard, ArrowLeft, Lock } from 'lucide-react';
import { formatPrice } from '@/data/products';
import Button from '@/components/ui/Button';

interface CardPaymentProps {
  amount: number;
  onSuccess: () => void;
  onBack: () => void;
}

export default function CardPayment({ amount, onSuccess, onBack }: CardPaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'number') {
      // Format card number with spaces
      const formatted = value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setCardData((prev) => ({ ...prev, [name]: formatted.slice(0, 19) }));
    } else if (name === 'expiry') {
      // Format expiry as MM/YY
      const digits = value.replace(/\D/g, '');
      if (digits.length >= 2) {
        setCardData((prev) => ({ ...prev, [name]: `${digits.slice(0, 2)}/${digits.slice(2, 4)}` }));
      } else {
        setCardData((prev) => ({ ...prev, [name]: digits }));
      }
    } else if (name === 'cvc') {
      setCardData((prev) => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 4) }));
    } else {
      setCardData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate card payment processing
    // In production, this would integrate with Stripe, Paystack, or another payment provider
    await new Promise((resolve) => setTimeout(resolve, 2500));

    setIsProcessing(false);
    onSuccess();
  };

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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
            Cardholder Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={cardData.name}
            onChange={handleInputChange}
            placeholder="John Doe"
            required
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="number" className="block text-sm font-medium text-foreground mb-2">
            Card Number *
          </label>
          <input
            type="text"
            id="number"
            name="number"
            value={cardData.number}
            onChange={handleInputChange}
            placeholder="4242 4242 4242 4242"
            required
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="expiry" className="block text-sm font-medium text-foreground mb-2">
              Expiry Date *
            </label>
            <input
              type="text"
              id="expiry"
              name="expiry"
              value={cardData.expiry}
              onChange={handleInputChange}
              placeholder="MM/YY"
              required
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="cvc" className="block text-sm font-medium text-foreground mb-2">
              CVC *
            </label>
            <input
              type="text"
              id="cvc"
              name="cvc"
              value={cardData.cvc}
              onChange={handleInputChange}
              placeholder="123"
              required
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
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
            disabled={isProcessing}
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

      {/* Test Card Info */}
      <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-dashed border-border">
        <p className="text-xs text-muted-foreground text-center">
          <strong>Demo Mode:</strong> Use card number 4242 4242 4242 4242 with any future expiry and CVC
        </p>
      </div>
    </div>
  );
}
