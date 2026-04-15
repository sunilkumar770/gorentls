'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useWishlist } from '@/hooks/useWishlist';
import { WishlistButton } from '@/components/listing/WishlistButton';
import { MapPin, Heart, Package } from 'lucide-react';
import type { Listing } from '@/types';

export default function WishlistPage() {
  const { wishlistIds, count } = useWishlist();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (wishlistIds.length === 0) { setListings([]); return; }
    setLoading(true);

    // Fetch each listing in parallel — replace with a batch endpoint if you add one
    Promise.allSettled(
      wishlistIds.map(id => api.get<Listing>(`/listings/${id}`).then(r => r.data)),
    ).then(results => {
      setListings(
        results
          .filter((r): r is PromiseFulfilledResult<Listing> => r.status === 'fulfilled')
          .map(r => r.value),
      );
    }).finally(() => setLoading(false));
  }, [wishlistIds.join(',')]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Heart className="w-6 h-6 text-red-500 fill-current" />
          <h1 className="text-2xl font-bold text-gray-900">
            Saved Items
            {count > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">({count})</span>
            )}
          </h1>
        </div>

        {count === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-4">💔</div>
            <h3 className="font-semibold text-gray-800 mb-2">No saved items yet</h3>
            <p className="text-gray-400 text-sm mb-6">
              Tap the heart icon on any listing to save it here.
            </p>
            <Link href="/search"
                  className="inline-block px-6 py-2.5 bg-[#16a34a] text-white text-sm
                             font-semibold rounded-xl hover:bg-[#15803d] transition-colors">
              Browse Listings
            </Link>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: count }, (_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 animate-pulse">
                <div className="h-44 bg-gray-200 rounded-t-2xl" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map(listing => {
              const img = listing.listing_images?.find(i => i.is_primary)?.image_url
                        ?? listing.listing_images?.[0]?.image_url ?? null;
              return (
                <div key={listing.id} className="relative group">
                  <Link href={`/item/${listing.id}`}
                        className="block bg-white rounded-2xl overflow-hidden border border-gray-100
                                   shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <div className="relative h-44 bg-gray-100">
                      {img
                        ? <img src={img} alt={listing.title}
                               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-gray-200" />
                          </div>
                      }
                      <div className="absolute top-2 right-2">
                        <WishlistButton listingId={listing.id} />
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 truncate text-sm">{listing.title}</h3>
                      {listing.city && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />{listing.city}
                        </p>
                      )}
                      <p className="text-sm font-bold text-gray-900 mt-2">
                        ₹{(listing.price_per_day ?? listing.pricePerDay ?? 0).toLocaleString('en-IN')}
                        <span className="text-xs font-normal text-gray-400">/day</span>
                      </p>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
