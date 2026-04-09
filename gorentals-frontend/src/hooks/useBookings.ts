'use client';

import { useCallback, useEffect, useState } from 'react';
import { getRenterBookings, getOwnerBookings } from '@/services/bookings';
import type { Booking } from '@/types';

export function useRenterBookings(renterId: string | undefined) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    // If we don't have an ID yet, we might still be loading auth.
    // In a protected route, we'll eventually get one.
    // If we stay in 'loading' state, we avoid the "No rentals" flicker.
    if (!renterId) return;

    setLoading(true);
    getRenterBookings().then(data => {
      setBookings(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [renterId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { bookings, loading, refetch: fetch };
}

export function useOwnerBookings(ownerId: string | undefined) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    if (!ownerId) return;

    setLoading(true);
    getOwnerBookings().then(data => {
      setBookings(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [ownerId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { bookings, loading, refetch: fetch };
}
