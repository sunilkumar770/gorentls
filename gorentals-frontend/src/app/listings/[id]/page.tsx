'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Star, MapPin, ShieldCheck, Calendar, ChevronLeft, ChevronRight, Package, Zap, Loader2, Info } from 'lucide-react';
import { getListing, getAvailability } from '@/services/listings';
import type { Listing, BlockedRange } from '@/types';
import { formatCurrency } from '@/lib/utils';
import BookingCalendar from '@/components/booking/BookingCalendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

const CONDITION_COLORS: Record<string,string> = { 
  'New': 'bg-indigo-600 text-white', 
  'Like New': 'bg-indigo-50 text-indigo-700', 
  'Good': 'bg-amber-50 text-amber-700', 
  'Fair': 'bg-subtle text-muted' 
};

export default function ListingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeImg, setActiveImg] = useState(0);
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();

  useEffect(() => {
    if (!id) return;
    
    async function fetchData() {
      try {
        setLoading(true);
        const [listingData, availabilityData] = await Promise.all([
          getListing(id as string),
          getAvailability(id as string)
        ]);
        
        if (listingData) {
          setListing(listingData);
        } else {
          setError('Listing not found');
        }
        
        if (availabilityData) {
          setBlockedRanges(availabilityData.blockedRanges);
        }
      } catch (err) {
        setError('Failed to load listing details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-subtle flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-muted font-medium">Loading premium gear details...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-subtle flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-6">
          <Package className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-text mb-2">Oops! {error || 'Listing not found'}</h1>
        <p className="text-muted max-w-md mb-8">We couldn&apos;t find the gear you&apos;re looking for. It might have been removed or the link is broken.</p>
        <Link href="/search" className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold transition-transform hover:scale-105 active:scale-95">
          Browse Other Gear
        </Link>
      </div>
    );
  }

  const images = (listing.listingImages || []).length > 0 
    ? listing.listingImages.map(img => img.image_url) 
    : ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=900&q=85']; // Fallback

  const condition = listing.subcategory || 'Good';
  const price = listing.pricePerDay || 0;
  const deposit = listing.securityDeposit || 0;
  
  const days = selectedRange?.from && selectedRange?.to 
    ? Math.max(1, Math.ceil((selectedRange.to.getTime() - selectedRange.from.getTime()) / 86400000) + 1) 
    : 1;
  const subtotal = days * price;
  const serviceFee = Math.round(subtotal * 0.1);
  const total = subtotal + serviceFee;

  const handleBookNow = () => {
    if (!selectedRange?.from || !selectedRange?.to) {
      alert('Please select a date range first');
      return;
    }
    
    const params = new URLSearchParams();
    params.append('id', listing.id);
    params.append('start', format(selectedRange.from, 'yyyy-MM-dd'));
    params.append('end', format(selectedRange.to, 'yyyy-MM-dd'));
    router.push(`/book?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-subtle pb-24">
      {/* Breadcrumb */}
      <div className="bg-card px-4 py-3 border-b border-slate-100">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-faint">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/search" className="hover:text-indigo-600 transition-colors">Browse</Link>
          <span>/</span>
          <span className="text-text font-medium truncate max-w-[200px]">{listing.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ── Left: Images + Details ─────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Image Carousel */}
            <div className="space-y-3">
              <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-slate-100 shadow-sm">
                <Image 
                  src={images[activeImg]} 
                  alt={listing.title} 
                  fill 
                  className="object-cover" 
                  sizes="(max-width: 1024px) 100vw, 66vw" 
                  priority 
                />
                
                {images.length > 1 && (
                  <>
                    <button onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-card/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-card transition-all active:scale-90">
                      <ChevronLeft className="w-6 h-6 text-text" />
                    </button>
                    <button onClick={() => setActiveImg(i => (i + 1) % images.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-card/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-card transition-all active:scale-90">
                      <ChevronRight className="w-6 h-6 text-text" />
                    </button>
                  </>
                )}
                
                <div className={`absolute top-4 left-4 px-4 py-1.5 rounded-full text-xs font-bold shadow-md ${CONDITION_COLORS[condition] || 'bg-indigo-600 text-white'}`}>
                  {condition}
                </div>
              </div>
              
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className={`flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden transition-all duration-200 ${activeImg === i ? 'ring-2 ring-indigo-600 ring-offset-2 scale-95' : 'opacity-60 hover:opacity-100'}`}>
                      <Image src={img} alt="" width={96} height={64} className="object-cover w-full h-full" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title + Meta */}
            <div className="bg-card rounded-[2rem] p-8 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wider">{listing.category}</span>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-bold text-text">New listing</span>
                </div>
                {listing.isAvailable === false && (
                  <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full">Currently Unavailable</span>
                )}
              </div>
              <h1 className="text-4xl font-bold text-text mb-6 tracking-tight leading-tight">{listing.title}</h1>
              <div className="flex items-center gap-2 text-muted font-medium">
                <MapPin className="w-5 h-5 text-indigo-500" />
                <span>{listing.stores?.store_city || 'Location available on request'}</span>
              </div>
            </div>

            {/* Owner row */}
            <div className="flex items-center gap-5 p-6 bg-card rounded-[2rem] shadow-sm group">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-lg shadow-indigo-100">
                {listing.stores?.store_name?.[0] || 'O'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-lg text-text">{listing.stores?.store_name || 'Verified Owner'}</p>
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-tighter">
                    <ShieldCheck className="w-3.5 h-3.5" />Verified
                  </span>
                </div>
                <p className="text-sm text-muted">Trusted provider · Quality gear guaranteed</p>
              </div>
              <Link href={`/search?ownerId=${listing.ownerId}`} className="px-5 py-2.5 bg-subtle hover:bg-indigo-50 text-indigo-600 text-sm font-bold rounded-xl transition-colors">
                View Store
              </Link>
            </div>

            {/* Description */}
            <div className="bg-card rounded-[2rem] p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-text mb-6">About this item</h2>
              <div className="prose prose-slate max-w-none text-muted leading-relaxed whitespace-pre-wrap">
                {listing.description || 'No description provided by the owner.'}
              </div>
            </div>

            {/* Quick Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-card rounded-[2rem] shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-faint uppercase tracking-widest mb-1">Condition</p>
                  <p className="font-bold text-text text-lg">{condition}</p>
                </div>
              </div>
              <div className="p-6 bg-card rounded-[2rem] shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-faint uppercase tracking-widest mb-1">Security Deposit</p>
                  <p className="font-bold text-text text-lg">{formatCurrency(deposit)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Booking Widget ──────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100 space-y-8">
              <div>
                <p className="text-faint font-bold text-xs uppercase tracking-widest mb-2">Rental Price</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-text">{formatCurrency(price)}</span>
                  <span className="text-muted font-bold text-lg">/day</span>
                </div>
              </div>

              <div className="space-y-4">
                <BookingCalendar 
                  blockedRanges={blockedRanges}
                  selectedRange={selectedRange}
                  onSelect={setSelectedRange}
                  disabled={listing.isAvailable === false}
                />
              </div>

              {/* Price breakdown */}
              <div className="space-y-3 pt-6 bg-subtle -mx-8 px-8 py-6">
                <div className="flex justify-between text-sm font-medium text-muted">
                  <span>{formatCurrency(price)} × {days} day{days > 1 ? 's' : ''}</span>
                  <span className="text-text font-bold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-muted">
                  <span>Service fee (10%)</span>
                  <span className="text-text font-bold">{formatCurrency(serviceFee)}</span>
                </div>
                <div className="flex justify-between items-end pt-5 mt-3 border-t border-slate-200">
                  <span className="font-bold text-text">Total amount</span>
                  <span className="text-3xl font-black text-indigo-600">{formatCurrency(total)}</span>
                </div>
              </div>

              <button 
                onClick={handleBookNow}
                disabled={listing.isAvailable === false}
                className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 active:scale-95 group"
              >
                <Zap className="w-6 h-6 fill-white group-hover:scale-110 transition-transform" />
                Book Now
              </button>
              
              <div className="flex items-start gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-indigo-900 leading-relaxed font-medium">
                  <strong>Secured Escrow Payment</strong> — Your money is only released to the owner after you verify the gear condition on pickup.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
