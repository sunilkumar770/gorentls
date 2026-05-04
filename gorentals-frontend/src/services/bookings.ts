import api from '@/lib/axios';
import type { Booking } from '@/types';

export interface CreateBookingRequest {
  listingId:       string;
  startDate:       string;   // YYYY-MM-DD
  endDate:         string;   // YYYY-MM-DD
  totalDays:       number;
  rentalAmount:    number;
  securityDeposit: number;
  totalAmount:     number;
  message?:        string;
}

export async function createBooking(data: CreateBookingRequest): Promise<Booking> {
  const res = await api.post<Booking>('/bookings', data);
  return res.data;
}

export async function getBooking(bookingId: string): Promise<Booking> {
  const res = await api.get<Booking>(`/bookings/${bookingId}`);
  return res.data;
}

export async function getMyBookings(): Promise<Booking[]> {
  const res = await api.get<Booking[] | { content: Booking[] }>('/bookings/my-bookings');
  return Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
}

export async function getOwnerBookings(): Promise<Booking[]> {
  const res = await api.get<Booking[] | { content: Booking[] }>('/bookings/owner/bookings');
  return Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
}

export async function cancelBooking(bookingId: string): Promise<Booking> {
  const res = await api.patch<Booking>(`/bookings/${bookingId}/cancel`);
  return res.data;
}

export async function acceptBooking(bookingId: string): Promise<Booking> {
  const res = await api.post<Booking>(`/bookings/${bookingId}/confirm`);
  return res.data;
}

export async function rejectBooking(bookingId: string): Promise<Booking> {
  const res = await api.post<Booking>(`/bookings/${bookingId}/reject`);
  return res.data;
}

export async function completeBooking(bookingId: string): Promise<Booking> {
  const res = await api.patch<Booking>(`/bookings/${bookingId}/complete`);
  return res.data;
}

/**
 * Fetch the PDF receipt bytes for a booking.
 * Returns a Blob ready to be used with URL.createObjectURL().
 */
export async function downloadReceipt(bookingId: string): Promise<Blob> {
  const res = await api.get(`/bookings/${bookingId}/receipt`, {
    responseType: 'blob',
  });
  return res.data as Blob;
}

/**
 * Trigger browser PDF download for a booking receipt.
 * Creates a temporary <a> element, clicks it, then cleans up.
 */
export async function triggerReceiptDownload(bookingId: string): Promise<void> {
  const blob = await downloadReceipt(bookingId);
  const url  = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `receipt-${bookingId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
