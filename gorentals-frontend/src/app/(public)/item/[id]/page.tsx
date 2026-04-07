'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useListing } from '@/hooks/useListings';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate } from '@/lib/utils';
import { MapPin, Star, Shield, User, ChevronLeft, Share2, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// ─── Skeleton ────────────────────────────────────────────────────────────────
function ItemDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#f9fafb] pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="w-full aspect-[16/9] bg-gray-200 rounded-2xl" />
          <div className="flex gap-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-20 h-16 bg-gray-200 rounded-lg flex-shrink-0" />
            ))}
          </div>
          <div className="h-6 w-1/3 bg-gray-200 rounded-full" />
          <div className="h-10 w-2/3 bg-gray-200 rounded-lg" />
          <div className="h-5 w-1/4 bg-gray-200 rounded-lg" />
          <div className="h-24 bg-gray-200 rounded-lg" />
        </div>
        <div className="lg:col-span-5">
          <div className="h-96 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Not Found ────────────────────────────────────────────────────────────────
function ItemNotFound() {
  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center gap-6 px-4">
      <div className="w-24 h-24 bg-[#f0fdf4] rounded-full flex items-center justify-center">
        <span className="text-4xl">🔍</span>
      </div>
      <h1 className="text-3xl font-bold text-[#111827] text-center">Item not found</h1>
      <p className="text-[#6b7280] text-center max-w-sm">
        This listing may have been removed or is no longer available.
      </p>
      <Link
        href="/search"
        className="px-6 py-3 bg-[#16a34a] text-white font-semibold rounded-lg hover:bg-[#15803d] transition-colors"
      >
        Browse listings
      </Link>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { listing, loading } = useListing(id);
  const { user } = useAuth();

  const [selectedImage, setSelectedImage] = useState(0);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  if (loading) return <ItemDetailSkeleton />;
  if (!listing) return <ItemNotFound />;

  const images = listing.listing_images?.length
    ? listing.listing_images
    : [{ id: 'ph', listing_id: id, image_url: '/placeholder-item.jpg', is_primary: true, display_order: 0 }];

  const store = Array.isArray(listing.stores) ? listing.stores[0] : listing.stores;

  // ──── Booking math ────
  const diffDays = fromDate && toDate
    ? Math.max(1, Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const subtotal = diffDays * listing.price_per_day;
  const platformFee = Math.round(subtotal * 0.05);
  const total = subtotal + platformFee;

  const today = new Date().toISOString().split('T')[0];

  const categoryEmoji: Record<string, string> = {
    CAMERAS: '📸', cameras: '📸',
    GAMING: '🎮', gaming: '🎮',
    AUDIO: '🎵', audio: '🎵',
    ELECTRONICS: '⚡', electronics: '⚡',
    BIKES: '🚲', bikes: '🚲',
    TOOLS: '🔧', tools: '🔧',
    SPORTS: '🏋️', sports: '🏋️',
    CAMPING: '⛺', camping: '⛺',
  };

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-[#111827]">
            <span className="w-8 h-8 bg-[#16a34a] rounded-lg flex items-center justify-center text-white text-sm font-black">G</span>
            <span>GoRentals</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#111827] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button className="p-2 rounded-lg hover:bg-[#f9fafb] transition-colors">
              <Share2 className="w-4 h-4 text-[#6b7280]" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT — Media + Info */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            {/* Main image */}
            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-[#e9f0e5] shadow-sm">
              <Image
                src={images[selectedImage]?.image_url || '/placeholder-item.jpg'}
                alt={listing.title}
                fill
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 60vw"
                priority
              />
              {listing.is_available ? (
                <span className="absolute top-4 left-4 px-3 py-1 bg-[#f0fdf4] text-[#16a34a] text-xs font-semibold rounded-full ring-1 ring-[#16a34a]/20">
                  🟢 Available
                </span>
              ) : (
                <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                  <span className="px-4 py-2 bg-white text-[#dc2626] font-semibold rounded-lg text-sm">
                    Currently unavailable
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden ring-2 transition-all ${
                      selectedImage === i ? 'ring-[#16a34a]' : 'ring-transparent hover:ring-[#e5e7eb]'
                    }`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-[#f0fdf4] text-[#16a34a] text-sm font-medium rounded-full">
                {categoryEmoji[listing.category] || '📦'} {listing.category}
              </span>
              {store?.store_city && (
                <span className="flex items-center gap-1 text-sm text-[#6b7280]">
                  <MapPin className="w-3.5 h-3.5" /> {store.store_city}
                </span>
              )}
              {listing.total_reviews > 0 && (
                <span className="flex items-center gap-1 text-sm text-[#6b7280]">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {listing.average_rating.toFixed(1)} ({listing.total_reviews} reviews)
                </span>
              )}
            </div>

            {/* Title + price */}
            <div>
              <h1 className="text-3xl font-bold text-[#111827] leading-tight">{listing.title}</h1>
              <p className="text-2xl font-semibold text-[#16a34a] mt-2">
                {formatCurrency(listing.price_per_day)}<span className="text-base font-normal text-[#6b7280]">/day</span>
              </p>
            </div>

            {/* About */}
            <section>
              <h2 className="text-xl font-semibold text-[#111827] mb-3">About this item</h2>
              <p className="text-[#6b7280] leading-relaxed">
                {listing.description || 'No description provided for this listing.'}
              </p>
            </section>

            {/* Specs */}
            <section>
              <h2 className="text-xl font-semibold text-[#111827] mb-3">Details</h2>
              <div className="bg-white rounded-xl p-4 divide-y divide-[#f3f4f6]">
                {[
                  ['Category', listing.category],
                  ['Condition', listing.condition?.replace('_', ' ')],
                  ['Security Deposit', formatCurrency(listing.security_deposit)],
                  ['Listed by', store?.store_name || 'Owner'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-3 text-sm">
                    <span className="text-[#6b7280]">{label}</span>
                    <span className="font-medium text-[#111827] capitalize">{value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Owner card */}
            <section className="bg-white rounded-xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-[#f0fdf4] rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-[#16a34a]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#111827]">{store?.store_name || 'Owner'}</p>
                <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                  {store?.verification_status === 'verified' && (
                    <span className="flex items-center gap-1 text-[#16a34a] text-xs">
                      <Shield className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                  {store?.store_city && <span>{store.store_city}</span>}
                </div>
              </div>
              <button className="px-4 py-2 border border-[#16a34a] text-[#16a34a] text-sm font-medium rounded-lg hover:bg-[#f0fdf4] transition-colors">
                Contact
              </button>
            </section>
          </div>

          {/* RIGHT — Booking card (sticky) */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 bg-white rounded-2xl shadow-md p-6 flex flex-col gap-5">
              {/* Price */}
              <div>
                <p className="text-3xl font-bold text-[#16a34a]">
                  {formatCurrency(listing.price_per_day)}
                  <span className="text-base font-normal text-[#6b7280]">/day</span>
                </p>
              </div>

              {/* Date pickers */}
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    <Calendar className="inline w-3.5 h-3.5 mr-1" /> From
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    min={today}
                    onChange={e => setFromDate(e.target.value)}
                    className="w-full h-11 px-3 border border-[#e5e7eb] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    <Calendar className="inline w-3.5 h-3.5 mr-1" /> To
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    min={fromDate || today}
                    onChange={e => setToDate(e.target.value)}
                    className="w-full h-11 px-3 border border-[#e5e7eb] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Duration + breakdown */}
              {diffDays > 0 && (
                <div className="bg-[#f9fafb] rounded-lg p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-medium text-[#111827]">{diffDays} day{diffDays > 1 ? 's' : ''}</span>
                  </div>
                  <div className="border-t border-[#e5e7eb] pt-2 mt-1 flex flex-col gap-1.5 text-sm">
                    <div className="flex justify-between text-[#6b7280]">
                      <span>{formatCurrency(listing.price_per_day)} × {diffDays} day{diffDays > 1 ? 's' : ''}</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-[#6b7280]">
                      <span>Platform fee (5%)</span>
                      <span>{formatCurrency(platformFee)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-[#111827] pt-1 border-t border-[#e5e7eb]">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* CTA */}
              {listing.is_available ? (
                user ? (
                  <Link
                    href={fromDate && toDate ? `/checkout/${listing.id}?start=${fromDate}&end=${toDate}` : `/checkout/${listing.id}`}
                    className="w-full h-12 bg-[#16a34a] text-white font-semibold rounded-lg flex items-center justify-center hover:bg-[#15803d] transition-colors text-sm"
                  >
                    Book Now
                  </Link>
                ) : (
                  <Link
                    href={`/login?redirect=/item/${listing.id}`}
                    className="w-full h-12 bg-[#16a34a] text-white font-semibold rounded-lg flex items-center justify-center hover:bg-[#15803d] transition-colors text-sm"
                  >
                    Sign in to Book
                  </Link>
                )
              ) : (
                <button
                  disabled
                  className="w-full h-12 bg-[#e5e7eb] text-[#9ca3af] font-semibold rounded-lg cursor-not-allowed text-sm"
                >
                  Currently Unavailable
                </button>
              )}

              {/* Trust badge */}
              <p className="text-xs text-[#9ca3af] text-center flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" /> Secure booking · Protected by GoRentals
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
