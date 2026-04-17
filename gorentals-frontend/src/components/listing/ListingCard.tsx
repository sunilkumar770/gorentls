import Link from 'next/link';
import Image from 'next/image';
import type { Listing } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { Star, MapPin, Package } from 'lucide-react';

export function ListingCard({ listing }: { listing: Listing }) {
  const [imgError, setImgError] = useState(false);

  const imgSrc = !imgError
    ? (listing.listing_images?.[0]?.image_url
      || '/placeholder-item.jpg')
    : '/placeholder-item.jpg';

  // "stores" is deprecated, city is directly on the Listing now. wait actually it is in stores now based on strict type.
  const city = listing.stores?.store_city || null;
  const rating = 0;
  const reviewCount = 0;

  const categoryEmoji: Record<string, string> = {
    CAMERAS: '📸', cameras: '📸',
    GAMING: '🎮', gaming: '🎮',
    AUDIO: '🎧', audio: '🎧',
    ELECTRONICS: '💻', electronics: '💻',
    BIKES: '🚲', bikes: '🚲',
    TOOLS: '🛠️', tools: '🛠️',
    SPORTS: '⚽', sports: '⚽',
    CAMPING: '⛺', camping: '⛺',
  };
  const emoji = categoryEmoji[listing.category] || '📦';

  return (
    <Link href={`/item/${listing.id}`} className="group block focus:outline-none">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 border border-[#f3f4f6]">

        {/* Image — 16:9 */}
        <div className="relative aspect-video w-full bg-[#f0fdf4] overflow-hidden">
          {imgSrc && imgSrc !== '/placeholder-item.jpg' ? (
            <Image
              src={imgSrc}
              alt={listing.title}
              fill
              onError={() => setImgError(true)}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <Package className="w-8 h-8 text-[#86efac]" />
              <span className="text-xs text-[#16a34a] font-medium">{listing.category}</span>
            </div>
          )}

          {/* Availability badge */}
          {listing.is_available === false && (
            <div className="absolute inset-0 bg-gray-900/60 rounded-2xl flex items-center justify-center z-10 pointer-events-none">
              <span className="text-white font-semibold text-xs uppercase tracking-wider bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                Unavailable
              </span>
            </div>
          )}

          {/* Category pill */}
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 bg-[#f0fdf4]/90 backdrop-blur-sm text-[#16a34a] text-xs font-semibold rounded-full">
              {emoji} {listing.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-2">
          {/* Title */}
          <h3 className="font-semibold text-[#111827] text-sm leading-snug line-clamp-2 group-hover:text-[#16a34a] transition-colors">
            {listing.title}
          </h3>

          {/* City */}
          {city && (
            <div className="flex items-center gap-1 text-xs text-[#6b7280]">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="line-clamp-1">{city}</span>
            </div>
          )}

          {/* Price row + rating */}
          <div className="flex items-center justify-between mt-1">
              <span className="text-base font-bold text-[#111827]">
                {formatCurrency(listing.price_per_day ?? 0)}
              </span>
              <span className="text-xs text-[#9ca3af] font-normal">/day</span>

            {rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-[#374151]">{rating.toFixed(1)}</span>
                {reviewCount > 0 && (
                  <span className="text-xs text-[#9ca3af]">({reviewCount})</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
