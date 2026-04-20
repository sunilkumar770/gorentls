'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Listing } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { MapPin, Camera, Gamepad2, Wrench, Tent, Music, Package, ArrowRight } from 'lucide-react';

// ── Category icon map (SVG only, no emoji) ───────────────────────
const CATEGORY_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  CAMERAS:     { icon: Camera,   color: 'text-[#01696f]',  bg: 'bg-[#e6f4f4]' },
  GAMING:      { icon: Gamepad2, color: 'text-purple-600', bg: 'bg-purple-50' },
  TOOLS:       { icon: Wrench,   color: 'text-orange-600', bg: 'bg-orange-50' },
  CAMPING:     { icon: Tent,     color: 'text-amber-600',  bg: 'bg-amber-50'  },
  AUDIO:       { icon: Music,    color: 'text-blue-600',   bg: 'bg-blue-50'   },
  ELECTRONICS: { icon: Camera,   color: 'text-slate-600',  bg: 'bg-slate-100' },
  SPORTS:      { icon: Package,  color: 'text-green-600',  bg: 'bg-green-50'  },
};

function getCategoryStyle(category?: string) {
  if (!category) return CATEGORY_ICONS['CAMERAS'];
  return CATEGORY_ICONS[category.toUpperCase()] ?? { icon: Package, color: 'text-[#6b6b65]', bg: 'bg-[#f7f6f2]' };
}

export function ListingCard({ listing }: { listing: Listing }) {
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);

  const imgSrc = !imgError
    ? (listing.listing_images?.[0]?.image_url || null)
    : null;

  const city = listing.stores?.store_city || null;
  const { icon: CategoryIcon, color, bg } = getCategoryStyle(listing.category);
  const categoryLabel = listing.category
    ? listing.category.charAt(0).toUpperCase() + listing.category.slice(1).toLowerCase()
    : '';

  return (
    <Link
      href={`/item/${listing.id}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#01696f] focus-visible:ring-offset-2 rounded-2xl"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 border border-[#01696f]/8 ${
        hovered
          ? 'shadow-[0_8px_32px_rgba(1,105,111,0.12)] -translate-y-1'
          : 'shadow-[0_2px_8px_rgba(1,105,111,0.06)]'
      }`}>

        {/* Image — 16:9 ratio */}
        <div className="relative aspect-video w-full bg-[#f7f6f2] overflow-hidden">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={listing.title}
              fill
              onError={() => setImgError(true)}
              className={`object-cover transition-transform duration-500 ${hovered ? 'scale-105' : 'scale-100'}`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
            />
          ) : (
            /* Graceful placeholder — shimmer + icon */
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#f7f6f2]">
              <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center`}>
                <CategoryIcon className={`w-7 h-7 ${color}`} strokeWidth={1.5} />
              </div>
              <span className="text-xs text-[#9b9b93] font-medium">No photo yet</span>
            </div>
          )}

          {/* Unavailability overlay */}
          {listing.is_available === false && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 pointer-events-none backdrop-blur-[1px]">
              <span className="text-white font-bold text-xs uppercase tracking-widest bg-black/30 px-4 py-2 rounded-full">
                Unavailable
              </span>
            </div>
          )}

          {/* Category pill — clean chip */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full border ${bg} ${color} border-current/20`}>
              <CategoryIcon className="w-3 h-3" strokeWidth={2} />
              {categoryLabel}
            </span>
          </div>

          {/* Hover CTA */}
          <div className={`absolute inset-0 flex items-end p-4 transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'} pointer-events-none`}>
            <div className="w-full flex justify-end">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#01696f] text-xs font-bold rounded-xl shadow-lg">
                View details <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-2">
          {/* Title */}
          <h3 className={`font-display font-bold text-sm leading-snug line-clamp-2 transition-colors ${
            hovered ? 'text-[#01696f]' : 'text-[#1a1a18]'
          }`}>
            {listing.title}
          </h3>

          {/* City */}
          {city && (
            <div className="flex items-center gap-1.5 text-xs text-[#9b9b93] font-medium">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="line-clamp-1">{city}</span>
            </div>
          )}

          {/* Price row */}
          <div className="flex items-baseline justify-between pt-2 border-t border-[#01696f]/8 mt-1">
            <div>
              <span className="text-xl font-display font-bold text-[#1a1a18]">
                {formatCurrency(listing.price_per_day ?? 0)}
              </span>
              <span className="text-xs text-[#9b9b93] font-medium ml-1">/day</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
