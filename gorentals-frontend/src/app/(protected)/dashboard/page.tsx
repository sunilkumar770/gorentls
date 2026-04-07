'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRenterBookings } from '@/hooks/useBookings';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Calendar, Package, Loader2, XCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { cancelBooking } from '@/services/bookings';
import { toast } from 'react-hot-toast';
import type { BookingStatus } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; pill: string; dot: string }> = {
  PENDING: {
    label: 'Pending',
    pill: 'bg-amber-50 text-amber-700 ring-amber-200',
    dot: '🟡',
  },
  CONFIRMED: {
    label: 'Confirmed',
    pill: 'bg-[#f0fdf4] text-[#16a34a] ring-[#16a34a]/20',
    dot: '🟢',
  },
  ACTIVE: {
    label: 'In Progress',
    pill: 'bg-blue-50 text-blue-700 ring-blue-200',
    dot: '🔵',
  },
  COMPLETED: {
    label: 'Completed',
    pill: 'bg-[#f0fdf4] text-[#15803d] ring-[#16a34a]/20',
    dot: '✅',
  },
  REJECTED: {
    label: 'Rejected',
    pill: 'bg-red-50 text-red-700 ring-red-200',
    dot: '❌',
  },
  CANCELLED: {
    label: 'Cancelled',
    pill: 'bg-gray-100 text-[#6b7280] ring-gray-200',
    dot: '⭕',
  },
};

const FILTER_TABS = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Rejected', value: 'REJECTED' },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
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

// ─── Page ────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { bookings, loading: bookingsLoading, refetch } = useRenterBookings(user?.id);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('ALL');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-[#16a34a]/20 border-t-[#16a34a] animate-spin" />
          <span className="text-sm text-[#6b7280]">Loading your bookings…</span>
        </div>
      </div>
    );
  }

  const filteredBookings = activeFilter === 'ALL'
    ? bookings
    : bookings.filter(b => b.status === activeFilter);

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId);
      toast.success('Booking cancelled successfully.');
      refetch?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Navbar */}
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#111827]">My Rentals</h1>
            <p className="text-[#6b7280] text-sm mt-1">
              Welcome back, <span className="font-semibold text-[#111827]">{profile?.fullName || 'User'}</span>
            </p>
          </div>
          <Link
            href="/search"
            className="px-4 py-2 bg-[#16a34a] text-white text-sm font-medium rounded-lg hover:bg-[#15803d] transition-colors"
          >
            Browse listings
          </Link>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap mb-6">
          {FILTER_TABS.map(tab => {
            const count = tab.value === 'ALL'
              ? bookings.length
              : bookings.filter(b => b.status === tab.value).length;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveFilter(tab.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activeFilter === tab.value
                    ? 'bg-[#f0fdf4] text-[#16a34a] ring-1 ring-[#16a34a]'
                    : 'bg-white text-[#6b7280] ring-1 ring-[#e5e7eb] hover:ring-[#d1d5db]'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    activeFilter === tab.value ? 'bg-[#16a34a] text-white' : 'bg-[#f3f4f6] text-[#6b7280]'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {bookingsLoading ? (
          <div className="flex flex-col gap-4">
            <BookingSkeleton />
            <BookingSkeleton />
            <BookingSkeleton />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
            <Calendar className="w-12 h-12 text-[#d1d5db] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#111827] mb-2">No rentals found</h3>
            <p className="text-[#6b7280] text-sm mb-6 max-w-xs mx-auto">
              {activeFilter === 'ALL'
                ? "You haven't made any bookings yet."
                : `No ${STATUS_CONFIG[activeFilter]?.label.toLowerCase() || ''} bookings.`}
            </p>
            <Link
              href="/search"
              className="px-5 py-2.5 bg-[#16a34a] text-white text-sm font-medium rounded-lg hover:bg-[#15803d] transition-colors"
            >
              Browse listings
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredBookings.map((booking) => {
              const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.CANCELLED;
              const image = booking.listing?.listing_images?.[0]?.image_url;
              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl shadow-sm p-5 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow"
                >
                  {/* Thumbnail */}
                  <div className="w-full sm:w-20 h-20 sm:h-16 rounded-lg overflow-hidden bg-[#f9fafb] flex-shrink-0">
                    {image ? (
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-[#d1d5db]" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-[#111827] truncate">
                          {booking.listing?.title || 'Unnamed listing'}
                        </h3>
                        <p className="text-sm text-[#6b7280] mt-0.5">
                          {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}
                        </p>
                        <p className="text-sm text-[#6b7280]">
                          {formatCurrency(booking.totalAmount)} total
                        </p>
                      </div>
                      <span className={`flex-shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full ring-1 ring-inset ${cfg.pill}`}>
                        {cfg.dot} {cfg.label}
                      </span>
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#f3f4f6]">
                      <Link
                        href={`/item/${booking.listingId}`}
                        className="text-xs text-[#16a34a] font-medium hover:underline"
                      >
                        View listing →
                      </Link>

                      {booking.status === 'COMPLETED' && (
                        <button className="text-xs text-[#16a34a] font-medium border border-[#16a34a] px-3 py-1 rounded-lg hover:bg-[#f0fdf4] transition-colors flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Leave Review
                        </button>
                      )}

                      {booking.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="text-xs text-red-600 font-medium border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          {cancellingId === booking.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
