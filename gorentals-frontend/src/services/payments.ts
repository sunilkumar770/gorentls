import api from '@/lib/axios';

export interface InitiatePaymentResponse {
  orderId:   string;   // Razorpay order ID  — "order_XXXX"
  amount:    number;   // in PAISE (₹1 = 100 paise)
  currency:  string;   // "INR"
  keyId:     string;   // public Razorpay key
  bookingId: string;
}

export interface VerifyPaymentRequest {
  bookingId:           string;
  razorpayOrderId:     string;
  razorpayPaymentId:   string;
  razorpaySignature:   string;
}

export interface VerifyPaymentResponse {
  success:   boolean;
  message:   string;
  bookingId: string;
}

export async function initiatePayment(
  bookingId: string,
): Promise<InitiatePaymentResponse> {
  const res = await api.post<InitiatePaymentResponse>(
    '/payments/initiate',
    { bookingId },
  );
  return res.data;
}

export async function verifyPayment(
  data: VerifyPaymentRequest,
): Promise<VerifyPaymentResponse> {
  const res = await api.post<VerifyPaymentResponse>('/payments/verify', data);
  return res.data;
}
