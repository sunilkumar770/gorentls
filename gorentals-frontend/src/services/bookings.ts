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
  const res = await api.patch<Booking>(`/bookings/${bookingId}/accept`);
  return res.data;
}

export async function rejectBooking(bookingId: string): Promise<Booking> {
  const res = await api.patch<Booking>(`/bookings/${bookingId}/reject`);
  return res.data;
}

export async function completeBooking(bookingId: string): Promise<Booking> {
  const res = await api.patch<Booking>(`/bookings/${bookingId}/complete`);
  return res.data;
}
