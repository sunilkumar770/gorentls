'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRenterBookings } from '@/hooks/useBookings';
import { formatDate } from '@/lib/utils';
import {
  Calendar, Package, Loader2,
  TrendingUp, Clock, ArrowRight,
  ShieldAlert, BadgeCheck, Zap,
  XCircle, RotateCcw, Box
} from 'lucide-react';
import Link from 'next/link';
import { cancelBooking } from '@/services/bookings';
import { toast } from 'react-hot-toast';

// ── Status config mapped to Deep Teal vibes ────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; pill: string; icon: any }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', pill: 'bg-[#fef3c7] text-[#92400e] border border-[#fde68a]', icon: Clock },
  CONFIRMED:   { label: 'Confirmed',        pill: 'bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--border)]', icon: BadgeCheck },
  IN_USE:      { label: 'In Use',           pill: 'bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe]', icon: Zap },
  COMPLETED:   { label: 'Completed',        pill: 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border)]', icon: ShieldAlert },
  RETURNED:    { label: 'Returned',         pill: 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border)]', icon: RotateCcw },
  CANCELLED:   { label: 'Cancelled',        pill: 'bg-[var(--bg-subtle)] text-[var(--text-faint)] border border-[var(--border)]', icon: XCircle },
  NO_SHOW:     { label: 'No Show',          pill: 'bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca]', icon: XCircle },
  DISPUTED:    { label: 'Disputed',         pill: 'bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca]', icon: ShieldAlert },
};

