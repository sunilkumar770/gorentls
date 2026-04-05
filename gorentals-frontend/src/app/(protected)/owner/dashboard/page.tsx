"use client";

import { useOwnerBookings } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import { Package, IndianRupee, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function OwnerDashboardPage() {
  const { user, profile } = useAuth();
  const { bookings, loading } = useOwnerBookings(user?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff8f6] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
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

  return (
    <div className="min-h-screen bg-[#fff8f6] pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Editorial Header */}
        <div className="mb-16 border-b border-[#251913]/5 pb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h1 className="text-6xl md:text-8xl font-display font-black tracking-tighter text-[#251913] leading-[0.8] mb-4">
              Control<span className="text-[#f97316]">.</span>
            </h1>
            <p className="text-xl text-[#8c7164] font-medium tracking-tight">
              Welcome back, <span className="text-[#251913] font-black">{profile?.full_name || 'Owner'}</span>. Your inventory overview.
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/create-listing">
              <button className="gradient-signature px-8 py-4 text-white rounded-full font-display font-black shadow-ambient transition-transform hover:-translate-y-1">
                + Add Artifact
              </button>
            </Link>
          </div>
        </div>

        {/* Top KPI Cards */}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Pending Section */}
          <section>
             <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-display font-black text-[#251913] uppercase tracking-tighter">Action Required</h2>
               <div className="h-px flex-1 bg-[#251913]/5 mx-6" />
             </div>
             <div className="space-y-6">
                {pendingRequests.length === 0 ? (
                  <div className="bg-white rounded-[2rem] p-12 text-center shadow-ambient ring-1 ring-[#f97316]/5">
                     <p className="text-[#8c7164] font-medium">No pending requests at the moment.</p>
                  </div>
                ) : (
                  pendingRequests.map(booking => (
                    <div key={booking.id} className="bg-white rounded-[2rem] p-8 shadow-ambient ring-1 ring-[#f97316]/5 group transition-all hover:-translate-y-1">
                      <div className="flex justify-between items-start gap-4 flex-wrap">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#f97316] mb-1">Incoming Request</p>
                          <h4 className="text-2xl font-display font-black text-[#251913] mb-2">{booking.listings?.title || 'Unknown Artifact'}</h4>
                          <p className="text-sm font-bold tracking-wider text-[#8c7164] uppercase flex items-center gap-2 mb-2">
                             <Clock className="w-3 h-3 text-[#f97316]" />
                             {formatDate(booking.check_in_date)} — {formatDate(booking.check_out_date)}
                          </p>
                          <p className="text-xl font-black text-[#251913]">{formatCurrency(booking.total_amount)}</p>
                        </div>
                        <div className="flex gap-3">
                          <button className="px-6 py-3 bg-[#ecfdf5] text-[#065f46] hover:bg-[#d1fae5] rounded-[1rem] font-bold text-xs uppercase tracking-widest transition-colors">
                            Accept
                          </button>
                          <button className="px-6 py-3 bg-[#fef2f2] text-[#991b1b] hover:bg-[#fee2e2] rounded-[1rem] font-bold text-xs uppercase tracking-widest transition-colors">
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
             </div>
          </section>

          {/* Active Section */}
          <section>
             <div className="flex items-center justify-between mb-8">
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
                    <div key={booking.id} className="bg-white rounded-[2rem] p-8 shadow-ambient ring-1 ring-[#f97316]/5 flex justify-between items-center group transition-all hover:shadow-[0_24px_48px_rgba(37,25,19,0.08)] hover:-translate-y-1">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#10b981] mb-1">In Field</p>
                        <h4 className="text-xl font-display font-black text-[#251913]">{booking.listings?.title || 'Unknown Artifact'}</h4>
                        <p className="text-xs font-bold text-[#8c7164] uppercase tracking-widest mt-2 flex items-center gap-2">
                          <Package className="w-3 h-3" />
                          {formatDate(booking.check_in_date)} — {formatDate(booking.check_out_date)}
                        </p>
                      </div>
                      <Link href={`/bookings/${booking.id}`} className="w-12 h-12 bg-[#fff8f6] rounded-full flex items-center justify-center text-[#f97316] group-hover:bg-[#f97316] group-hover:text-white transition-colors">
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  ))
                )}
             </div>
          </section>
        </div>

      </div>
    </div>
  );
}
