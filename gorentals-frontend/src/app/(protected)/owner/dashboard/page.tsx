"use client";

import { useState } from 'react';
import { useOwnerBookings } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import { Package, IndianRupee, Clock, ArrowRight, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { acceptBooking, rejectBooking } from '@/services/bookings';
import { getOwnerListings } from '@/services/listings';
import { useEffect } from 'react';
import type { Listing } from '@/types';
import { toast } from 'react-hot-toast';

export default function OwnerDashboardPage() {
  const { user, profile } = useAuth();
  const { bookings, loading, refetch } = useOwnerBookings(user?.id);
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      getOwnerListings(user.id)
        .then(setListings)
        .catch(() => setListings([]))
        .finally(() => setListingsLoading(false));
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff8f6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#f97316]/20 border-t-[#f97316] animate-spin" />
          <span className="text-xs font-black uppercase tracking-widest text-[#8c7164]">Retrieving Archives...</span>
        </div>
      </div>
    );
  }

  const activeBookings = bookings.filter(b => b.booking_status === 'confirmed');
  const pendingRequests = bookings.filter(b => b.booking_status === 'pending_confirmation');
  const totalEarned = bookings
    .filter(b => b.payment_status === 'completed')
    .reduce((sum, b) => sum + b.rental_cost, 0);

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
    <div className="min-h-screen bg-[#fff8f6] pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

        {/* Header */}
        <div className="mb-16 border-b border-[#251913]/5 pb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h1 className="text-6xl md:text-8xl font-display font-black tracking-tighter text-[#251913] leading-[0.8] mb-4">
              Control<span className="text-[#f97316]">.</span>
            </h1>
            <p className="text-xl text-[#8c7164] font-medium tracking-tight">
              Welcome back, <span className="text-[#251913] font-black">{profile?.fullName || 'Owner'}</span>. Your inventory overview.
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/owner/listings/create">
              <button className="gradient-signature px-8 py-4 text-white rounded-full font-display font-black shadow-ambient transition-transform hover:-translate-y-1">
                + Add Artifact
              </button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white p-8 rounded-[2rem] shadow-ambient ring-1 ring-[#f97316]/5 border-l-4 border-l-[#f97316]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#8c7164] mb-2">Total Revenue</p>
                <h3 className="text-4xl font-display font-black text-[#251913]">{formatCurrency(totalEarned)}</h3>
              </div>
              <div className="p-3 bg-[#fff8f6] rounded-[1rem]">
                <IndianRupee className="w-5 h-5 text-[#f97316]" />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-ambient ring-1 ring-[#f97316]/5 border-l-4 border-l-[#be185d]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#8c7164] mb-2">Active Deployments</p>
                <h3 className="text-4xl font-display font-black text-[#251913]">{activeBookings.length}</h3>
              </div>
              <div className="p-3 bg-[#fdf2f8] rounded-[1rem]">
                <Package className="w-5 h-5 text-[#be185d]" />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-ambient ring-1 ring-[#f97316]/5 border-l-4 border-l-[#3b82f6]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#8c7164] mb-2">Pending Requests</p>
                <h3 className="text-4xl font-display font-black text-[#251913]">{pendingRequests.length}</h3>
              </div>
              <div className="p-3 bg-[#eff6ff] rounded-[1rem]">
                <Clock className="w-5 h-5 text-[#3b82f6]" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Pending Requests */}
          <section>
            <div className="flex items-center mb-8">
              <h2 className="text-2xl font-display font-black text-[#251913] uppercase tracking-tighter">Action Required</h2>
              <div className="h-px flex-1 bg-[#251913]/5 mx-6" />
              {pendingRequests.length > 0 && (
                <span className="w-6 h-6 rounded-full bg-[#f97316] text-white text-xs font-black flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </div>
            <div className="space-y-6">
              {pendingRequests.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-12 text-center shadow-ambient ring-1 ring-[#f97316]/5">
                  <p className="text-[#8c7164] font-medium">No pending requests at the moment.</p>
                </div>
              ) : (
                pendingRequests.map(booking => (
                  <div key={booking.id} className="bg-white rounded-[2rem] p-8 shadow-ambient ring-1 ring-[#f97316]/5">
                    <div className="flex justify-between items-start gap-4 flex-wrap mb-6">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#f97316] mb-1">Incoming Request</p>
                        <h4 className="text-xl font-display font-black text-[#251913] mb-1">{booking.listings?.title || 'Unknown Artifact'}</h4>
                        <p className="text-xs font-bold tracking-wider text-[#8c7164] uppercase flex items-center gap-2">
                          <Clock className="w-3 h-3 text-[#f97316]" />
                          {formatDate(booking.check_in_date)} — {formatDate(booking.check_out_date)}
                        </p>
                        <p className="text-xl font-black text-[#251913] mt-2">{formatCurrency(booking.total_amount)}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAccept(booking.id)}
                        disabled={actionId === booking.id}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#ecfdf5] text-[#065f46] hover:bg-[#d1fae5] rounded-[1rem] font-bold text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
                      >
                        {actionId === booking.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(booking.id)}
                        disabled={actionId === booking.id}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#fef2f2] text-[#991b1b] hover:bg-[#fee2e2] rounded-[1rem] font-bold text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
                      >
                        {actionId === booking.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Active Deployments */}
          <section>
            <div className="flex items-center mb-8">
              <h2 className="text-2xl font-display font-black text-[#251913] uppercase tracking-tighter">Active Deployments</h2>
              <div className="h-px flex-1 bg-[#251913]/5 mx-6" />
            </div>
            <div className="space-y-6">
              {activeBookings.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-12 text-center shadow-ambient ring-1 ring-[#f97316]/5">
                  <p className="text-[#8c7164] font-medium">No active artifacts deployed.</p>
                </div>
              ) : (
                activeBookings.map(booking => (
                  <div key={booking.id} className="bg-white rounded-[2rem] p-8 shadow-ambient ring-1 ring-[#f97316]/5 flex justify-between items-center group transition-all hover:-translate-y-1">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#10b981] mb-1">In Field</p>
                      <h4 className="text-xl font-display font-black text-[#251913]">{booking.listings?.title || 'Unknown Artifact'}</h4>
                      <p className="text-xs font-bold text-[#8c7164] uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Package className="w-3 h-3" />
                        {formatDate(booking.check_in_date)} — {formatDate(booking.check_out_date)}
                      </p>
                    </div>
                    <Link href={`/item/${booking.listing_id}`} className="w-12 h-12 bg-[#fff8f6] rounded-full flex items-center justify-center text-[#f97316] group-hover:bg-[#f97316] group-hover:text-white transition-colors">
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* My Listings */}
        <section>
          <div className="flex items-center mb-8">
            <h2 className="text-2xl font-display font-black text-[#251913] uppercase tracking-tighter">My Listings</h2>
            <div className="h-px flex-1 bg-[#251913]/5 mx-6" />
            <Link href="/owner/listings/create" className="text-xs font-black uppercase tracking-widest text-[#f97316] hover:underline">
              + Add New
            </Link>
          </div>

          {listingsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-[2rem] animate-pulse" />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-16 text-center shadow-ambient ring-1 ring-[#f97316]/5">
              <Package className="h-12 w-12 text-[#f97316]/20 mx-auto mb-4" />
              <h3 className="text-2xl font-display font-black text-[#251913] mb-2">No Artifacts Listed</h3>
              <p className="text-[#8c7164] font-medium mb-6">Start building your catalogue by adding your first item.</p>
              <Link href="/owner/listings/create">
                <button className="gradient-signature px-8 py-4 text-white rounded-full font-display font-black shadow-ambient hover:-translate-y-1 transition-transform">
                  List First Artifact
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {listings.map(listing => (
                <div key={listing.id} className="bg-white rounded-[2rem] p-6 shadow-ambient ring-1 ring-[#f97316]/5 group transition-all hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#f97316] mb-1">{listing.category}</p>
                      <h4 className="text-lg font-display font-black text-[#251913] leading-tight">{listing.title}</h4>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${listing.is_published ? 'bg-[#ecfdf5] text-[#065f46]' : 'bg-[#fffbeb] text-[#92400e]'}`}>
                      {listing.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-2xl font-display font-black text-[#251913] mb-4">{formatCurrency(listing.price_per_day)}<span className="text-xs text-[#8c7164] font-bold">/day</span></p>
                  <div className="flex gap-3">
                    <Link href={`/item/${listing.id}`} className="flex-1 text-center py-2 bg-[#fff8f6] rounded-[0.75rem] text-xs font-black uppercase tracking-widest text-[#251913] hover:bg-[#ffeae0] transition-colors">
                      View
                    </Link>
                    <Link href={`/owner/listings/create?edit=${listing.id}`} className="flex-1 text-center py-2 bg-[#fff8f6] rounded-[0.75rem] text-xs font-black uppercase tracking-widest text-[#251913] hover:bg-[#ffeae0] transition-colors">
                      Edit
                    </Link>
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
