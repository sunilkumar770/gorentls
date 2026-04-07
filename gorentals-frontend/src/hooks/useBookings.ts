'use client';

import { useCallback, useEffect, useState } from 'react';
import { getRenterBookings, getOwnerBookings } from '@/services/bookings';
import type { Booking } from '@/types';

export function useRenterBookings(renterId: string | undefined) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    if (!renterId) { setLoading(false); return; }
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
    if (!ownerId) { setLoading(false); return; }
    setLoading(true);
    getOwnerBookings().then(data => {
      setBookings(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [ownerId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { bookings, loading, refetch: fetch };
}
