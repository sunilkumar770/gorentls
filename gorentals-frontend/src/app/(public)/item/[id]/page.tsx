'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuth } from '@/hooks/useAuth';
import { createBooking } from '@/services/bookings';
import { todayISO, daysBetween } from '@/lib/utils';
import { MapPin, Shield, Calendar, Loader2, ChevronLeft, Package, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Listing, BlockedRange } from '@/types';
import { getAvailability } from '@/services/availability';
import { DayPicker, DateRange } from 'react-day-picker';
import { format, isSameDay, startOfDay } from 'date-fns';
import 'react-day-picker/dist/style.css';

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
      api.get<Listing>(`/listings/${id}`),
      getAvailability(id as string)
    ])
      .then(([listingRes, availRes]) => {
        setListing(listingRes.data);
        setBlockedRanges(availRes.blockedRanges);
        setLoading(false);
      })
      .catch(() => { setError('This listing could not be found.'); setLoading(false); });
  }, [id]);

  // Production pricing formula: total = (days × pricePerDay) + securityDeposit
  const startDate = selectedRange?.from ? format(selectedRange.from, 'yyyy-MM-dd') : '';
  const endDate   = selectedRange?.to ? format(selectedRange.to, 'yyyy-MM-dd') : '';
  const days    = selectedRange?.from && selectedRange?.to ? daysBetween(selectedRange.from, selectedRange.to) : 0;
  const rental  = days * (listing?.price_per_day ?? listing?.pricePerDay ?? 0);
  const deposit = listing?.security_deposit ?? listing?.securityDeposit ?? 0;
  const total   = rental + deposit;

  const isOwnListing = !!user && listing?.owner?.id === user.id;
  const canBook      =
    isAuthenticated && listing?.isAvailable && !isOwnListing && !!startDate && !!endDate && days >= 1;

  async function handleBookNow() {
    if (!canBook || !listing) return;
    setBooking(true);
    try {
      const b = await createBooking({
        listingId:       listing.id,
        startDate, endDate,
        totalDays:       days,
        rentalAmount:    rental,
        securityDeposit: deposit,
        totalAmount:     total,
      });
      router.push(`/checkout/${b.id}`);
    } catch (err: any) {
      if (err.response?.status === 409) {
        toast.error('These dates are not available. Please choose different dates.');
      } else {
        toast.error(err?.response?.data?.message ?? 'Could not create booking. Please try again.');
      }
      setBooking(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-9 h-9 rounded-full border-4 border-[#16a34a]/20 border-t-[#16a34a] animate-spin" />
    </div>
  );

  if (error || !listing) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
      <div className="text-5xl">😕</div>
      <p className="text-gray-700 font-semibold">{error ?? 'Listing not found.'}</p>
      <Link href="/search" className="text-[#16a34a] text-sm font-medium hover:underline">← Back to search</Link>
    </div>
  );

  const images = listing.listing_images ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => router.back()}
                  className="flex items-center gap-1 hover:text-gray-800 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <span>/</span>
          <Link href="/search" className="hover:text-gray-800">Search</Link>
          <span>/</span>
          <span className="text-gray-800 truncate max-w-[200px]">{listing.title}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl overflow-hidden bg-gray-200 aspect-video">
              {images.length > 0 ? (
                <img src={images[activeImg]?.image_url} alt={listing.title}
                     className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-16 h-16 text-gray-300" />
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button key={img.id} onClick={() => setActiveImg(i)}
                          className={`w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all
                            ${i === activeImg ? 'border-[#16a34a]' : 'border-transparent opacity-60 hover:opacity-90'}`}>
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
                {!listing.isAvailable && (
                  <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full flex-shrink-0">
                    Not Available
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-4">
                {listing.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {listing.city}{listing.state ? `, ${listing.state}` : ''}
                  </span>
                )}
                {listing.category && (
                  <span className="px-2.5 py-0.5 bg-gray-100 rounded-full text-xs font-medium">
                    {listing.category}
                  </span>
                )}
                {listing.condition && (
                  <span className="px-2.5 py-0.5 bg-gray-100 rounded-full text-xs font-medium">
                    {listing.condition}
                  </span>
                )}
              </div>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">
                {listing.description}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Listed by</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#16a34a]/10 rounded-full flex items-center justify-center">
                    <span className="text-[#16a34a] font-bold text-sm">
                      {(listing.owner?.fullName ?? 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{listing.owner?.fullName}</p>
                    <p className="text-xs text-gray-400">{listing.owner?.email}</p>
                  </div>
                </div>
              </div>
              
              {!isOwnListing && isAuthenticated && (
                <button 
                  onClick={async () => {
                    import('@/services/messages').then(async ({ startConversation }) => {
                      const toast = (await import('react-hot-toast')).toast;
                      try {
                        const conv = await startConversation(listing.id, "Hi, I'm interested in this item.");
                        router.push(`/messages/${conv.id}`);
                      } catch (err) {
                        toast.error('Failed to start conversation. It might already exist.');
                        router.push('/messages');
                      }
                    });
                  }}
                  className="px-4 py-2 mt-6 bg-[#f0fdf4] text-[#16a34a] text-sm font-semibold rounded-lg hover:bg-[#dcfce7] transition-colors border border-[#86efac]"
                >
                  Contact Owner
                </button>
              )}
            </div>
          </div>

          {/* Right — booking card */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-white rounded-2xl border border-gray-200 shadow-md p-6">
              <div className="mb-5">
                <p className="text-3xl font-bold text-gray-900">
                  ₹{(listing.price_per_day ?? listing.pricePerDay ?? 0).toLocaleString('en-IN')}
                  <span className="text-base font-normal text-gray-500">/day</span>
                </p>
                {deposit > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    + ₹{deposit.toLocaleString('en-IN')} refundable deposit
                  </p>
                )}
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                  Select Rental Dates
                </label>
                <div className="flex justify-center border rounded-2xl p-2 bg-gray-50/50">
                  <DayPicker
                    mode="range"
                    selected={selectedRange}
                    onSelect={setSelectedRange}
                    disabled={[
                      { before: startOfDay(new Date()) },
                      ...blockedRanges.map(r => ({ from: new Date(r.startDate), to: new Date(r.endDate) }))
                    ]}
                    styles={{
                      caption: { color: '#111827', fontWeight: '700' },
                      head_cell: { color: '#6b7280', fontSize: '0.65rem', fontWeight: '700' },
                      day: { fontWeight: '500' }
                    }}
                    modifiersStyles={{
                      selected: { backgroundColor: '#16a34a', color: 'white' },
                      today: { color: '#16a34a', fontWeight: 'bold' }
                    }}
                  />
                </div>
                {selectedRange?.from && !selectedRange?.to && (
                  <p className="text-[10px] text-orange-600 mt-2 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Select return date to continue
                  </p>
                )}
              </div>

              {days > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>₹{(listing.price_per_day ?? listing.pricePerDay ?? 0).toLocaleString('en-IN')} × {days} day{days !== 1 ? 's' : ''}</span>
                    <span className="font-semibold text-gray-900">₹{rental.toLocaleString('en-IN')}</span>
                  </div>
                  {deposit > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Deposit <span className="text-xs text-gray-400">(refundable)</span></span>
                      <span className="font-semibold text-gray-900">₹{deposit.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2">
                    <span>Total</span>
                    <span className="text-[#16a34a]">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              {/* 4 mutually exclusive CTA states */}
              {!isAuthenticated ? (
                <Link href={`/login?redirect=/item/${listing.id}`}
                      className="block w-full h-12 bg-[#16a34a] text-white font-semibold rounded-xl
                                 flex items-center justify-center text-sm hover:bg-[#15803d] transition-colors">
                  Login to Book
                </Link>
              ) : isOwnListing ? (
                <div className="w-full h-12 bg-gray-100 text-gray-400 rounded-xl
                                flex items-center justify-center text-sm font-medium select-none">
                  You own this listing
                </div>
              ) : !listing.isAvailable ? (
                <div className="w-full h-12 bg-red-50 text-red-400 rounded-xl
                                flex items-center justify-center text-sm font-medium select-none">
                  Currently Unavailable
                </div>
              ) : (
                <button onClick={handleBookNow} disabled={!canBook || booking}
                        className="w-full h-12 bg-[#16a34a] text-white font-semibold rounded-xl
                                   flex items-center justify-center gap-2 hover:bg-[#15803d]
                                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">
                  {booking && <Loader2 className="w-4 h-4 animate-spin" />}
                  {booking ? 'Processing…' : days > 0 ? `Book for ₹${total.toLocaleString('en-IN')}` : 'Select dates to continue'}
                </button>
              )}

              {isAuthenticated && listing.isAvailable && !isOwnListing && (
                <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mt-3">
                  <Shield className="w-3.5 h-3.5" /> Secured by Razorpay
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
