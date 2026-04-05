'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRenterBookings } from '@/hooks/useBookings';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Calendar, Package, Clock, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cancelBooking } from '@/services/bookings';
import { toast } from 'react-hot-toast';

const STATUS_STYLES: Record<string, string> = {
  pending_confirmation: 'bg-[#fffbeb] text-[#92400e] ring-[#f59e0b]/20',
  confirmed:            'bg-[#ecfdf5] text-[#065f46] ring-[#10b981]/20',
  in_progress:          'bg-[#eff6ff] text-[#1e40af] ring-[#3b82f6]/20',
  completed:            'bg-[#f0fdf4] text-[#15803d] ring-[#22c55e]/20',
  owner_rejected:       'bg-[#fef2f2] text-[#991b1b] ring-[#ef4444]/20',
  renter_cancelled:     'bg-[#fff8f6] text-[#8c7164] ring-[#251913]/5',
};

const STATUS_LABELS: Record<string, string> = {
  pending_confirmation: 'Pending',
  confirmed:            'Confirmed',
  in_progress:          'In Progress',
  completed:            'Completed',
  owner_rejected:       'Rejected',
  renter_cancelled:     'Cancelled',
};

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { bookings, loading: bookingsLoading, refetch } = useRenterBookings(user?.id);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fff8f6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#f97316]/20 border-t-[#f97316] animate-spin" />
          <span className="text-xs font-black uppercase tracking-widest text-[#8c7164]">Retrieving Archives...</span>
        </div>
      </div>
    );
  }

  const activeBookings = bookings.filter(b => b.booking_status === 'confirmed' || b.booking_status === 'in_progress');
  const pendingBookings = bookings.filter(b => b.booking_status === 'pending_confirmation');

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
    <div className="min-h-screen bg-[#fff8f6] pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

        {/* Header */}
        <div className="mb-16 border-b border-[#251913]/5 pb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h1 className="text-6xl md:text-8xl font-display font-black tracking-tighter text-[#251913] leading-[0.8] mb-4">
              My<span className="text-[#f97316]"> Rentals.</span>
            </h1>
            <p className="text-xl text-[#8c7164] font-medium tracking-tight">
              Welcome back, <span className="text-[#251913] font-black">{profile?.fullName || 'Collector'}</span>. Your acquisition history.
            </p>
          </div>
          <div className="flex gap-4 flex-wrap">
            <div className="bg-white px-8 py-4 rounded-[1.5rem] shadow-ambient ring-1 ring-[#f97316]/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#8c7164] mb-1">Active</p>
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-[#f97316]" />
                <span className="text-3xl font-display font-black text-[#251913]">{activeBookings.length}</span>
              </div>
            </div>
            <div className="bg-white px-8 py-4 rounded-[1.5rem] shadow-ambient ring-1 ring-[#f97316]/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#8c7164] mb-1">Pending</p>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-[#f59e0b]" />
                <span className="text-3xl font-display font-black text-[#251913]">{pendingBookings.length}</span>
              </div>
            </div>
          </div>
        </div>

        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-display font-black text-[#251913] uppercase tracking-tighter">All Acquisitions</h2>
            <div className="h-px flex-1 bg-[#251913]/5 mx-6" />
            <Link href="/search" className="text-xs font-black uppercase tracking-widest text-[#f97316] hover:underline">
              Browse Archive →
            </Link>
          </div>

          {bookingsLoading ? (
            <div className="grid grid-cols-1 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-white rounded-[2rem] animate-pulse shadow-sm" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-20 text-center shadow-ambient ring-1 ring-[#f97316]/5">
              <Calendar className="h-16 w-16 text-[#f97316]/20 mx-auto mb-6" />
              <h3 className="text-3xl font-display font-black text-[#251913] mb-2 tracking-tight">The Gallery is Empty</h3>
              <p className="text-[#8c7164] mb-8 max-w-sm mx-auto font-medium">You haven&apos;t rented any artifacts yet. Start your journey in the archive.</p>
              <Link href="/search">
                <button className="gradient-signature px-10 py-4 text-white rounded-full font-display font-black text-lg shadow-lg hover:-translate-y-1 transition-transform">
                  Explore Archive
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {bookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-[2rem] overflow-hidden shadow-ambient ring-1 ring-[#f97316]/5 group transition-all hover:shadow-[0_24px_48px_rgba(37,25,19,0.08)]">
                  <div className="flex flex-col md:flex-row h-full">
                    <div className="relative w-full md:w-56 h-48 md:h-auto bg-[#fff8f6] shrink-0 overflow-hidden">
                      {booking.listings?.listing_images?.[0]?.image_url ? (
                        <img
                          src={booking.listings.listing_images[0].image_url}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-[#8c7164]/20" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 bg-white/90 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-[#251913] rounded-full shadow-sm">
                          #{booking.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 p-6 md:p-8 flex flex-col justify-between gap-4">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f97316] mb-1">Artifact Rental</p>
                          <h3 className="text-2xl font-display font-black text-[#251913] leading-none mb-3 tracking-tight">
                            {booking.listings?.title || 'Unnamed Artifact'}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-[#8c7164] uppercase tracking-widest">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-[#f97316]" />
                              <span>{formatDate(booking.check_in_date)} — {formatDate(booking.check_out_date)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-2">
                          <span className="text-2xl font-display font-black text-[#251913]">
                            {formatCurrency(booking.total_amount)}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${STATUS_STYLES[booking.booking_status] || STATUS_STYLES.renter_cancelled}`}>
                            {STATUS_LABELS[booking.booking_status] || booking.booking_status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-[#251913]/5">
                        <Link href={`/item/${booking.listing_id}`} className="text-xs font-black uppercase tracking-widest text-[#8c7164] hover:text-[#f97316] transition-colors">
                          View Listing →
                        </Link>
                        {booking.booking_status === 'pending_confirmation' && (
                          <button
                            onClick={() => handleCancel(booking.id)}
                            disabled={cancellingId === booking.id}
                            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#991b1b] hover:text-red-600 transition-colors disabled:opacity-50"
                          >
                            {cancellingId === booking.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            Cancel Request
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
