'use client';

import { useState } from 'react';
import { acceptBooking, rejectBooking, completeBooking, cancelBooking } from '@/services/bookings';
import { CheckCircle2, XCircle, PackageCheck, X, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Booking } from '@/types';

interface BookingActionBarProps {
  booking:   Booking;
  role:      'owner' | 'renter';
  onUpdate?: (updated: Booking) => void;
}

type ActionKey = 'accept' | 'reject' | 'complete' | 'cancel';

export function BookingActionBar({ booking, role, onUpdate }: BookingActionBarProps) {
  const [loading, setLoading] = useState<ActionKey | null>(null);

  const status = booking.status;

  // Determine which actions are visible per role + status
  const actions: { key: ActionKey; label: string; icon: React.ReactNode; variant: 'green' | 'red' | 'blue' | 'gray' }[] = [];

  if (role === 'owner') {
    if (status === 'PENDING') {
      actions.push({ key: 'accept',  label: 'Accept',  icon: <CheckCircle2 className="w-4 h-4" />, variant: 'green' });
      actions.push({ key: 'reject',  label: 'Reject',  icon: <XCircle      className="w-4 h-4" />, variant: 'red'   });
    }
    // ACCEPTED = owner has accepted, rental can be marked returned once gear is back
    if (status === 'ACCEPTED' || status === 'CONFIRMED' || status === 'IN_PROGRESS') {
      actions.push({ key: 'complete', label: 'Mark Returned', icon: <PackageCheck className="w-4 h-4" />, variant: 'blue' });
    }
  }

  if (role === 'renter') {
    if (status === 'PENDING' || status === 'ACCEPTED') {
      actions.push({ key: 'cancel', label: 'Cancel Booking', icon: <X className="w-4 h-4" />, variant: 'red' });
    }
  }

  if (actions.length === 0) return null;

  async function handleAction(key: ActionKey) {
    setLoading(key);
    try {
      let updated: Booking;
      switch (key) {
        case 'accept':   updated = await acceptBooking(booking.id);   break;
        case 'reject':   updated = await rejectBooking(booking.id);   break;
        case 'complete': updated = await completeBooking(booking.id); break;
        case 'cancel':   updated = await cancelBooking(booking.id);   break;
      }
      const messages: Record<ActionKey, string> = {
        accept:   '✅ Booking accepted! Renter will be notified.',
        reject:   'Booking rejected.',
        complete: '📦 Marked as returned.',
        cancel:   'Booking cancelled.',
      };
      toast.success(messages[key]);
      onUpdate?.(updated!);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? `Action failed — please retry.`);
    } finally {
      setLoading(null);
    }
  }

  const variantStyles: Record<string, string> = {
    green: 'bg-[#16a34a] text-white hover:bg-[#15803d]',
    red:   'bg-red-500 text-white hover:bg-red-600',
    blue:  'bg-blue-500 text-white hover:bg-blue-600',
    gray:  'bg-gray-100 text-gray-700 hover:bg-gray-200',
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {actions.map(({ key, label, icon, variant }) => (
        <button
          key={key}
          onClick={() => handleAction(key)}
          disabled={!!loading}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
                      transition-colors disabled:opacity-60 disabled:cursor-not-allowed
                      ${variantStyles[variant]}`}
        >
          {loading === key
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : icon}
          {label}
        </button>
      ))}
    </div>
  );
}
