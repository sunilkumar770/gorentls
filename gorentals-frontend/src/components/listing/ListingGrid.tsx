import { getListings } from '@/services/listings';
import { ListingCard } from './ListingCard';
import { ListingCardSkeleton } from '../ui/Skeleton';

import type { Listing } from '@/types';

interface ListingGridProps {
  filters?: {
    query?: string;
    category?: string;
    city?: string;
    sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating';
  };
}

export async function ListingGrid({ filters = {} }: ListingGridProps) {
  // Try/catch just in case supabase is not configured yet
  let listings: Listing[] = [];
  let error = null;
  
  try {
    listings = await getListings(filters);
  } catch (e) {
    error = e;
  }

  if (error) {
    return (
      <div className="p-8 text-center border border-red-200 bg-red-50 rounded-2xl">
        <p className="text-red-600 font-medium">Could not load listings. Ensure the backend is connected.</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="py-12 text-center border-2 border-orange-100 border-dashed rounded-3xl bg-[#fff8f6]">
        <h3 className="text-xl font-bold text-[#251913]">No listings found</h3>
        <p className="text-[#8c7164] mt-2 font-medium">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}

export function ListingGridLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}
