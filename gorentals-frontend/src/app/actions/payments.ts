'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface CreateOrderInput {
  bookingId: string;
  paymentKind: 'ADVANCE' | 'FINAL' | 'SECURITY_DEPOSIT';
}

export interface ConfirmPaymentInput {
  bookingId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paymentKind: 'ADVANCE' | 'FINAL' | 'SECURITY_DEPOSIT';
}

export async function createOrderAction(data: CreateOrderInput) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const res = await fetch(`${API_URL}/payments/order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'Failed to create order');
  }

  return res.json();
}

export async function confirmPaymentAction(data: ConfirmPaymentInput) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const res = await fetch(`${API_URL}/payments/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'Payment confirmation failed');
  }

  // Revalidate the booking/escrow page so the UI refreshes immediately
  revalidatePath(`/my-bookings`);
  revalidatePath(`/checkout/${data.bookingId}`);

  return res.json();
}
