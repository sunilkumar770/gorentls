'use client';

import React, { useState } from 'react';
import { createOrderAction, confirmPaymentAction } from '@/app/actions/payments';

interface RazorpayCheckoutProps {
  bookingId: string;
  paymentKind: 'ADVANCE' | 'FINAL' | 'SECURITY_DEPOSIT';
  amountToPay: number;
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

  const loadRazorpayScript = (): Promise<boolean> => {
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
    // ── Double-click guard ────────────────────────────────────
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // ── Step 1: Load Razorpay SDK ─────────────────────────
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        throw new Error(
          'Payment gateway failed to load. Check your internet connection and try again.'
        );
      }

      // ── Step 2: Validate Razorpay Key ─────────────────────
      // CRITICAL: If this env var is missing, Razorpay silently rejects
      // the payment with no user-visible error. We surface it immediately.
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey || razorpayKey.trim() === '' || razorpayKey === 'rzp_test_YOUR_KEY_ID_HERE') {
        throw new Error(
          'Payment system is not configured. Please contact support. (Error: missing payment key)'
        );
      }

      // ── Step 3: Create order on backend ──────────────────
      const order = await createOrderAction({ bookingId, paymentKind });

      // ── Step 4: Open Razorpay modal ───────────────────────
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency ?? 'INR',
        name: 'GoRentals',
        description: `Payment for Booking #${bookingId}`,
        order_id: order.id,
        modal: {
          ondismiss: () => {
            // User closed the modal without paying — reset state cleanly
            setIsProcessing(false);
          },
        },
        handler: async function (response: any) {
          // ── Step 5: Confirm payment on backend ───────────
          try {
            await confirmPaymentAction({
              bookingId,
              paymentKind,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            if (onSuccess) onSuccess();
          } catch (confirmError: any) {
            if (onError) onError(confirmError.message ?? 'Payment confirmation failed');
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: { name: '', email: '', contact: '' },
        theme: { color: '#01696f' },
        config: {
          display: {
            hide: [],
            preferences: { show_default_blocks: true },
          },
        },
      };

      const paymentObject = new (window as any).Razorpay(options);

      paymentObject.on('payment.failed', function (response: any) {
        if (onError) onError(response.error.description ?? 'Payment failed');
        setIsProcessing(false);
      });

      paymentObject.open();
      // NOTE: do NOT set isProcessing=false here.
      // State resets in: handler (success), modal.ondismiss (cancel),
      // payment.failed (failure). All paths covered.

    } catch (err: any) {
      if (onError) onError(err.message ?? 'Payment initiation failed');
      setIsProcessing(false);
    }
  };

  const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  return (
    <div>
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className={`inline-flex items-center justify-center px-6 py-3 font-semibold rounded-lg 
          transition-all duration-200
          ${isProcessing
            ? 'bg-gray-400 cursor-not-allowed opacity-70'
            : 'bg-[#01696f] hover:bg-[#015a5f] text-white cursor-pointer shadow-sm hover:shadow-md'
          } ${className}`}
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </span>
        ) : (
          `Pay ₹${amountToPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        )}
      </button>

      {/* Test mode warning — visible only in development */}
      {process.env.NODE_ENV === 'development' &&
        razorpayKey?.startsWith('rzp_test') && (
          <p className="mt-2 text-xs text-amber-600">
            Test Mode: Use Razorpay test card 4111 1111 1111 1111
          </p>
        )}
    </div>
  );
}
