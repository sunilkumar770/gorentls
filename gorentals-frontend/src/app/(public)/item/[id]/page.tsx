'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { cn, daysBetween } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { createBooking } from '@/services/bookings';
import { getListing } from '@/services/listings';
import { startOfDay, format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { MapPin, Shield, Calendar, Loader2, ChevronLeft, Package, Info, CheckCircle2, ShieldCheck, BadgeCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Listing, BlockedRange } from '@/types';
import { getAvailability } from '@/services/availability';
import { DateRange } from 'react-day-picker';
import BookingCalendar from '@/components/booking/BookingCalendar';
import { calcRentalQuote, formatINR } from '@/lib/pricing';
import { PriceBreakdown } from '@/components/bookings/PriceBreakdown';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

export default function ItemDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { user } = useAuth();
  const isAuthenticated = !!user;

  const [listing,       setListing]     = useState<Listing | null>(null);
  const [loading,       setLoading]     = useState(true);
  const [error,         setError]       = useState<string | null>(null);
  const [booking,       setBooking]     = useState(false);
  const [activeImg,     setActiveImg]   = useState(0);
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();

  useEffect(() => {
    Promise.all([
      getListing(id as string),
      getAvailability(id as string)
    ])
      .then(([listingData, availRes]) => {
        if (!listingData) {
          setError('This item could not be found in the system.');
        } else {
          setListing(listingData);
          // Dynamic page title
          document.title = `${listingData.title} — ₹${listingData.price_per_day}/day | GoRentals`;
          setBlockedRanges(availRes.blockedRanges);
        }
        setLoading(false);
      })
      .catch(() => { 
        setError('An error occurred while fetching item details.'); 
        setLoading(false); 
      });
  }, [id]);

  const startDate = selectedRange?.from ? format(selectedRange.from, 'yyyy-MM-dd') : '';
  const endDate   = selectedRange?.to ? format(selectedRange.to, 'yyyy-MM-dd') : '';
  const days    = selectedRange?.from && selectedRange?.to ? daysBetween(selectedRange.from, selectedRange.to) : 0;
  const deposit = listing?.security_deposit ?? 0;

  // Phase 1 live quote — for UI preview only; backend is authoritative
  const quote = calcRentalQuote(listing?.price_per_day ?? 0, days, deposit);

  const isOwnListing = !!user && listing?.owner_id === user.id;
  const canBook      =
    isAuthenticated && listing?.is_available && !isOwnListing && !!startDate && !!endDate && days >= 1;

  async function handleBookNow() {
    if (!canBook || !listing) return;
    setBooking(true);
    try {
      const b = await createBooking({
        listingId:       listing.id,
        startDate, endDate,
        totalDays:       days,
        rentalAmount:    quote.base,
        securityDeposit: quote.deposit,
        totalAmount:     quote.total,   // backend will recompute — this is informational
      });
      if (b && b.id) {
        router.push(`/checkout/${b.id}`);
      } else {
        throw new Error('Booking created but ID is missing');
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        toast.error('Selected dates are no longer available.');
      } else {
        toast.error(err?.response?.data?.message ?? 'Booking initialization failed. Please try again.');
      }
      setBooking(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-[var(--primary-light)] border-t-[var(--primary)] animate-spin" />
    </div>
  );

  if (error || !listing) return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--bg-subtle)] flex items-center justify-center mb-2">
        <Package className="w-8 h-8 text-[var(--text-faint)]" />
      </div>
      <p className="text-[var(--text)] font-semibold text-xl">{error ?? 'Item missing'}</p>
      <p className="text-[var(--text-muted)] max-w-sm">The item you are looking for may have been removed or is currently unavailable.</p>
      <Link href="/search" className="mt-4 px-6 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--r-md)] text-[var(--text)] font-medium hover:bg-[var(--bg-subtle)] transition-colors">
        Return to Directory
      </Link>
    </div>
  );

  const images = listing.listing_images ?? [];

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24">
      {/* Breadcrumb Layer */}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border)] sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3 text-sm text-[var(--text-muted)]">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="gap-1.5 font-medium -ml-2"
          >
            <ChevronLeft className="w-4 h-4" /> Go back
          </Button>
          <span className="text-[var(--border-strong)]">/</span>
          <Link href="/search" className="hover:text-[var(--primary)] transition-colors">Directory</Link>
          <span className="text-[var(--border-strong)]">/</span>
          <span className="text-[var(--text)] font-medium truncate max-w-[250px]">{listing.title}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left Column: Gallery & Details */}
          <div className="lg:col-span-7 space-y-10">
            {/* Gallery */}
            <div className="space-y-4">
              {/* Shimmer skeleton while loading or no images */}
              <div className={`rounded-[var(--r-xl)] overflow-hidden bg-[var(--bg-subtle)] aspect-[4/3] shadow-card relative ${
                images.length === 0 ? 'animate-pulse' : ''
              }`}>
                {images.length > 0 ? (
                  <img src={images[activeImg]?.image_url} alt={listing.title}
                       className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-faint)]">
                    <Package className="w-12 h-12 mb-3 opacity-30" />
                    <span className="text-sm font-medium">No imagery provided</span>
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                  {images.map((img, i) => (
                    <button key={img.id} onClick={() => setActiveImg(i)}
                            className={`w-20 h-20 flex-shrink-0 rounded-[var(--r-md)] overflow-hidden border-2 transition-all shadow-sm
                              ${i === activeImg ? 'border-[var(--primary)] ring-2 ring-[var(--primary-light)]' : 'border-transparent opacity-70 hover:opacity-100 hover:shadow-card'}`}>
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Header Info */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
                {listing.category && (
                  <span className="px-3 py-1 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text)] rounded-[var(--r-pill)]">
                    {listing.category}
                  </span>
                )}
                {listing.stores?.store_city && (
                  <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                    <MapPin className="w-4 h-4 text-[var(--primary)]" />
                    {listing.stores.store_city}
                  </span>
                )}
                {!listing.is_available && (
                  <span className="px-3 py-1 bg-[#fef2f2] text-[#991b1b] border border-[#fecaca] rounded-[var(--r-pill)] flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> Booked out
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-display font-bold text-[var(--text)] leading-tight tracking-tight">
                {listing.title}
              </h1>

              <div className="prose prose-p:text-[var(--text-muted)] prose-p:leading-relaxed max-w-none pt-4 border-t border-[var(--border)]">
                <p className="whitespace-pre-line">{listing.description}</p>
              </div>
            </div>

            {/* Trust Pillars */}
            <div className="grid grid-cols-2 gap-4 py-8 border-y border-[var(--border)]">
               <div className="flex gap-3">
                  <ShieldCheck className="w-6 h-6 text-[var(--primary)] flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-[var(--text)] text-sm mb-0.5">Renter Protection</h4>
                    <p className="text-xs text-[var(--text-muted)]">Verified condition on pickup.</p>
                  </div>
               </div>
               <div className="flex gap-3">
                  <BadgeCheck className="w-6 h-6 text-[var(--primary)] flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-[var(--text)] text-sm mb-0.5">Secure Transaction</h4>
                    <p className="text-xs text-[var(--text-muted)]">Payments held until fulfillment.</p>
                  </div>
               </div>
            </div>

            {/* Owner Profile Card */}
            <div className="bg-[var(--bg-card)] rounded-[var(--r-lg)] border border-[var(--border)] shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[var(--primary-light)] rounded-full flex items-center justify-center">
                  <span className="text-[var(--primary)] font-display font-bold text-xl">
                    {(listing.stores?.store_name ?? 'S').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Managed By</h3>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[var(--text)] text-lg">{listing.stores?.store_name || listing.owner?.fullName}</p>
                    {listing.owner?.kycStatus === 'APPROVED' && (
                      <VerifiedBadge size="md" />
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-faint)] flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)]" /> 
                    {listing.owner?.kycStatus === 'APPROVED' ? 'Verified Platform Partner' : 'Registered Partner'}
                  </p>
                </div>
              </div>
              
              {!isOwnListing && isAuthenticated && (
                <Button 
                  variant="secondary"
                  size="md"
                  onClick={async () => {
                    import('@/services/messages').then(async ({ startConversation }) => {
                      const toast = (await import('react-hot-toast')).toast;
                      try {
                        const conv = await startConversation(listing.id, "Hi, I'm interested in renting this item.");
                        router.push(`/messages/${conv.id}`);
                      } catch (err) {
                        toast.error('Failed to open channel. It may already exist.');
                        router.push('/messages');
                      }
                    });
                  }}
                  className="whitespace-nowrap"
                >
                  Message Owner
                </Button>
              )}
            </div>
          </div>

          {/* Right Column: Interaction & Booking Widget */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 bg-[var(--bg-card)] rounded-[var(--r-xl)] border border-[var(--border-strong)] shadow-card-hover p-8">
              
              {/* Pricing Header */}
              <div className="mb-6 flex flex-col gap-1 pb-6 border-b border-[var(--border)]">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-display font-bold text-[var(--text)] tracking-tight">
                    ₹{(listing.price_per_day ?? 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[var(--text-muted)] font-medium">/ day</span>
                </div>
                {deposit > 0 && (
                  <p className="text-sm text-[var(--text-faint)] flex items-center gap-1.5 mt-1">
                     <Shield className="w-4 h-4 text-[var(--primary)]" /> 
                     ₹{deposit.toLocaleString('en-IN')} refundable deposit
                  </p>
                )}
              </div>

              {/* Date Selection */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-3 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Specify Duration
                </label>
                <div className="rounded-[var(--r-md)] bg-[var(--bg)] border border-[var(--border)] p-4 shadow-inner">
                  <BookingCalendar
                    blockedRanges={blockedRanges}
                    selectedRange={selectedRange}
                    onSelect={setSelectedRange}
                    disabled={booking}
                  />
                </div>
              </div>

              {/* Live Quotation — Phase 1 pricing breakdown */}
              {days > 0 && (
                <div className="mb-6">
                  <PriceBreakdown lines={quote.breakdown} showNotice />
                </div>
              )}

              {/* Action State Machine */}
              {!isAuthenticated ? (
                <Button 
                  variant="gradient" 
                  size="lg" 
                  className="w-full"
                  asChild
                >
                  <Link href={`/login?redirect=/item/${listing.id}`}>
                    Sign In to Request
                  </Link>
                </Button>
              ) : isOwnListing ? (
                <div className="w-full h-14 bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text-muted)] rounded-[var(--r-md)]
                                flex items-center justify-center font-semibold cursor-not-allowed">
                  This is your listing
                </div>
              ) : !listing.is_available ? (
                <div className="w-full h-14 bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] rounded-[var(--r-md)]
                                flex items-center justify-center font-semibold cursor-not-allowed">
                  Inventory Unavailable
                </div>
              ) : (
                <Button 
                  variant="gradient" 
                  size="lg" 
                  className="w-full h-14"
                  onClick={handleBookNow} 
                  disabled={!canBook || booking}
                  loading={booking}
                >
                  {days > 0 ? `Reserve for ${formatINR(quote.total)}` : 'Choose Dates'}
                </Button>
              )}

              {isAuthenticated && listing.is_available && !isOwnListing && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-faint)] font-medium">
                    <ShieldCheck className="w-4 h-4" /> Transactions secured by Razorpay
                  </div>
                  {days > 0 && (
                    <p className="text-center text-[11px] text-[var(--text-faint)] leading-relaxed">
                      Only <span className="font-semibold text-[var(--primary)]">30% advance</span> charged at booking —
                      remaining balance due on pickup.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
