'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import type { Booking, PagedResponse } from '@/types';

type BookingsApiResponse = Booking[] | PagedResponse<Booking>;

function normalise(data: BookingsApiResponse): Booking[] {
  if (Array.isArray(data)) return data;
  if (data && 'content' in data) return data.content;
  return [];
}

// ── Renter: /bookings/my-bookings ────────────────────────────
export function useRenterBookings(userId?: string) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const refetch = useCallback(async () => {
    // Wait until we know whether a user is logged in
    if (userId === undefined) return;
    if (!userId) {
      setBookings([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<BookingsApiResponse>('/bookings/my-bookings');
      setBookings(normalise(res.data));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { bookings, loading, error, refetch };
}

// ── Owner: /bookings/owner/bookings ──────────────────────────
export function useOwnerBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<BookingsApiResponse>('/bookings/owner/bookings');
      setBookings(normalise(res.data));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { bookings, loading, error, refetch };
}
