import Link from 'next/link';
import Image from 'next/image';
import type { Listing } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Star, MapPin } from 'lucide-react';
import { Badge } from '../ui/Badge';

export function ListingCard({ listing }: { listing: Listing }) {
  const primaryImage = listing.listing_images?.find((img) => img.is_primary)?.image_url 
    || listing.listing_images?.[0]?.image_url
    || '/placeholder-item.jpg';

  // Fallback to avoid breaking if stores relation is missing somehow
  const store = Array.isArray(listing.stores) ? listing.stores[0] : listing.stores;
  const storeCity = store?.store_city || 'Location unavailable';
  const rating = Number(listing.average_rating || 0);

  return (
    <Link href={`/item/${listing.id}`} className="group block focus:outline-none">
      <div className="bg-white border-transparent rounded-[1.5rem] p-1.5 shadow-ambient overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_48px_rgba(37,25,19,0.12)]">
        
        {/* Image Container: Inset Frame within Frame */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#fff8f6] rounded-[1.25rem]">
          <Image
            src={primaryImage}
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Status Overlay */}
          <div className="absolute top-4 left-4">
            {listing.condition === 'like_new' && (
              <div className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-[#251913] shadow-sm">
                Pristine
              </div>
            )}
          </div>
          
          {/* Gradient Overlay for legibility if needed */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-3">
          <div className="flex justify-between items-start gap-3">
            <h3 className="font-display text-lg font-black text-[#251913] leading-tight line-clamp-2 group-hover:text-[#f97316] transition-colors">
              {listing.title}
            </h3>
          </div>
          
          <div className="flex items-center text-xs text-[#8c7164] gap-1.5 font-bold uppercase tracking-wider">
            <MapPin className="h-3 w-3 text-[#f97316]" />
            <span className="line-clamp-1">{storeCity}</span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-display font-black text-[#251913]">
                {formatCurrency(listing.price_per_day)}
              </span>
              <span className="text-[10px] text-[#8c7164] font-black uppercase tracking-tighter">/ Day</span>
            </div>
            
            {rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-[#f97316] text-[#f97316]" />
                <span className="text-sm font-black text-[#251913]">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
