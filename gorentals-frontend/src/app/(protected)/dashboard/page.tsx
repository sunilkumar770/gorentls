'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRenterBookings } from '@/hooks/useBookings';
import { formatDate } from '@/lib/utils';
import {
  Calendar, Package, Loader2,
  TrendingUp, Clock, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { cancelBooking } from '@/services/bookings';
import { toast } from 'react-hot-toast';

// ── Status config — every value the backend actually sends ─────────────────
const STATUS_CONFIG: Record<string, { label: string; pill: string; dot: string }> = {
  PENDING:     { label: 'Pending Approval', pill: 'bg-amber-50  text-amber-700  ring-1 ring-amber-200',  dot: '🟡' },
  ACCEPTED:    { label: 'Accepted',         pill: 'bg-green-50  text-green-700  ring-1 ring-green-200',  dot: '🟢' },
  CONFIRMED:   { label: 'Confirmed',        pill: 'bg-green-50  text-green-700  ring-1 ring-green-200',  dot: '🟢' },
  IN_PROGRESS: { label: 'In Progress',      pill: 'bg-blue-50   text-blue-700   ring-1 ring-blue-200',   dot: '🔵' },
  COMPLETED:   { label: 'Completed',        pill: 'bg-gray-100  text-gray-600   ring-1 ring-gray-200',   dot: '✅' },
  RETURNED:    { label: 'Returned',         pill: 'bg-gray-100  text-gray-600   ring-1 ring-gray-200',   dot: '📦' },
  REJECTED:    { label: 'Rejected',         pill: 'bg-red-50    text-red-700    ring-1 ring-red-200',    dot: '❌' },
  CANCELLED:   { label: 'Cancelled',        pill: 'bg-gray-100  text-gray-500   ring-1 ring-gray-200',   dot: '⭕' },
};

function BookingSkeleton() {
  return (
    <div className="flex gap-4 bg-white rounded-xl p-5 shadow-sm animate-pulse">
      <div className="w-20 h-16 bg-gray-200 rounded-lg flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 w-1/2 bg-gray-200 rounded" />
        <div className="h-3 w-1/3 bg-gray-200 rounded" />
        <div className="h-3 w-1/4 bg-gray-200 rounded" />
      </div>
      <div className="w-20 h-8 bg-gray-200 rounded-lg" />
    </div>
  );
}

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { bookings, loading: bookingsLoading, refetch } = useRenterBookings(user?.id);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-[#16a34a]/20 border-t-[#16a34a] animate-spin" />
          <span className="text-sm text-[#6b7280]">Loading your dashboard…</span>
        </div>
      </div>
    );
  }

  // ── KPI derivations (correct enum values) ────────────────────────────────
  const activeCount  = bookings.filter(b =>
    b.status === 'ACCEPTED' || b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS'
  ).length;
  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;
  const totalSpent   = bookings
    .filter(b => b.paymentStatus === 'COMPLETED' || b.paymentStatus === 'PAID')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // Last 3 bookings sorted newest-first
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId);
      toast.success('Booking cancelled.');
      refetch?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <nav className="sticky top-0 z-50 bg-white border-b border-[#e5e7eb]">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-[#111827]">
            <span className="w-8 h-8 bg-[#16a34a] rounded-lg flex items-center justify-center text-white text-sm font-black">G</span>
            GoRentals
          </Link>
          <Link href="/search" className="text-sm text-[#16a34a] font-medium hover:underline">
            Browse listings
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#111827]">
            Welcome back{profile?.fullName ? `, ${profile.fullName.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-[#6b7280] mt-1">Here's a summary of your rental activity.</p>
        </div>

        {/* ── KPI Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e5e7eb]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs text-[#6b7280] font-medium">Active</span>
            </div>
            <p className="text-2xl font-bold text-[#111827]">{activeCount}</p>
            <p className="text-xs text-[#9ca3af] mt-0.5">ongoing rentals</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e5e7eb]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs text-[#6b7280] font-medium">Pending</span>
            </div>
            <p className="text-2xl font-bold text-[#111827]">{pendingCount}</p>
            <p className="text-xs text-[#9ca3af] mt-0.5">awaiting approval</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e5e7eb]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-[#f0fdf4] rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#16a34a]" />
              </div>
              <span className="text-xs text-[#6b7280] font-medium">Spent</span>
            </div>
            <p className="text-2xl font-bold text-[#111827]">
              ₹{totalSpent.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-[#9ca3af] mt-0.5">total paid</p>
          </div>
        </div>

        {/* ── Recent Bookings ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#111827]">Recent bookings</h2>
          <Link href="/my-bookings"
                className="text-sm text-[#16a34a] font-medium hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {bookingsLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => <BookingSkeleton key={i} />)}
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-12 text-center">
            <div className="w-14 h-14 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-7 h-7 text-[#9ca3af]" />
            </div>
            <h3 className="font-bold text-[#111827] mb-1">No bookings yet</h3>
            <p className="text-[#6b7280] text-sm mb-5">Start renting items near you.</p>
            <Link href="/search"
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-[#16a34a] text-white text-sm font-semibold rounded-xl hover:bg-[#15803d] transition-colors">
              Browse listings
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {recentBookings.map(booking => {
              const cfg = STATUS_CONFIG[booking.status]
                ?? { label: booking.status, pill: 'bg-gray-100 text-gray-600', dot: '•' };
              const canCancel =
                booking.status === 'PENDING' || booking.status === 'ACCEPTED';

              return (
                <div key={booking.id}
                     className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-5 flex gap-4 items-start">
                  <div className="w-20 h-16 bg-[#f3f4f6] rounded-lg flex-shrink-0 overflow-hidden">
                    {booking.listing?.listing_images?.[0]?.image_url ? (
                      <img src={booking.listing.listing_images[0].image_url}
                           alt={booking.listing?.title}
                           className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-[#9ca3af]" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#111827] truncate text-sm">
                      {booking.listing?.title ?? 'Unknown item'}
                    </p>
                    <p className="text-xs text-[#6b7280] mt-0.5">
                      {booking.checkInDate && booking.checkOutDate
                        ? `${formatDate(booking.checkInDate)} – ${formatDate(booking.checkOutDate)}`
                        : '—'}
                    </p>
                    <span className={`mt-1.5 inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${cfg.pill}`}>
                      {cfg.dot} {cfg.label}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-sm font-bold text-[#111827]">
                      ₹{(booking.totalAmount || 0).toLocaleString('en-IN')}
                    </p>
                    {canCancel && (
                      <button disabled={cancellingId === booking.id}
                              onClick={() => handleCancel(booking.id)}
                              className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50">
                        {cancellingId === booking.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {bookings.length > 3 && (
              <Link href="/my-bookings"
                    className="flex items-center justify-center gap-1.5 text-sm text-[#16a34a] font-medium
                               py-3 border border-[#16a34a]/30 rounded-xl hover:bg-[#f0fdf4] transition-colors">
                View all {bookings.length} bookings <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
