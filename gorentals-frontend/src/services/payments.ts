import api from '@/lib/axios';

export interface CreateOrderRequest {
  bookingId: string;
  paymentKind: 'ADVANCE' | 'FINAL' | 'SECURITY_DEPOSIT';
}

export interface CreateOrderResponse {
  id: string;              // Razorpay order_id
  amount: number;            // in paise
  currency: string;          // INR
  receipt: string;
  notes?: Record<string, string>;
}

export async function createOrder(
  bookingId: string,
  paymentKind: 'ADVANCE' | 'FINAL' | 'SECURITY_DEPOSIT' = 'ADVANCE'
): Promise<CreateOrderResponse> {
  const res = await api.post<CreateOrderResponse>('/payments/order', {
    bookingId,
    paymentKind,
  });
  return res.data;
}

export interface ConfirmPaymentRequest {
  bookingId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paymentKind: 'ADVANCE' | 'FINAL' | 'SECURITY_DEPOSIT';
}

export async function confirmPayment(
  data: ConfirmPaymentRequest
): Promise<{ status: string; bookingId: string; escrowStatus: string }> {
  const res = await api.post('/payments/confirm', data);
  return res.data;
}
