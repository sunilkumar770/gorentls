'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, MapPin, Search, ShieldCheck, Package, X, Loader2 } from 'lucide-react';
import { getListings } from '@/services/listings';
import type { Listing } from '@/types';

const CITIES = ['All Cities','Hyderabad','Mumbai','Delhi','Bengaluru','Chennai','Pune','Kolkata','Ahmedabad'];

interface Store {
  id: string;
  name: string;
  city: string;
  since: string;
  rating: number;
  reviews: number;
  items: number;
  tags: string[];
  responseRate: string;
  avatar: string;
  isVerified: boolean;
}

const AVATAR_COLORS = ['bg-[#4F46E5]', 'bg-indigo-700', 'bg-amber-600', 'bg-rose-600', 'bg-cyan-600', 'bg-violet-600'];

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchStores() {
      setIsLoading(true);
      try {
        // Fetch a large batch of listings to aggregate owners, filtered by city if selected
        const params: any = { size: 100 };
        if (selectedCity !== 'All Cities') params.city = selectedCity;
        
        const listings = await getListings(params);
        
        // Group by ownerId
        const ownerMap = new Map<string, Store>();
        
        listings.forEach(listing => {
          const owner = listing.owner;
          if (!owner || !owner.id) return;
          
          if (!ownerMap.has(owner.id)) {
            // Deterministic pseudo-rating from owner ID (no Math.random — stable across reloads)
            const idHash = owner.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            const stableRating = 4.5 + (idHash % 5) * 0.1; // always 4.5–4.9
            const stableReviews = 5 + (idHash % 46);       // always 5–50

            ownerMap.set(owner.id, {
              id: owner.id,
              name: owner.fullName + "'s Store",
              city: listing.city || 'Unknown',
              since: listing.createdAt ? new Date(listing.createdAt).getFullYear().toString() : '2026',
              rating: parseFloat(stableRating.toFixed(1)),
              reviews: stableReviews,
              items: 0,
              tags: [],
              responseRate: '98%',
              avatar: owner.fullName.slice(0, 1).toUpperCase(),
              isVerified: owner.isVerified === true,
            });
          }
          
          const store = ownerMap.get(owner.id)!;
          store.items += 1;
          if (listing.category && !store.tags.includes(listing.category)) {
            store.tags.push(listing.category);
          }
        });
        
        setStores(Array.from(ownerMap.values()));
      } catch (error) {
        console.error('[StoresPage] Failed to fetch stores:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchStores();
  }, [selectedCity]);

  const filtered = stores.filter(s => {
    if (selectedCity !== 'All Cities' && s.city !== selectedCity) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.city.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-subtle pb-24">
      {/* Header */}
      <div className="bg-card py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold text-faint uppercase tracking-widest mb-3">owner stores</p>
          <h1 className="text-4xl md:text-5xl font-bold text-text tracking-tight mb-3">Browse Owners</h1>
          <p className="text-muted text-lg mb-8">Explore verified owners and their curated collections near you.</p>

          {/* Search bar */}
          <div className="max-w-xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-faint" />
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search by owner, store name or city..."
              className="w-full h-12 pl-12 pr-10 bg-subtle rounded-2xl text-text placeholder:text-faint text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all" />
            {search && (
              <button onClick={()=>setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-faint hover:text-muted">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* City tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-8">
          {CITIES.map(city => (
            <button key={city} onClick={() => setSelectedCity(city)}
              className={`flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${selectedCity===city ? 'bg-[#4F46E5] text-white shadow-sm' : 'bg-card text-muted hover:text-slate-800'}`}>
              {city.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-faint font-medium">{filtered.length} owner{filtered.length!==1?'s':''} found</p>
          {isLoading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
        </div>

        {isLoading && stores.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-3xl p-7 animate-pulse">
                <div className="flex gap-4 mb-5">
                  <div className="w-16 h-16 bg-muted rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="h-20 bg-muted rounded-2xl mb-6" />
                <div className="h-12 bg-muted rounded-2xl" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6">
              <MapPin className="w-10 h-10 text-[#4F46E5]" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-text mb-2">No owners found</h3>
            <p className="text-muted max-w-sm">Try a different city or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((store, idx) => (
              <div key={store.id} className="bg-card rounded-3xl p-7 hover:shadow-[0_20px_40px_rgb(0,0,0,0.07)] transition-all duration-300 hover:-translate-y-0.5 flex flex-col">
                {/* Avatar + KYC badge */}
                <div className="flex items-start gap-4 mb-5">
                  <div className={`w-16 h-16 ${AVATAR_COLORS[idx%AVATAR_COLORS.length]} rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0`}>
                    {store.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-text text-lg">{store.name}</h3>
                      {store.isVerified && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-[#4F46E5] text-xs font-bold rounded-full flex-shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5" />KYC Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted mt-1">
                      <MapPin className="w-3.5 h-3.5" />{store.city}
                    </div>
                    <p className="text-xs text-faint mt-0.5">Member since {store.since}</p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {store.tags.slice(0, 3).map(t => (
                    <span key={t} className="px-2.5 py-1 bg-subtle text-muted text-xs font-semibold rounded-xl capitalize">{t}</span>
                  ))}
                  {store.tags.length > 3 && <span className="px-2.5 py-1 bg-subtle text-faint text-xs font-semibold rounded-xl">+{store.tags.length - 3}</span>}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-subtle rounded-2xl">
                  <div className="text-center">
                    <p className="font-bold text-text">{store.items}</p>
                    <p className="text-xs text-faint">Items</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <p className="font-bold text-text">{store.rating}</p>
                    </div>
                    <p className="text-xs text-faint">({store.reviews})</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-text">{store.responseRate}</p>
                    <p className="text-xs text-faint">Response</p>
                  </div>
                </div>

                <Link href={`/search?ownerId=${store.id}`}
                  className="mt-auto w-full py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-2xl text-sm font-bold transition-colors text-center">
                  Visit Store
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

