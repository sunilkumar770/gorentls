'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ChevronLeft, Calendar, Info, ShieldCheck, MapPin, CheckCircle2, Truck, Zap, Loader2 } from 'lucide-react';
import { getListing } from '@/services/listings';
import type { Listing } from '@/types';
import { formatCurrency } from '@/lib/utils';

const SHIPPING_OPTIONS = [
  { id: 'standard', name: 'Self Pickup', time: 'Pickup from store', price: 0 },
  { id: 'express', name: 'Express Delivery', time: 'Within 4 hours', price: 200 },
];

function BookContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const id = searchParams.get('id');
  const queryStart = searchParams.get('start') || '';
  const queryEnd = searchParams.get('end') || '';

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState(queryStart);
  const [endDate, setEndDate] = useState(queryEnd);
  const [shipping, setShipping] = useState('standard');

  useEffect(() => {
    if (!user && !authLoading) {
      const returnUrl = encodeURIComponent(`/book?id=${id}&start=${startDate}&end=${endDate}`);
      router.push(`/login?redirect=${returnUrl}`);
    }
  }, [user, authLoading, id, startDate, endDate, router]);
  useEffect(() => {
    if (!id) {
      setError('No listing ID provided');
      setLoading(false);
      return;
    }

    async function fetchListing() {
      try {
        setLoading(true);
        const data = await getListing(id as string);
        if (data) {
          setListing(data);
        } else {
          setError('Gear details not found');
        }
      } catch (err) {
        setError('Failed to load gear for booking');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchListing();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-muted font-medium">Preparing your booking...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-text mb-2">Booking Error</h1>
        <p className="text-muted mb-8">{error || 'Unable to load gear details'}</p>
        <Link href="/search" className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold">
          Return to Search
        </Link>
      </div>
    );
  }

  const days = startDate && endDate ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)) : 0;
  const price = listing.pricePerDay || 0;
  const subtotal = days * price;
  const shippingPrice = SHIPPING_OPTIONS.find(s => s.id === shipping)?.price || 0;
  const serviceFee = Math.round(subtotal * 0.1);
  const total = subtotal + shippingPrice + serviceFee;

  const thumbnail = listing.listingImages?.[0]?.image_url || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80';

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Item Summary Card */}
          <div className="bg-card rounded-3xl p-6 flex gap-5 items-center shadow-sm border border-slate-100">
            <div className="w-28 h-28 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
              <Image src={thumbnail} alt={listing.title} width={112} height={112} className="object-cover w-full h-full" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{listing.subcategory || 'Gear'}</span>
              </div>
              <h2 className="text-xl font-bold text-text line-clamp-1">{listing.title}</h2>
              <div className="flex items-center gap-1.5 text-muted text-sm mt-1.5">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <span>{listing.stores?.store_city || 'Location available on request'}</span>
              </div>
              <p className="text-xs text-faint mt-2 font-medium">Provided by <span className="text-indigo-600 font-bold">{listing.stores?.store_name || 'Verified Owner'}</span></p>
            </div>
          </div>

          {/* Date Selection */}
          <div className="bg-card rounded-3xl p-8 space-y-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm shadow-indigo-100">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-text">Select rental dates</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-faint uppercase tracking-widest ml-1">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-faint pointer-events-none" />
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full h-14 pl-12 pr-4 bg-subtle rounded-2xl text-sm font-bold text-text focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all border-none" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-faint uppercase tracking-widest ml-1">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-faint pointer-events-none" />
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    className="w-full h-14 pl-12 pr-4 bg-subtle rounded-2xl text-sm font-bold text-text focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all border-none" 
                  />
                </div>
              </div>
            </div>

            {days > 0 && (
              <div className="p-4 bg-indigo-50 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <Info className="w-5 h-5 text-indigo-600" />
                <p className="text-sm font-semibold text-indigo-900">You&apos;re renting this item for <span className="text-indigo-600 font-black">{days} day{days > 1 ? 's' : ''}</span></p>
              </div>
            )}
          </div>

          {/* Shipping Options */}
          <div className="bg-card rounded-3xl p-8 space-y-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm shadow-indigo-100">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-text">Fulfillment method</h3>
            </div>

            <div className="space-y-3">
              {SHIPPING_OPTIONS.map((opt) => (
                <label key={opt.id} className={`group relative flex items-center justify-between p-5 rounded-2xl cursor-pointer transition-all ${shipping === opt.id ? 'bg-indigo-50 ring-2 ring-indigo-600/10' : 'bg-subtle hover:bg-slate-100'}`}>
                  <input type="radio" name="shipping" value={opt.id} checked={shipping === opt.id} onChange={() => setShipping(opt.id)} className="sr-only" />
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${shipping === opt.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-card'}`}>
                      {shipping === opt.id && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div>
                      <p className="font-bold text-text">{opt.name}</p>
                      <p className="text-xs text-muted font-medium">{opt.time}</p>
                    </div>
                  </div>
                  <p className="font-black text-text">{opt.price === 0 ? 'FREE' : formatCurrency(opt.price)}</p>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5">
          <div className="sticky top-28 space-y-6">
            <div className="bg-card rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100">
              <h3 className="text-2xl font-bold text-text mb-8">Booking Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between text-muted font-bold text-sm uppercase tracking-wider">
                  <span>Rental ({formatCurrency(price)}/day)</span>
                  <span className="text-text">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted font-bold text-sm uppercase tracking-wider">
                  <span>Fulfillment</span>
                  <span className="text-text">{shippingPrice === 0 ? 'FREE' : formatCurrency(shippingPrice)}</span>
                </div>
                <div className="flex justify-between text-muted font-bold text-sm uppercase tracking-wider">
                  <span>Service fee (10%)</span>
                  <span className="text-text">{formatCurrency(serviceFee)}</span>
                </div>
                <div className="flex justify-between text-muted font-bold text-sm uppercase tracking-wider border-b border-dashed border-slate-200 pb-4">
                  <span>Duration</span>
                  <span className="text-indigo-600">{days} day{days > 1 ? 's' : ''}</span>
                </div>
                
                <div className="pt-8 mt-4 bg-indigo-600 -mx-8 px-8 py-8 rounded-b-[2.5rem] text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5 opacity-80">Total amount</p>
                      <p className="text-4xl font-black">{formatCurrency(total)}</p>
                    </div>
                    <Link href={`/checkout?item=${id}&start=${startDate}&end=${endDate}`} className={`h-16 px-8 bg-white text-indigo-600 hover:bg-indigo-50 rounded-2xl font-black transition-all flex items-center gap-2 shadow-xl ${days === 0 ? 'opacity-50 pointer-events-none grayscale' : 'active:scale-95'}`}>
                      <Zap className="w-5 h-5 fill-indigo-600" />
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Badge */}
            <div className="bg-white rounded-[2rem] p-6 flex items-start gap-4 border border-indigo-100/50 shadow-sm">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-indigo-600 shadow-inner">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-text text-lg">GoRentals Protection</h4>
                <p className="text-xs text-muted leading-relaxed mt-1 font-medium">Your payment is held securely in escrow until you receive and verify the item. 100% money-back guarantee.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <div className="min-h-screen bg-subtle pb-20">
      {/* Header / Nav */}
      <div className="bg-card px-4 py-5 sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/search" className="flex items-center gap-2 text-muted hover:text-indigo-600 font-bold transition-colors text-sm uppercase tracking-wider">
            <ChevronLeft className="w-5 h-5" />
            <span>Cancel</span>
          </Link>
          <h1 className="text-xl font-black text-text tracking-tight">Confirm Booking</h1>
          <div className="w-10"></div> {/* Spacer */}
        </div>
      </div>

      <Suspense fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-muted font-medium">Loading booking environment...</p>
        </div>
      }>
        <BookContent />
      </Suspense>
    </div>
  );
}

