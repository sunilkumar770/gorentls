'use client';

import { useEffect, useState } from 'react';
import { getRenterBookings, getOwnerBookings } from '@/services/bookings';
import type { Booking } from '@/types';

export function useRenterBookings(renterId: string | undefined) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!renterId) { setLoading(false); return; }
    getRenterBookings(renterId).then(data => {
      setBookings(data);
      setLoading(false);
    });
  }, [renterId]);

  return { bookings, loading };
}

export function useOwnerBookings(ownerId: string | undefined) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) { setLoading(false); return; }
    getOwnerBookings(ownerId).then(data => {
      setBookings(data);
      setLoading(false);
    });
  }, [ownerId]);

  return { bookings, loading };
}