function BookingSkeleton() {
  return (
    <div className="flex gap-5 bg-[var(--bg-card)] rounded-[var(--r-xl)] p-5 shadow-card animate-pulse border border-[var(--border)]">
      <div className="w-24 h-20 bg-[var(--bg-subtle)] rounded-[var(--r-lg)] flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-3 justify-center">
        <div className="h-4 w-1/2 bg-[var(--bg-subtle)] rounded-full" />
        <div className="h-3 w-1/3 bg-[var(--bg-subtle)] rounded-full" />
        <div className="h-5 w-24 bg-[var(--bg-subtle)] rounded-full mt-1" />
      </div>
      <div className="w-20 h-8 bg-[var(--bg-subtle)] rounded-full self-center" />
    </div>
  );
}

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { bookings, loading: bookingsLoading, refetch } = useRenterBookings(user?.id);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[var(--primary-light)] border-t-[var(--primary)] animate-spin" />
          <span className="text-sm font-semibold text-[var(--text-muted)] tracking-widest uppercase">
            {authLoading ? 'Connecting...' : 'Redirecting...'}
          </span>
        </div>
      </div>
    );
  }

  // ── KPI derivations ──────────────────────────────────────────────────────
  const activeCount  = bookings.filter(b =>
    b.status === 'CONFIRMED' || b.status === 'IN_USE'
  ).length;
  const pendingCount = bookings.filter(b => b.status === 'PENDING_PAYMENT').length;
  const totalSpent   = bookings
    .filter(b => b.paymentStatus === 'COMPLETED' || b.paymentStatus === 'PAID')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId);
      toast.success('Reservation successfully cancelled.');
      refetch?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Cancellation sequence failed.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24">
      {/* Utility Nav */}
      <nav className="sticky top-0 z-50 bg-[var(--bg-card)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg gradient-teal flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Box className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-[var(--text)] tracking-tight">GoRentals</span>
          </Link>
          <Link href="/search" className="text-sm text-[var(--primary)] font-semibold hover:text-[var(--primary-hover)] transition-colors">
            Browse Directory
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-[var(--text)] tracking-tight">
            Control Center{profile?.fullName ? `, ${profile.fullName.split(' ')[0]}` : ''}.
          </h1>
          <p className="text-[var(--text-muted)] mt-2 font-medium">Overview of your active and historical engagements.</p>
        </div>

        {/* ── KPI Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[var(--bg-card)] rounded-[var(--r-xl)] p-6 shadow-card border border-[var(--border)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary-light)] rounded-full blur-[40px] -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[var(--bg-subtle)] rounded-[var(--r-md)] flex items-center justify-center">
                  <Package className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <span className="text-sm text-[var(--text-muted)] font-bold uppercase tracking-widest">Active</span>
              </div>
              <p className="text-4xl font-display font-bold text-[var(--text)]">{activeCount}</p>
              <p className="text-xs text-[var(--text-faint)] font-medium mt-1">units currently deployed</p>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] rounded-[var(--r-xl)] p-6 shadow-card border border-[var(--border)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#fef3c7] rounded-full blur-[40px] -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[var(--bg-subtle)] rounded-[var(--r-md)] flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#d97706]" />
                </div>
                <span className="text-sm text-[var(--text-muted)] font-bold uppercase tracking-widest">Pending</span>
              </div>
              <p className="text-4xl font-display font-bold text-[var(--text)]">{pendingCount}</p>
              <p className="text-xs text-[var(--text-faint)] font-medium mt-1">awaiting owner authorization</p>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] rounded-[var(--r-xl)] p-6 shadow-card border border-[var(--border)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#dcfce7] rounded-full blur-[40px] -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[var(--bg-subtle)] rounded-[var(--r-md)] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#16a34a]" />
                </div>
                <span className="text-sm text-[var(--text-muted)] font-bold uppercase tracking-widest">Capital</span>
              </div>
              <p className="text-4xl font-display font-bold text-[var(--text)] tracking-tight">
                <span className="text-2xl text-[var(--text-faint)] font-medium mr-1">₹</span>
                {totalSpent.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-[var(--text-faint)] font-medium mt-1">total lifetime expenditure</p>
            </div>
          </div>
        </div>

        {/* ── Recent Bookings ──────────────────────────────────────────── */}
        <div className="flex items-end justify-between mb-6 pb-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-xl font-display font-bold text-[var(--text)] tracking-tight">Activity Log</h2>
            <p className="text-sm text-[var(--text-muted)]">Your most recent rental requests</p>
          </div>
          <Link href="/my-bookings"
                className="text-sm text-[var(--primary)] font-bold hover:text-[var(--primary-hover)] transition-colors flex items-center gap-1.5 uppercase tracking-widest">
            Complete Log <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {bookingsLoading ? (
          <div className="flex flex-col gap-5">
            {[1, 2, 3].map(i => <BookingSkeleton key={i} />)}
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="bg-[var(--bg-card)] rounded-[var(--r-xl)] shadow-sm border border-[var(--border)] p-16 text-center shadow-card">
            <div className="w-16 h-16 bg-[var(--bg-subtle)] rounded-full flex items-center justify-center mx-auto mb-5">
              <Calendar className="w-8 h-8 text-[var(--text-faint)]" />
            </div>
            <h3 className="font-display text-xl font-bold text-[var(--text)] mb-2">Archive Empty</h3>
            <p className="text-[var(--text-muted)] text-sm mb-6 max-w-sm mx-auto">You have no active or historical bookings. Explore our curated directory to find professional equipment.</p>
            <Link href="/search"
                  className="inline-flex h-12 items-center justify-center px-8 gradient-teal text-white text-sm font-bold rounded-[var(--r-md)] shadow-card hover:shadow-card-hover transition-all">
              Initialize Search
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {recentBookings.map(booking => {
              const cfg = STATUS_CONFIG[booking.status]
                ?? { label: booking.status, pill: 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border)]', icon: ShieldAlert };
              
              const StatusIcon = cfg.icon;
              const canCancel = booking.status === 'PENDING_PAYMENT' || booking.status === 'CONFIRMED';

              return (
                <div key={booking.id}
                     className="bg-[var(--bg-card)] rounded-[var(--r-xl)] shadow-sm hover:shadow-card border border-[var(--border)] p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center transition-all group">
                  
                  {/* Thumbnail */}
                  <div className="w-full sm:w-28 h-32 sm:h-24 bg-[var(--bg-subtle)] rounded-[var(--r-lg)] flex-shrink-0 overflow-hidden relative">
                    {booking.listing?.images?.[0] || booking.listing?.listing_images?.[0]?.image_url ? (
                      <img src={booking.listing.images?.[0] || booking.listing.listing_images?.[0]?.image_url}
                           alt={booking.listing?.title}
                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-[var(--text-faint)]" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center w-full">
                    <p className="font-display font-bold text-[var(--text)] text-lg mb-1 truncate">
                      {booking.listing?.title ?? 'Unknown Resource'}
                    </p>
                    <p className="text-sm text-[var(--text-muted)] font-medium mb-3">
                      {booking.startDate && booking.endDate
                        ? `${formatDate(booking.startDate)} → ${formatDate(booking.endDate)}`
                        : 'Dates undefined'}
                    </p>
                    <div className="flex items-center gap-2">
                       <span className={`inline-flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-[var(--r-pill)] font-bold uppercase tracking-widest ${cfg.pill}`}>
                         <StatusIcon className="w-3.5 h-3.5" /> {cfg.label}
                       </span>
                    </div>
                  </div>

                  {/* Financials & Actions */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto gap-4 pt-4 sm:pt-0 border-t border-[var(--border)] sm:border-none">
                    <p className="text-lg font-display font-bold text-[var(--text)] tracking-tight">
                      ₹{(booking.totalAmount || 0).toLocaleString('en-IN')}
                    </p>
                    {canCancel ? (
                      <button disabled={cancellingId === booking.id}
                              onClick={() => handleCancel(booking.id)}
                              className="px-4 py-2 text-xs font-bold text-[#b91c1c] bg-[#fef2f2] rounded-[var(--r-md)] hover:bg-[#fee2e2] disabled:opacity-50 transition-colors uppercase tracking-widest flex items-center gap-1.5 border border-[#fecaca]">
                        {cancellingId === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                        {cancellingId === booking.id ? 'Aborting' : 'Abort'}
                      </button>
                    ) : (
                       <Link href={`/messages`}
                             className="px-4 py-2 text-xs font-bold text-[var(--text-muted)] bg-[var(--bg-subtle)] rounded-[var(--r-md)] hover:bg-[var(--border)] transition-colors uppercase tracking-widest border border-[var(--border)]">
                          Contact
                       </Link>
                    )}
                  </div>
                </div>
              );
            })}

            {bookings.length > 3 && (
              <Link href="/my-bookings"
                    className="flex w-full items-center justify-center gap-2 text-sm text-[var(--primary)] font-bold
                               py-4 rounded-[var(--r-md)] hover:bg-[var(--primary-light)] border border-[var(--border)] bg-[var(--bg-card)] transition-colors uppercase tracking-widest mt-2">
                Launch Full Archive ({bookings.length}) <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
