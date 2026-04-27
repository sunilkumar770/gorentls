"use client";

import { useState, useEffect } from 'react';
import { useOwnerBookings } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import {
  Package, IndianRupee, Clock, CheckCircle, XCircle,
  Loader2, Star, ArrowRight, Pencil, Eye, EyeOff, AlertCircle,
  Box, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { acceptBooking, rejectBooking } from '@/services/bookings';
import { Button } from '@/components/ui/Button';
import {
  getOwnerListings,
  toggleListingAvailability,
  publishListing,
} from '@/services/listings';
import type { Listing } from '@/types';
import { toast } from 'react-hot-toast';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--bg)] pt-4 pb-16 animate-pulse">
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-10 w-1/3 bg-[var(--bg-subtle)] rounded-[var(--r-md)] mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-[var(--bg-card)] rounded-[var(--r-xl)] shadow-card border border-[var(--border)]" />
          ))}
        </div>
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-[var(--bg-card)] rounded-[var(--r-xl)] shadow-card border border-[var(--border)]" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AvailabilityToggle ───────────────────────────────────────────────────────
function AvailabilityToggle({
  listingId,
  isAvailable,
  onToggle,
}: {
  listingId: string;
  isAvailable: boolean;
  onToggle: (id: string, next: boolean) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    await onToggle(listingId, !isAvailable);
    setBusy(false);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={busy}
      title={isAvailable ? 'Mark as unavailable' : 'Mark as available'}
      className={`p-2 transition-colors ${
        isAvailable
          ? 'text-[var(--primary)] hover:bg-[var(--primary-light)]'
          : 'text-[var(--text-faint)] hover:bg-[var(--bg-subtle)]'
      }`}
    >
      {busy
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : isAvailable
          ? <Eye className="w-4 h-4" />
          : <EyeOff className="w-4 h-4" />
      }
    </Button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OwnerDashboardPage() {
  const { user, profile } = useAuth();
  const { bookings, loading, refetch } = useOwnerBookings();
  const [listings, setListings]               = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError]     = useState<string | null>(null);
  const [actionId, setActionId]               = useState<string | null>(null);
  const [activeTab, setActiveTab]             = useState<'listings' | 'requests'>('listings');

  const loadListings = () => {
    if (!user?.id) return;
    setListingsLoading(true);
    setListingsError(null);
    getOwnerListings(user.id)
      .then(setListings)
      .catch((err: any) => {
        const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to load listings.';
        setListingsError(msg);
        toast.error(msg);
      })
      .finally(() => setListingsLoading(false));
  };

  useEffect(loadListings, [user?.id]);

  useEffect(() => {
    if (!loading) {
      if (!profile) {
        window.location.replace('/login?redirect=/owner/dashboard');
        return;
      }
    }
  }, [loading, profile]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[var(--primary-light)] border-t-[var(--primary)] animate-spin" />
          <span className="text-sm font-semibold text-[var(--text-muted)] tracking-widest uppercase">
            {loading ? 'Connecting...' : 'Redirecting...'}
          </span>
        </div>
      </div>
    );
  }

  const activeBookings  = bookings.filter(b => b.status === 'ACCEPTED' || b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS');
  const pendingRequests = bookings.filter(b => b.status === 'PENDING');
  const totalEarned     = bookings
    .filter(b => b.paymentStatus === 'COMPLETED')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const handleAccept = async (id: string) => {
    setActionId(id);
    try {
      await acceptBooking(id);
      toast.success('Reservation authorized.');
      refetch?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Authorization failed.');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionId(id);
    try {
      await rejectBooking(id);
      toast.success('Reservation declined.');
      refetch?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Action failed.');
    } finally {
      setActionId(null);
    }
  };

  const handleToggleAvailability = async (id: string, nextAvailable: boolean) => {
    const prevAvailable = !nextAvailable;

    setListings(prev => prev.map(l => l.id === id ? { ...l, is_available: nextAvailable } : l));

    try {
      const updated = await toggleListingAvailability(id, nextAvailable);
      setListings(prev => prev.map(l => l.id === id ? updated : l));
      toast.success(nextAvailable ? 'Asset online.' : 'Asset suspended.');
    } catch (err: any) {
      setListings(prev => prev.map(l => l.id === id ? { ...l, is_available: prevAvailable } : l));
      toast.error(err?.response?.data?.message ?? 'Failed to alter asset state.');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const updated = await publishListing(id);
      setListings(prev => prev.map(l => l.id === id ? updated : l));
      toast.success('Asset deployed to public archive.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Deployment failed.');
    }
  };

  const isKycApproved = profile?.kycStatus === 'APPROVED';

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24">
      {/* KYC Warning Banner */}
      {!isKycApproved && (
        <div className="bg-[#fef3c7] border-b border-[#fde68a] py-3 px-6">
          <div className="max-w-6xl mx-auto flex items-center gap-3 text-[#92400e]">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-semibold tracking-tight">
              Verification Pipeline Pending. Assets can be registered but will remain encrypted from public search until clearance.
            </p>
          </div>
        </div>
      )}

      {/* Utility Nav */}
      <nav className="sticky top-0 z-50 bg-[var(--bg-card)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg gradient-teal flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Box className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-[var(--text)] tracking-tight">GoRentals</span>
          </Link>
          <Button
            variant="gradient"
            size="sm"
            asChild
            className="px-5 font-bold uppercase tracking-widest"
          >
            <Link href="/create-listing">
              Deploy Asset
            </Link>
          </Button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-[var(--text)] tracking-tight">
            {greeting}, {profile?.fullName?.split(' ')[0] ?? 'Operator'}
          </h1>
          <p className="text-[var(--text-muted)] mt-2 font-medium">Logistics and fleet management overview.</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: Package,     label: 'Total Assets',  value: listings.length.toString(),        sub: 'registered', bgLight: 'bg-[var(--bg-subtle)]', color: 'text-[var(--primary)]', glow: 'bg-[var(--primary-light)]' },
            { icon: Clock,       label: 'Active Leases', value: activeBookings.length.toString(),  sub: 'ongoing',    bgLight: 'bg-[#dbeafe]', color: 'text-[#1e40af]', glow: 'bg-[#eff6ff]' },
            { icon: IndianRupee, label: 'Capital Gen',   value: `${formatCurrency(totalEarned)}`,   sub: 'lifetime',   bgLight: 'bg-[#f0fdf4]', color: 'text-[#16a34a]', glow: 'bg-[#dcfce7]' },
            { icon: Star,        label: 'Inbound',       value: pendingRequests.length.toString(),  sub: 'requests',   bgLight: 'bg-[#fef3c7]', color: 'text-[#d97706]', glow: 'bg-[#ffedd5]', badge: pendingRequests.length > 0 },
          ].map(({ icon: Icon, label, value, sub, bgLight, color, glow, badge }) => (
            <div key={label} className="bg-[var(--bg-card)] rounded-[var(--r-xl)] p-6 shadow-card border border-[var(--border)] relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-28 h-28 ${glow} rounded-full blur-[35px] -mr-8 -mt-8 opacity-50 group-hover:opacity-100 transition-opacity`} />
              {badge && <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]" />}
              <div className="relative">
                <div className={`w-10 h-10 ${bgLight} rounded-[var(--r-md)] flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-1">{label}</p>
                <p className="text-3xl font-display font-bold text-[var(--text)] tracking-tight">{value}</p>
                <p className="text-xs text-[var(--text-faint)] font-medium mt-1">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] mb-8">
          {(['listings', 'requests'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 uppercase tracking-widest ${
                activeTab === tab
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {tab === 'listings' ? 'Fleet Database' : 'Inbound Requests'}
              {tab === 'requests' && pendingRequests.length > 0 && (
                <span className="px-2 py-0.5 text-[10px] bg-[#fee2e2] text-[#b91c1c] rounded-full font-black border border-[#fecaca] shadow-sm">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── My Listings Tab ───────────────────────────────────────────────── */}
        {activeTab === 'listings' && (
          <section>
            {listingsLoading ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-[var(--bg-card)] rounded-[var(--r-xl)] shadow-card border border-[var(--border)] animate-pulse" />
                ))}
              </div>
            ) : listingsError ? (
              <div className="bg-[var(--bg-card)] rounded-[var(--r-xl)] p-12 text-center shadow-card border border-[#fecaca]">
                <AlertCircle className="w-12 h-12 text-[#f87171] mx-auto mb-4" />
                <h3 className="text-xl font-display font-bold text-[var(--text)] mb-2">Fleet Synchronization Failed</h3>
                <p className="text-sm text-[var(--text-muted)] mb-6 max-w-sm mx-auto">{listingsError}</p>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={loadListings}
                  className="uppercase tracking-widest font-bold"
                >
                  Retry Connection
                </Button>
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-[var(--bg-card)] rounded-[var(--r-xl)] p-16 text-center shadow-card border border-[var(--border)]">
                <Package className="w-14 h-14 text-[var(--text-faint)] mx-auto mb-5" />
                <h3 className="text-xl font-display font-bold text-[var(--text)] mb-2">Registry Empty</h3>
                <p className="text-[var(--text-muted)] text-sm mb-8 max-w-sm mx-auto">You have zero assets deployed. Register inventory to begin generating capital.</p>
                <Link
                  href="/create-listing"
                  className="inline-flex px-8 py-3 gradient-teal text-white text-sm font-bold rounded-[var(--r-md)] hover:shadow-card transition-all uppercase tracking-widest"
                >
                  Register Asset
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {listings.map(listing => {
                  const image = listing.listing_images?.[0]?.image_url;
                  return (
                    <div key={listing.id} className="bg-[var(--bg-card)] rounded-[var(--r-xl)] shadow-sm hover:shadow-card border border-[var(--border)] p-4 flex flex-col md:flex-row gap-5 items-start md:items-center transition-all group">
                      
                      <div className="w-full md:w-32 h-32 md:h-24 rounded-[var(--r-lg)] bg-[var(--bg-subtle)] overflow-hidden flex-shrink-0">
                        {image ? (
                          <img src={image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-[var(--text-faint)]" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-display font-bold text-[var(--text)] text-lg truncate">{listing.title}</p>
                          {!listing.is_published && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-[#fef3c7] text-[#d97706] border border-[#fde68a] rounded-full uppercase tracking-tighter">Standby</span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--text-muted)] font-medium mb-3">
                          <span className="bg-[var(--bg-subtle)] px-2 py-0.5 rounded mr-2">{listing.category}</span>
                          {formatCurrency(listing.pricePerDay ?? listing.price_per_day ?? 0)} / cycle
                        </p>
                      </div>

                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 pt-4 md:pt-0 border-t border-[var(--border)] md:border-none">
                        <div className="flex items-center gap-2 bg-[var(--bg-subtle)] px-2 py-1 rounded-[var(--r-md)]">
                          {!listing.is_published && (
                            <button
                              onClick={() => handlePublish(listing.id)}
                              className="px-3 py-1.5 text-[11px] font-bold text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-[var(--r-md)] transition-colors uppercase tracking-widest mr-1"
                            >
                              Deploy
                            </button>
                          )}
                          <AvailabilityToggle
                            listingId={listing.id}
                            isAvailable={listing.is_available}
                            onToggle={handleToggleAvailability}
                          />
                          <div className="w-px h-4 bg-[var(--border-strong)] mx-1" />
                          <Link
                            href={`/owner/listings/${listing.id}/edit`}
                            className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-card)] rounded-[var(--r-md)] hover:text-[var(--text)] transition-colors"
                            title="Configure"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/item/${listing.id}`}
                            className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-card)] rounded-[var(--r-md)] hover:text-[var(--text)] transition-colors"
                            title="View Terminal"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Requests Tab ──────────────────────────────────────────────────── */}
        {activeTab === 'requests' && (
          <section>
            {pendingRequests.length === 0 ? (
              <div className="bg-[var(--bg-card)] rounded-[var(--r-xl)] p-16 text-center shadow-card border border-[var(--border)]">
                <Clock className="w-14 h-14 text-[var(--text-faint)] mx-auto mb-5" />
                <h3 className="text-xl font-display font-bold text-[var(--text)] mb-2">Zero Inbound Comm</h3>
                <p className="text-[var(--text-muted)] text-sm">New rental authorizations will populate here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pendingRequests.map(booking => (
                  <div key={booking.id} className="bg-[var(--bg-card)] rounded-[var(--r-xl)] shadow-card hover:shadow-card-hover border border-[var(--border)] p-6 flex flex-col md:flex-row gap-6 items-center transition-all">
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-[#fef3c7] text-[#d97706] border border-[#fde68a] rounded-full uppercase tracking-widest">
                          Auth Required
                        </span>
                        <p className="text-xs text-[var(--text-faint)] font-medium">Ref: {booking.id.split('-')[0]}</p>
                      </div>
                      <p className="text-xl font-display font-bold text-[var(--text)] mb-1">
                        {booking.listing?.title}
                      </p>
                      <p className="text-sm font-medium text-[var(--text-muted)]">
                        {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}
                        <span className="mx-2 opacity-50">|</span>
                        <span className="text-[var(--primary)] font-bold">{formatCurrency(booking.totalAmount)}</span>
                      </p>
                    </div>
                <div className="flex w-full md:w-auto gap-3">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => handleReject(booking.id)}
                    disabled={actionId === booking.id}
                    loading={actionId === booking.id}
                    className="flex-1 md:flex-none text-red-600 hover:bg-red-50 border-red-100"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                  <Button
                    variant="gradient"
                    size="md"
                    onClick={() => handleAccept(booking.id)}
                    disabled={actionId === booking.id}
                    loading={actionId === booking.id}
                    className="flex-1 md:flex-none"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Authorize
                  </Button>
                </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
