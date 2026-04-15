"use client";

import { useState, useEffect } from 'react';
import { useOwnerBookings } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import {
  Package, IndianRupee, Clock, CheckCircle, XCircle,
  Loader2, Star, ArrowRight, Pencil, Eye, EyeOff, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { acceptBooking, rejectBooking } from '@/services/bookings';
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
    <div className="min-h-screen bg-[#f9fafb] pt-4 pb-16 animate-pulse">
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <div className="h-10 w-1/3 bg-gray-200 rounded-lg mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-white rounded-2xl shadow-sm" />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-white rounded-xl shadow-sm" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AvailabilityToggle ───────────────────────────────────────────────────────
// Extracted as separate component to prevent re-render focus issues
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
    <button
      onClick={handleClick}
      disabled={busy}
      title={isAvailable ? 'Mark as unavailable' : 'Mark as available'}
      className={`p-1.5 rounded transition-colors disabled:opacity-50 ${
        isAvailable
          ? 'text-[#16a34a] hover:bg-[#f0fdf4]'
          : 'text-[#9ca3af] hover:bg-[#f3f4f6]'
      }`}
    >
      {busy
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : isAvailable
          ? <Eye className="w-4 h-4" />
          : <EyeOff className="w-4 h-4" />
      }
    </button>
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

  // Load owner listings
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

  if (loading) return <DashboardSkeleton />;

  const activeBookings  = bookings.filter(b => b.status === 'ACCEPTED' || b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS');
  const pendingRequests = bookings.filter(b => b.status === 'PENDING');
  const totalEarned     = bookings
    .filter(b => b.paymentStatus === 'COMPLETED')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // ─── Booking actions ────────────────────────────────────────────────────────
  const handleAccept = async (id: string) => {
    setActionId(id);
    try {
      await acceptBooking(id);
      toast.success('Booking accepted!');
      refetch?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to accept booking.');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionId(id);
    try {
      await rejectBooking(id);
      toast.success('Booking rejected.');
      refetch?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to reject booking.');
    } finally {
      setActionId(null);
    }
  };

  // ─── Optimistic availability toggle ─────────────────────────────────────────
  // UI updates instantly. If server fails → UI rolls back to previous state.
  const handleToggleAvailability = async (id: string, nextAvailable: boolean) => {
    const prevAvailable = !nextAvailable;

    // 1. Optimistic update
    setListings(prev => prev.map(l => l.id === id ? { ...l, is_available: nextAvailable } : l));

    try {
      const updated = await toggleListingAvailability(id, nextAvailable);
      // Sync exact server state (handles edge cases)
      setListings(prev => prev.map(l => l.id === id ? updated : l));
      toast.success(nextAvailable ? 'Listing is now live.' : 'Listing hidden from search.');
    } catch (err: any) {
      // 2. Rollback on failure
      setListings(prev => prev.map(l => l.id === id ? { ...l, is_available: prevAvailable } : l));
      toast.error(err?.response?.data?.message ?? 'Failed to update availability.');
    }
  };

  // ─── Publish draft ───────────────────────────────────────────────────────────
  const handlePublish = async (id: string) => {
    try {
      const updated = await publishListing(id);
      setListings(prev => prev.map(l => l.id === id ? updated : l));
      toast.success('Listing published! Renters can now find it.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to publish listing.');
    }
  };

  const isKycApproved = profile?.kycStatus === 'APPROVED';

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* KYC Warning Banner */}
      {!isKycApproved && (
        <div className="bg-amber-50 border-b border-amber-200 py-3 px-4">
          <div className="max-w-6xl mx-auto flex items-center gap-3 text-amber-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              Your KYC is pending verification. You can list items, but your listings won&apos;t be visible to renters until KYC is approved.
            </p>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#e5e7eb]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-[#111827]">
            <span className="w-8 h-8 bg-[#16a34a] rounded-lg flex items-center justify-center text-white text-sm font-black">G</span>
            GoRentals
          </Link>
          <Link
            href="/create-listing"
            className="px-4 py-2 bg-[#16a34a] text-white text-sm font-semibold rounded-lg hover:bg-[#15803d] transition-colors"
          >
            + Add Listing
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#111827]">
            {greeting}, {profile?.fullName?.split(' ')[0] ?? 'Owner'} 👋
          </h1>
          <p className="text-[#6b7280] text-sm mt-1">Here&apos;s your rental overview</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Package,     label: 'My Listings',   value: listings.length.toString(),        sub: 'total',    bg: 'bg-[#f0fdf4]', color: 'text-[#16a34a]' },
            { icon: Clock,       label: 'Active Rentals', value: activeBookings.length.toString(),  sub: 'ongoing',  bg: 'bg-blue-50',   color: 'text-blue-600' },
            { icon: IndianRupee, label: 'Total Earned',   value: formatCurrency(totalEarned),        sub: 'lifetime', bg: 'bg-[#f0fdf4]', color: 'text-[#16a34a]' },
            { icon: Star,        label: 'Pending',        value: pendingRequests.length.toString(),  sub: 'requests', bg: 'bg-amber-50',  color: 'text-amber-600', badge: pendingRequests.length > 0 },
          ].map(({ icon: Icon, label, value, sub, bg, color, badge }) => (
            <div key={label} className="bg-white rounded-2xl p-5 shadow-sm relative">
              {badge && <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full" />}
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-xs text-[#6b7280] mb-1">{label}</p>
              <p className="text-2xl font-bold text-[#111827]">{value}</p>
              <p className="text-xs text-[#9ca3af]">{sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#e5e7eb] mb-6">
          {(['listings', 'requests'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab
                  ? 'border-[#16a34a] text-[#16a34a]'
                  : 'border-transparent text-[#6b7280] hover:text-[#111827]'
              }`}
            >
              {tab === 'listings' ? 'My Listings' : 'Booking Requests'}
              {tab === 'requests' && pendingRequests.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded-full font-bold">
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
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-white rounded-xl shadow-sm animate-pulse" />
                ))}
              </div>
            ) : listingsError ? (
              /* Real error state — never silently empty */
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-red-100">
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-[#111827] mb-1">Could not load listings</h3>
                <p className="text-sm text-[#6b7280] mb-5">{listingsError}</p>
                <button
                  onClick={loadListings}
                  className="px-4 py-2 bg-[#111827] text-white text-sm font-semibold rounded-lg hover:bg-[#374151] transition-colors"
                >
                  Try again
                </button>
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
                <Package className="w-12 h-12 text-[#d1d5db] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#111827] mb-2">No listings yet</h3>
                <p className="text-[#6b7280] text-sm mb-6">Add your first item to start earning.</p>
                <Link
                  href="/create-listing"
                  className="px-5 py-2.5 bg-[#16a34a] text-white text-sm font-semibold rounded-lg hover:bg-[#15803d] transition-colors"
                >
                  + Add Listing
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Table header */}
                <div className="hidden md:grid grid-cols-12 px-5 py-3 border-b border-[#f3f4f6] text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                  <div className="col-span-1" />
                  <div className="col-span-4">Title</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-2">Price</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                <div className="divide-y divide-[#f9fafb]">
                  {listings.map(listing => {
                    const image = listing.listing_images?.[0]?.image_url;
                    return (
                      <div key={listing.id} className="grid grid-cols-1 md:grid-cols-12 items-center gap-3 px-5 py-4 hover:bg-[#f9fafb] transition-colors">
                        {/* Thumbnail */}
                        <div className="hidden md:block col-span-1">
                          <div className="w-12 h-10 rounded-lg bg-[#f3f4f6] overflow-hidden">
                            {image ? (
                              <img src={image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-4 h-4 text-[#d1d5db]" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Mobile view */}
                        <div className="md:hidden flex items-center gap-3">
                          <div className="w-14 h-12 rounded-lg bg-[#f3f4f6] overflow-hidden flex-shrink-0">
                            {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-[#d1d5db]" /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#111827] text-sm truncate">{listing.title}</p>
                            <p className="text-xs text-[#6b7280]">{listing.category} · {formatCurrency(listing.price_per_day)}</p>
                          </div>
                        </div>

                        {/* Desktop columns */}
                        <div className="hidden md:block col-span-4 font-medium text-[#111827] text-sm truncate">{listing.title}</div>
                        <div className="hidden md:block col-span-2 text-sm text-[#6b7280]">{listing.category}</div>
                        <div className="hidden md:block col-span-2 text-sm font-semibold text-[#111827]">{formatCurrency(listing.price_per_day)}</div>
                        <div className="hidden md:block col-span-1">
                          {listing.is_published ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-[#f0fdf4] text-[#16a34a] rounded-full uppercase tracking-tighter">Live</span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-600 rounded-full uppercase tracking-tighter">Draft</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 flex items-center justify-end gap-1.5">
                          {!listing.is_published && (
                            <button
                              onClick={() => handlePublish(listing.id)}
                              className="px-2.5 py-1.5 text-xs font-bold text-[#16a34a] hover:bg-[#f0fdf4] rounded transition-colors"
                            >
                              Publish
                            </button>
                          )}
                          <AvailabilityToggle
                            listingId={listing.id}
                            isAvailable={listing.is_available}
                            onToggle={handleToggleAvailability}
                          />
                          <Link
                            href={`/owner/listings/${listing.id}/edit`}
                            className="p-1.5 text-[#6b7280] hover:bg-[#f3f4f6] rounded transition-colors"
                            title="Edit listing"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/item/${listing.id}`}
                            className="p-1.5 text-[#6b7280] hover:bg-[#f3f4f6] rounded transition-colors"
                            title="View public page"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Requests Tab ──────────────────────────────────────────────────── */}
        {activeTab === 'requests' && (
          <section>
            {pendingRequests.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
                <Clock className="w-12 h-12 text-[#d1d5db] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#111827] mb-2">No pending requests</h3>
                <p className="text-[#6b7280] text-sm">New requests will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pendingRequests.map(booking => (
                  <div key={booking.id} className="bg-white rounded-2xl shadow-sm p-5 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#111827] mb-1">
                        <span className="text-[#16a34a]">{booking.listing?.title}</span>
                      </p>
                      <p className="text-sm text-[#6b7280]">
                        {formatDate(booking.checkInDate)} – {formatDate(booking.checkOutDate)}
                        &nbsp;·&nbsp;{formatCurrency(booking.totalAmount)}
                      </p>
                    </div>
                    <div className="flex gap-2 sm:flex-col sm:justify-center">
                      <button
                        onClick={() => handleAccept(booking.id)}
                        disabled={actionId === booking.id}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-[#16a34a] text-white text-sm font-semibold rounded-lg hover:bg-[#15803d] transition-colors disabled:opacity-50"
                      >
                        {actionId === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(booking.id)}
                        disabled={actionId === booking.id}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {actionId === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                        Reject
                      </button>
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
