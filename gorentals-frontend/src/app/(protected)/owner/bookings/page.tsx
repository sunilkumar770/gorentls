'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';

interface BookingListing { id: string; title: string; city?: string; }
interface BookingUser { id: string; fullName: string; email: string; phone?: string; }

interface OwnerBooking {
  id: string;
  listing: BookingListing;
  renter: BookingUser;
  startDate: string;
  endDate: string;
  totalDays: number;
  rentalAmount: number;
  securityDeposit: number;
  totalAmount: number;
  // ⚠️ All 8 real backend enum values — never use 'ACTIVE' (does not exist)
  status:
    | 'PENDING' | 'ACCEPTED' | 'CONFIRMED' | 'IN_PROGRESS'
    | 'COMPLETED' | 'RETURNED' | 'CANCELLED' | 'REJECTED';
  paymentStatus: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<OwnerBooking['status'], { label: string; bg: string; text: string }> = {
  PENDING:     { label: 'Pending',     bg: 'bg-yellow-100', text: 'text-yellow-800' },
  ACCEPTED:    { label: 'Accepted',    bg: 'bg-green-100',  text: 'text-green-800'  },
  CONFIRMED:   { label: 'Confirmed',   bg: 'bg-blue-100',   text: 'text-blue-800'   },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-indigo-100', text: 'text-indigo-800' },
  COMPLETED:   { label: 'Completed',   bg: 'bg-gray-100',   text: 'text-gray-700'   },
  RETURNED:    { label: 'Returned',    bg: 'bg-gray-100',   text: 'text-gray-700'   },
  CANCELLED:   { label: 'Cancelled',   bg: 'bg-red-100',    text: 'text-red-700'    },
  REJECTED:    { label: 'Rejected',    bg: 'bg-red-100',    text: 'text-red-700'    },
};

const TERMINAL: OwnerBooking['status'][] = [
  'COMPLETED', 'RETURNED', 'CANCELLED', 'REJECTED',
];

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function inr(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);
}

function Skeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-36 bg-gray-200 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

export default function OwnerBookingsPage() {
  const [bookings,       setBookings]       = useState<OwnerBooking[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [actionLoading,  setActionLoading]  = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/bookings/owner/bookings');
      const data: OwnerBooking[] = Array.isArray(res.data)
        ? res.data : (res.data?.content ?? []);
      setBookings(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not load bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  async function act(bookingId: string, action: 'accept' | 'reject' | 'complete') {
    setActionLoading(`${bookingId}-${action}`);
    try {
      await api.patch(`/bookings/${bookingId}/${action}`);
      await fetchBookings();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? `Failed to ${action} booking.`);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Booking Requests</h1>
          {!loading && !error && (
            <p className="text-gray-500 mt-1 text-sm">
              {bookings.length} booking{bookings.length !== 1 ? 's' : ''} received
            </p>
          )}
        </div>

        {loading && <Skeleton />}

        {!loading && error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchBookings} className="underline font-medium ml-4">Retry</button>
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-gray-800">No booking requests yet</h3>
            <p className="text-gray-500 mt-2 text-sm max-w-sm mx-auto">
              When renters request your listings, they will appear here.
            </p>
          </div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map(b => {
              const cfg         = STATUS_CONFIG[b.status];
              const isPending   = b.status === 'PENDING';
              // Accept / confirm / in-progress → owner can mark complete
              const canComplete =
                b.status === 'ACCEPTED' ||
                b.status === 'CONFIRMED' ||
                b.status === 'IN_PROGRESS';
              const isTerminal  = TERMINAL.includes(b.status);

              return (
                <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 truncate">{b.listing?.title ?? '—'}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Renter: <span className="text-gray-700 font-medium">{b.renter?.fullName ?? '—'}</span>
                        {b.renter?.phone && <span className="ml-2 text-gray-400">· {b.renter.phone}</span>}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {fmt(b.startDate)} → {fmt(b.endDate)}
                        <span className="ml-2 text-gray-400">({b.totalDays} day{b.totalDays !== 1 ? 's' : ''})</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-gray-900">{inr(b.totalAmount)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">+{inr(b.securityDeposit)} deposit</p>
                    </div>
                  </div>

                  {!isTerminal && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3 flex-wrap">
                      {isPending && (
                        <>
                          <button disabled={!!actionLoading} onClick={() => act(b.id, 'accept')}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors">
                            {actionLoading === `${b.id}-accept` ? 'Accepting…' : '✓ Accept'}
                          </button>
                          <button disabled={!!actionLoading} onClick={() => act(b.id, 'reject')}
                            className="px-4 py-2 bg-white text-red-700 border border-red-200 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors">
                            {actionLoading === `${b.id}-reject` ? 'Rejecting…' : '✕ Reject'}
                          </button>
                        </>
                      )}
                      {canComplete && (
                        <button disabled={!!actionLoading} onClick={() => act(b.id, 'complete')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors">
                          {actionLoading === `${b.id}-complete` ? 'Completing…' : '✔ Mark Complete'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
