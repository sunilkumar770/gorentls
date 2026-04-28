'use client';

import React, { useState } from 'react';
import { createOrderAction, confirmPaymentAction } from '@/app/actions/payments';

interface RazorpayCheckoutProps {
  bookingId: string;
  paymentKind: 'ADVANCE' | 'FINAL' | 'SECURITY_DEPOSIT';
  amountToPay: number; // For display purposes
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export function RazorpayCheckout({
  bookingId,
  paymentKind,
  amountToPay,
  onSuccess,
  onError,
  className = '',
}: RazorpayCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    try {
      setIsProcessing(true);

      // 1. Load the SDK
      const res = await loadRazorpayScript();
      if (!res) {
        throw new Error('Razorpay SDK failed to load');
      }

      // 2. Create the Order on the backend via Server Action
      const order = await createOrderAction({ bookingId, paymentKind });

      // 3. Initialize Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Safe to expose public key
        amount: order.amount, // Amount in paise
        currency: order.currency,
        name: 'GoRentals',
        description: `Payment for Booking #${bookingId}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // 4. Confirm the payment via Server Action
            await confirmPaymentAction({
              bookingId,
              paymentKind,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            
            if (onSuccess) onSuccess();
          } catch (confirmError: any) {
            console.error('Payment confirmation failed:', confirmError);
            if (onError) onError(confirmError.message || 'Payment confirmation failed');
          }
        },
        prefill: {
          name: '', // We could prefill from user profile
          email: '',
          contact: '',
        },
        theme: {
          color: '#10B981', // Emerald theme color
        },
        // Force display all methods in test mode to help debug UPI missing issues
        config: {
          display: {
            hide: [],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      
      paymentObject.on('payment.failed', function (response: any) {
        console.error('Payment failed in Razorpay:', response.error);
        if (onError) onError(response.error.description);
      });

      paymentObject.open();
    } catch (err: any) {
      console.error('Failed to initiate payment:', err);
      if (onError) onError(err.message || 'Payment initiation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={isProcessing}
      className={`px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors ${className}`}
    >
      {isProcessing ? 'Processing...' : `Pay ₹${amountToPay.toFixed(2)}`}
      {process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith('rzp_test') && (
        <span className="block text-[10px] opacity-60 mt-1 font-normal">
          Test Mode: UPI may require dashboard activation
        </span>
      )}
    </button>
  );
}
