'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChevronLeft, 
  ShieldCheck, 
  MapPin, 
  CheckCircle2, 
  Info, 
  ArrowRight,
  Lock,
  Calendar,
  AlertCircle,
  Loader2,
  Zap
} from 'lucide-react';
import { getListing } from '@/services/listings';
import { createBooking } from '@/services/bookings';
import type { Listing } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'react-hot-toast';

function CheckoutContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const itemId   = params.get('item');
  const startStr = params.get('start');
  const endStr   = params.get('end');

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'review' | 'confirmed'>('review');
  const [bookingId, setBookingId] = useState<string | null>(null);
  
  const submittingRef = useRef(false);

  // Parse dates
  const startDate = startStr ? new Date(startStr) : null;
  const endDate   = endStr   ? new Date(endStr)   : null;
  const days = startDate && endDate
    ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000))
    : 0;

  useEffect(() => {
    if (!user && !isLoading) {
      const returnUrl = encodeURIComponent(`/checkout?item=${itemId}&start=${startStr}&end=${endStr}`);
      router.push(`/login?redirect=${returnUrl}`);
    }
  }, [user, isLoading, itemId, startStr, endStr, router]);

  useEffect(() => {
    if (!itemId) { 
      setError('Invalid booking parameters');
      setIsLoading(false); 
      return; 
    }

    async function fetchListing() {
      try {
        setIsLoading(true);
        const data = await getListing(itemId as string);
        if (data) {
          setListing(data);
        } else {
          setError('Listing not found');
        }
      } catch (err) {
        console.error('Failed to fetch listing:', err);
        setError('Connection error while fetching gear details');
      } finally {
        setIsLoading(false);
      }
    }
    fetchListing();
  }, [itemId]);

  if (!itemId || !startStr || !endStr) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-4 bg-subtle">
        <div className="w-24 h-24 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 shadow-sm">
          <AlertCircle className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-text tracking-tight">Broken booking link</h2>
          <p className="text-muted font-medium max-w-xs mx-auto">Please select your rental dates again from the listing page to continue.</p>
        </div>
        <Link href="/search" className="bg-indigo-600 text-white font-bold px-10 py-4 rounded-2xl hover:bg-indigo-700 transition-all active:scale-95 text-sm shadow-xl shadow-indigo-100">
          Browse marketplace
        </Link>
      </div>
    );
  }

  if (isLoading) return <CheckoutSkeleton />;

  if (error || !listing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-4 bg-subtle">
        <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 shadow-sm">
          <AlertCircle className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-text tracking-tight">{error || 'Gear not found'}</h2>
          <p className="text-muted font-medium max-w-xs mx-auto">The item you are trying to book is no longer available or there was a network error.</p>
        </div>
        <Link href="/search" className="bg-indigo-600 text-white font-bold px-10 py-4 rounded-2xl hover:bg-indigo-700 transition-all active:scale-95 text-sm shadow-xl shadow-indigo-100">
          Back to marketplace
        </Link>
      </div>
    );
  }

  const rentalCost   = (listing.price_per_day || 0) * days;
  const platformFee  = Math.round(rentalCost * 0.1); // Using 10% for service fee consistency
  const deposit      = listing.security_deposit || 0;
  const totalToday   = rentalCost + platformFee + deposit;

  const handleBookingSubmit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setError(null);
    
    try {
      const booking = await createBooking({
        listingId: itemId,
        startDate: startStr,
        endDate: endStr,
        totalDays: days,
        rentalAmount: rentalCost,
        securityDeposit: deposit,
        totalAmount: totalToday,
      });
      
      setBookingId(booking.id);
      setStep('confirmed');
      toast.success('Booking confirmed successfully!');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Booking failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  if (step === 'confirmed' && bookingId) {
    return <BookingConfirmed bookingId={bookingId} itemName={listing.title} />;
  }

  return (
    <div className="min-h-screen bg-subtle pb-24">
      {/* Navigation Header */}
      <div className="bg-card/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link href={`/listings/${itemId}`} className="flex items-center gap-2 text-muted hover:text-indigo-600 transition-colors group font-bold text-xs uppercase tracking-widest">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Gear Details</span>
          </Link>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-indigo-100">1</div>
              <span className="text-[10px] font-black text-text uppercase tracking-widest">Review</span>
            </div>
            <div className="w-12 h-px bg-slate-200" />
            <div className="flex items-center gap-2 opacity-40">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-muted text-[10px] font-black flex items-center justify-center">2</div>
              <span className="text-[10px] font-black text-muted uppercase tracking-widest">Done</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Main Content */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-text tracking-tight">Review & Reserve</h1>
              <p className="text-sm font-medium text-muted">Secured by GoRentals Trusted Escrow System.</p>
            </div>

            {/* Item Card */}
            <div className="bg-card rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100">
              <div className="p-8 flex flex-col sm:flex-row gap-8">
                <div className="w-full sm:w-32 h-32 rounded-3xl overflow-hidden bg-slate-100 flex-shrink-0 relative shadow-inner">
                  <Image 
                    src={listing.listing_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80'} 
                    alt={listing.title} 
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-text leading-tight tracking-tight">{listing.title}</h2>
                    <div className="flex items-center gap-1.5 text-muted text-sm mt-2 font-medium">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      <span>{listing.stores?.store_city || 'Location shared on pickup'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 py-4 border-t border-slate-100">
                    <div className="w-9 h-9 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm">
                      {listing.stores?.store_name?.[0] || 'O'}
                    </div>
                    <div>
                      <p className="text-[10px] text-faint uppercase tracking-[0.15em] font-black">Provided by</p>
                      <p className="text-sm font-bold text-text flex items-center gap-1.5">
                        {listing.stores?.store_name || 'Verified Owner'}
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates Grid */}
              <div className="grid grid-cols-2 border-t border-slate-100 bg-subtle/30">
                <div className="p-8 border-r border-slate-100">
                  <p className="text-[10px] font-black text-faint uppercase tracking-widest mb-2">Pick up gear</p>
                  <p className="text-lg font-bold text-text">
                    {startDate?.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <div className="p-8">
                  <p className="text-[10px] font-black text-faint uppercase tracking-widest mb-2">Return gear</p>
                  <p className="text-lg font-bold text-text">
                    {endDate?.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Escrow/Trust Card */}
            <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10 flex items-start gap-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-lg border border-white/20 shadow-xl">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h4 className="font-black text-xl tracking-tight">Active Protection Enabled</h4>
                  <p className="text-sm text-indigo-50 leading-relaxed mt-2 font-medium opacity-90">
                    Your payment is held in a secure escrow. Funds are only released to the owner after you pick up and verify the gear. Complete 100% money-back guarantee if the item is not as described.
                  </p>
                </div>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="bg-card rounded-[2.5rem] border border-slate-100 p-10 shadow-sm">
              <h3 className="text-xl font-bold text-text mb-8 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                </div>
                Fair Cancellation Policy
              </h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <p className="text-sm text-muted font-medium">
                    <strong className="text-text">Full refund</strong> if cancelled more than 24 hours before pickup time.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                    <Info className="w-4 h-4" />
                  </div>
                  <p className="text-sm text-muted font-medium">
                    <strong className="text-text">50% refund</strong> if cancelled within 24 hours of pickup.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / Price Sticky */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 space-y-6">
              <div className="bg-card rounded-[3rem] p-10 shadow-[0_32px_64px_rgba(0,0,0,0.06)] border border-slate-100">
                <h3 className="text-2xl font-bold text-text mb-10 tracking-tight">Booking Summary</h3>
                
                <div className="space-y-6">
                  <div className="flex justify-between text-muted font-bold text-sm uppercase tracking-wider">
                    <span>Rental ({days} days)</span>
                    <span className="text-text">{formatCurrency(rentalCost)}</span>
                  </div>
                  <div className="flex justify-between text-muted font-bold text-sm uppercase tracking-wider">
                    <span>Service Fee (10%)</span>
                    <span className="text-text">{formatCurrency(platformFee)}</span>
                  </div>
                  <div className="flex justify-between text-indigo-600 font-black text-sm uppercase tracking-wider bg-indigo-50 p-5 rounded-2xl border border-indigo-100 shadow-inner">
                    <span className="flex items-center gap-1.5">
                      Refundable Deposit
                      <Info className="w-3.5 h-3.5 opacity-50" />
                    </span>
                    <span>{formatCurrency(deposit)}</span>
                  </div>
                  
                  <div className="pt-10 mt-6 border-t border-slate-100">
                    <div className="mb-8">
                      <p className="text-[10px] font-black text-faint uppercase tracking-[0.2em] mb-2">Total amount due</p>
                      <p className="text-5xl font-black text-text tracking-tighter">{formatCurrency(totalToday)}</p>
                    </div>

                    {error && (
                      <div className="mb-8 p-5 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-red-700 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {error}
                      </div>
                    )}
                    
                    <button 
                      onClick={handleBookingSubmit}
                      disabled={isSubmitting}
                      className="w-full h-20 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-3xl font-black text-xl transition-all flex items-center justify-center gap-3 shadow-2xl shadow-indigo-100 active:scale-95 group"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Reserve Now
                          <Zap className="w-5 h-5 group-hover:scale-125 transition-transform fill-white" />
                        </>
                      )}
                    </button>
                    <p className="text-center text-[10px] text-faint uppercase tracking-[0.25em] font-black mt-8">
                      Payment secured via <span className="text-text font-black">Razorpay</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Secure Transaction Info */}
              <div className="flex items-center justify-center gap-2 text-[10px] font-black text-faint uppercase tracking-[0.2em]">
                <Lock className="w-3 h-3" />
                Military-grade SSL Encryption
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-card/90 backdrop-blur-xl border-t border-slate-100 p-6 z-50 shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto flex items-center justify-between gap-6">
          <div>
            <p className="text-[10px] font-black text-faint uppercase tracking-widest mb-1">Total</p>
            <p className="text-3xl font-black text-text">{formatCurrency(totalToday)}</p>
          </div>
          <button 
            onClick={handleBookingSubmit}
            disabled={isSubmitting}
            className="flex-1 h-16 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-2xl font-black text-base shadow-xl active:scale-95"
          >
            {isSubmitting ? 'Confirming...' : 'Reserve'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingConfirmed({ bookingId, itemName }: { bookingId: string, itemName: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 gap-10 py-20 bg-subtle">
      <div className="relative">
        <div className="w-36 h-36 rounded-full bg-green-50 flex items-center justify-center text-7xl animate-bounce duration-1000 shadow-inner">
          ✨
        </div>
        <div className="absolute inset-0 rounded-full border-8 border-green-500/10 animate-ping duration-[2000ms]" />
      </div>
      
      <div className="space-y-4 max-w-xl">
        <h2 className="text-5xl font-black text-text tracking-tighter">Reservation Sent!</h2>
        <p className="text-muted text-xl leading-relaxed font-medium">
          Your request for <strong className="text-indigo-600">{itemName}</strong> is on its way. The owner has 24 hours to confirm.
        </p>
      </div>

      <div className="bg-card rounded-[2.5rem] p-10 max-w-md shadow-xl border border-slate-100">
        <div className="flex gap-4 text-left">
          <ShieldCheck className="w-8 h-8 text-indigo-500 shrink-0" />
          <p className="text-sm text-text font-bold leading-relaxed">
            Payment Protection: <span className="font-medium text-muted">Your funds are safe in escrow. You will not be charged if the owner declines.</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-5 w-full max-w-md">
        <Link
          href={`/dashboard/bookings/${bookingId}`}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black h-18 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-100 transition-all active:scale-95 text-lg"
        >
          Order Status
        </Link>
        <Link
          href="/search"
          className="flex-1 bg-white border border-slate-100 text-muted font-black h-18 rounded-3xl flex items-center justify-center transition-all hover:bg-slate-50 active:scale-95 text-lg"
        >
          Keep Browsing
        </Link>
      </div>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-subtle pb-20 animate-pulse">
      <div className="h-20 bg-card border-b border-slate-100" />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-10">
            <div className="h-12 bg-slate-200 rounded-2xl w-64" />
            <div className="h-80 bg-card rounded-[3rem]" />
            <div className="h-48 bg-indigo-100 rounded-[3rem]" />
          </div>
          <div className="lg:col-span-5">
            <div className="h-[600px] bg-card rounded-[3rem]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutContent />
    </Suspense>
  );
}
