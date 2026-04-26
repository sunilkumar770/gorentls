// src/types/razorpay.d.ts
// Razorpay SDK type declarations for TypeScript usage.
// Ref: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/

export interface RazorpayOptions {
  key:          string;
  amount:       number;    // in PAISE (₹1 = 100 paise)
  currency:     string;
  name:         string;
  description?: string;
  image?:       string;
  order_id:     string;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id:   string;
    razorpay_signature:  string;
  }) => void;
  prefill?: {
    name?:    string;
    email?:   string;
    contact?: string;
  };
  notes?:  Record<string, string>;
  theme?:  { color?: string };
  modal?: {
    ondismiss?: () => void;
    confirm_close?: boolean;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

export interface RazorpayPaymentFailedResponse {
  error: {
    code:        string;
    description: string;
    source:      string;
    step:        string;
    reason:      string;
    metadata: {
      order_id:   string;
      payment_id: string;
    };
  };
}

export interface RazorpayInstance {
  open:  () => void;
  close: () => void;
  on: (
    event:   'payment.failed',
    handler: (response: RazorpayPaymentFailedResponse) => void,
  ) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
