"use client";

import { useState, useEffect } from 'react';
import { useOwnerBookings } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import { Package, IndianRupee, Clock, CheckCircle, XCircle, Loader2, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { acceptBooking, rejectBooking } from '@/services/bookings';
import { getOwnerListings } from '@/services/listings';
import type { Listing } from '@/types';
import { toast } from 'react-hot-toast';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#f9fafb] pt-4 pb-16 animate-pulse">
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <div className="h-10 w-1/3 bg-gray-200 rounded-lg mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white rounded-2xl shadow-sm" />)}
        </div>
        <div className="h-6 w-1/4 bg-gray-200 rounded mb-4" />
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-xl shadow-sm" />)}
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function OwnerDashboardPage() {
  const { user, profile } = useAuth();
  const { bookings, loading, refetch } = useOwnerBookings(user?.id);
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'listings' | 'requests'>('listings');

  useEffect(() => {
    if (user?.id) {
      getOwnerListings(user.id)
        .then(setListings)
        .catch(() => setListings([]))
        .finally(() => setListingsLoading(false));
    }
  }, [user?.id]);

  if (loading) return <DashboardSkeleton />;

  const activeBookings = bookings.filter(b => b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS');
  const pendingRequests = bookings.filter(b => b.status === 'PENDING');
  const totalEarned = bookings
    .filter(b => b.paymentStatus === 'COMPLETED')
    .reduce((sum, b) => sum + b.rentalCost, 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const handleAccept = async (id: string) => {
    setActionId(id);
    try {
      await acceptBooking(id);
      toast.success('Booking accepted!');
      refetch?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to accept booking.');
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
      toast.error(err?.response?.data?.message || 'Failed to reject booking.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#e5e7eb]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-[#111827]">
            <span className="w-8 h-8 bg-[#16a34a] rounded-lg flex items-center justify-center text-white text-sm font-black">G</span>
            GoRentals
          </Link>
          <Link
            href="/create-listing"
            className="px-4 py-2 bg-[#16a34a] text-white text-sm font-semibold rounded-lg hover:bg-[#15803d] transition-colors flex items-center gap-1.5"
          >
            + Add Listing
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">

        {/* ── Header ── */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#111827]">
              {greeting}, {profile?.fullName?.split(' ')[0] || 'Owner'} 👋
            </h1>
            <p className="text-[#6b7280] text-sm mt-1">Here&apos;s your rental overview</p>
          </div>
          <Link
            href="/create-listing"
            className="hidden sm:inline-flex px-4 py-2 bg-[#16a34a] text-white text-sm font-semibold rounded-lg hover:bg-[#15803d] transition-colors items-center gap-1.5"
          >
            + Add Listing
          </Link>
        </div>

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Package, label: 'My Listings', value: listings.length.toString(), sub: 'total', iconBg: 'bg-[#f0fdf4]', iconColor: 'text-[#16a34a]' },
            { icon: Clock, label: 'Active Rentals', value: activeBookings.length.toString(), sub: 'ongoing', iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
            { icon: IndianRupee, label: 'Total Earned', value: formatCurrency(totalEarned).replace('₹',''), sub: 'rupees', prefix: '₹', iconBg: 'bg-[#f0fdf4]', iconColor: 'text-[#16a34a]' },
            { icon: Star, label: 'Pending', value: pendingRequests.length.toString(), sub: 'requests', iconBg: 'bg-amber-50', iconColor: 'text-amber-600', badge: pendingRequests.length > 0 },
          ].map(({ icon: Icon, label, value, sub, iconBg, iconColor, prefix, badge }) => (
            <div key={label} className="bg-white rounded-2xl p-5 shadow-sm relative">
              {badge && (
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full" />
              )}
              <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <p className="text-xs text-[#6b7280] mb-1">{label}</p>
              <p className="text-2xl font-bold text-[#111827]">{prefix}{value}</p>
              <p className="text-xs text-[#9ca3af]">{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-[#e5e7eb] mb-6">
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'listings'
                ? 'border-[#16a34a] text-[#16a34a]'
                : 'border-transparent text-[#6b7280] hover:text-[#111827]'
            }`}
          >
            My Listings
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'border-[#16a34a] text-[#16a34a]'
                : 'border-transparent text-[#6b7280] hover:text-[#111827]'
            }`}
          >
            Booking Requests
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded-full font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* ── My Listings Tab ── */}
        {activeTab === 'listings' && (
          <section>
            {listingsLoading ? (
              <div className="flex flex-col gap-3">
                {[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-xl shadow-sm animate-pulse" />)}
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
                  <div className="col-span-5">Title</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-2">Price</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-1 text-right">Actions</div>
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
                        {/* Mobile: compact layout */}
                        <div className="md:hidden flex items-center gap-3">
                          <div className="w-14 h-12 rounded-lg bg-[#f3f4f6] overflow-hidden flex-shrink-0">
                            {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-[#d1d5db]" /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#111827] text-sm truncate">{listing.title}</p>
                            <p className="text-xs text-[#6b7280]">{listing.category} · {formatCurrency(listing.price_per_day)}/day</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${listing.is_published ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-amber-50 text-amber-700'}`}>
                              {listing.is_published ? '● Published' : '○ Draft'}
                            </span>
                          </div>
                        </div>
                        {/* Desktop columns */}
                        <div className="hidden md:block col-span-5 font-medium text-[#111827] text-sm truncate">{listing.title}</div>
                        <div className="hidden md:block col-span-2 text-sm text-[#6b7280]">{listing.category}</div>
                        <div className="hidden md:block col-span-2 text-sm font-semibold text-[#111827]">{formatCurrency(listing.price_per_day)}/day</div>
                        <div className="hidden md:block col-span-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${listing.is_published ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-amber-50 text-amber-700'}`}>
                            {listing.is_published ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        <div className="hidden md:flex col-span-1 justify-end gap-2">
                          <Link href={`/item/${listing.id}`} className="p-1.5 rounded hover:bg-[#f3f4f6]">
                            <ArrowRight className="w-4 h-4 text-[#6b7280]" />
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

        {/* ── Booking Requests Tab ── */}
        {activeTab === 'requests' && (
          <section>
            {loading ? (
              <div className="flex flex-col gap-4">
                {[1,2].map(i => <div key={i} className="h-32 bg-white rounded-xl shadow-sm animate-pulse" />)}
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
                <Clock className="w-12 h-12 text-[#d1d5db] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#111827] mb-2">No pending requests</h3>
                <p className="text-[#6b7280] text-sm">You&apos;re all caught up! New requests will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pendingRequests.map(booking => (
                  <div key={booking.id} className="bg-white rounded-2xl shadow-sm p-5 flex flex-col sm:flex-row gap-4">
                    {/* Booking info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-[#f0fdf4] rounded-full flex items-center justify-center text-sm">
                          👤
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#111827]">
                        wants to rent&nbsp;
                        <span className="text-[#16a34a]">{booking.listing?.title || 'your item'}</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-[#6b7280]">
                    {formatDate(booking.checkInDate)} – {formatDate(booking.checkOutDate)}
                    &nbsp;·&nbsp;{formatCurrency(booking.totalAmount)}
                  </p>
                    </div>
                    {/* Action buttons */}
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
