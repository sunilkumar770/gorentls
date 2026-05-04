/* eslint-disable react-hooks/static-components */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Listing } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { MapPin, Camera, Gamepad2, Wrench, Tent, Music, Package, ArrowRight, Star, Bike, Laptop } from 'lucide-react';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

// ── Category icon map — teal palette only ─────────────────────
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  CAMERAS:     Camera,
  GAMING:      Gamepad2,
  TOOLS:       Wrench,
  CAMPING:     Tent,
  AUDIO:       Music,
  ELECTRONICS: Laptop,
  SPORTS:      Bike,
  LAPTOPS:     Laptop,
};

function getCategoryIcon(category?: string): React.ElementType {
  if (!category) return Package;
  return CATEGORY_ICONS[category.toUpperCase()] ?? Package;
}

function getCategoryLabel(category?: string): string {
  if (!category) return '';
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

export function ListingCard({ listing }: { listing: Listing }) {
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);

  const imgSrc = !imgError
    ? (listing.images?.[0] || listing.listing_images?.[0]?.image_url || null)
    : null;

  const city         = listing.stores?.store_city || null;
  const ownerName    = listing.stores?.store_name || null;
  const ownerInitial = ownerName ? ownerName.charAt(0).toUpperCase() : '?';
  const Icon = getCategoryIcon(listing.category);
  const categoryLabel = getCategoryLabel(listing.category);

  return (
    <Link
      href={`/item/${listing.id}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#01696f] focus-visible:ring-offset-2 rounded-2xl"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 border border-[#01696f]/8 ${
        hovered
          ? 'shadow-[0_8px_32px_rgba(1,105,111,0.14)] -translate-y-1 border-[#01696f]/20'
          : 'shadow-[0_2px_8px_rgba(1,105,111,0.06)]'
      }`}>

        {/* Image — 16:9 ratio */}
        <div className="relative aspect-video w-full overflow-hidden bg-[#f7f6f2]">
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
            /* Graceful placeholder */
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#f7f6f2]">
              <div className="w-14 h-14 bg-[#e6f4f4] rounded-2xl flex items-center justify-center">
                <Icon className="w-7 h-7 text-[#01696f]" strokeWidth={1.5} />
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

          {/* Category pill — with dark scrim for legibility on any image */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full bg-black/40 text-white backdrop-blur-sm border border-white/10">
              <Icon className="w-3 h-3" strokeWidth={2} />
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

          {/* Owner row */}
          {ownerName && (
            <div className="flex items-center gap-2">
              {/* Initials avatar */}
              <div className="w-5 h-5 rounded-full bg-[#01696f]/12 flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-bold text-[#01696f]">{ownerInitial}</span>
              </div>
              <span className="text-xs text-[#9b9b93] font-medium line-clamp-1">{ownerName}</span>
              {listing.owner?.kycStatus === 'APPROVED' && (
                <VerifiedBadge size="sm" />
              )}
            </div>
          )}

          {/* Rating row — "New listing" when no reviews */}
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
            <span className="text-[11px] font-medium text-[#9b9b93]">
              New listing
            </span>
          </div>

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
