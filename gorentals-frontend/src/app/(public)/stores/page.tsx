'use client';

import { useState, useEffect } from 'react';
import { getListings } from '@/services/listings';
import type { Listing } from '@/types';
import { MapPin, Search, Package } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

const CITIES = ['All Cities', 'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Testville'];

export default function StoresPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getListings({ city: selectedCity === 'All Cities' ? undefined : selectedCity })
      .then(setListings)
      .finally(() => setLoading(false));
  }, [selectedCity]);

  const filtered = listings.filter(l =>
    search ? l.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  // Group by store/owner
  const storeMap = new Map<string, { name: string; city: string; listings: Listing[] }>();
  filtered.forEach(l => {
    const storeId = l.owner_id || 'unknown';
    if (!storeMap.has(storeId)) {
      storeMap.set(storeId, {
        name: (l.stores as any)?.store_name || 'Independent Collector',
        city: (l.stores as any)?.store_city || 'Unknown Location',
        listings: [],
      });
    }
    storeMap.get(storeId)!.listings.push(l);
  });
  const stores = Array.from(storeMap.entries());

  return (
    <div className="min-h-screen bg-[#fff8f6] pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

        {/* Header */}
        <div className="mb-16 border-b border-[#251913]/5 pb-12">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#f97316] mb-3">Browse</p>
          <h1 className="text-6xl md:text-8xl font-display font-black tracking-tighter text-[#251913] leading-[0.85] mb-4">
            The<br /><span className="text-[#f97316]">Archive.</span>
          </h1>
          <p className="text-xl text-[#8c7164] font-medium max-w-lg">
            Explore verified owners and their curated collections near you.
          </p>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7164]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by listing name..."
              className="w-full pl-12 pr-5 py-4 bg-white rounded-[1rem] border border-transparent ring-1 ring-[#f97316]/10 focus:ring-[#f97316] outline-none text-[#251913] font-bold placeholder-[#8c7164]/40 transition-all shadow-ambient"
            />
          </div>
        </div>

        {/* City Chips */}
        <div className="flex flex-wrap gap-3 mb-12">
          {CITIES.map(city => (
            <button
              key={city}
              onClick={() => { setSelectedCity(city); setLoading(true); }}
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                selectedCity === city
                  ? 'bg-[#251913] text-white shadow-ambient'
                  : 'bg-white text-[#8c7164] hover:bg-[#fff8f6] ring-1 ring-[#251913]/5 shadow-sm'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Store Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-64 bg-white rounded-[2rem] animate-pulse shadow-sm" />
            ))}
          </div>
        ) : stores.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-20 text-center shadow-ambient ring-1 ring-[#f97316]/5">
            <MapPin className="h-16 w-16 text-[#f97316]/20 mx-auto mb-6" />
            <h3 className="text-3xl font-display font-black text-[#251913] mb-2">No Collections Found</h3>
            <p className="text-[#8c7164] font-medium">Try a different city or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {stores.map(([id, store]) => (
              <div key={id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-ambient ring-1 ring-[#f97316]/5 group transition-all hover:-translate-y-2 hover:shadow-[0_32px_64px_rgba(37,25,19,0.12)]">
                {/* Store header */}
                <div className="p-8 border-b border-[#251913]/5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#f97316] to-[#ea580c] rounded-[1rem] flex items-center justify-center text-white font-display font-black text-xl shadow-lg">
                      {store.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-black text-[#251913] leading-tight">{store.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#8c7164] uppercase tracking-widest mt-1">
                        <MapPin className="w-3 h-3 text-[#f97316]" />
                        {store.city}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#8c7164] uppercase tracking-widest">
                    <Package className="w-3.5 h-3.5 text-[#f97316]" />
                    {store.listings.length} artifact{store.listings.length !== 1 ? 's' : ''} available
                  </div>
                </div>

                {/* Listings preview */}
                <div className="p-6 space-y-3">
                  {store.listings.slice(0, 2).map(l => (
                    <Link key={l.id} href={`/item/${l.id}`}>
                      <div className="flex justify-between items-center py-3 px-4 bg-[#fff8f6] rounded-[0.75rem] hover:bg-[#ffeae0] transition-colors">
                        <span className="text-sm font-bold text-[#251913] truncate max-w-[60%]">{l.title}</span>
                        <span className="text-sm font-black text-[#f97316]">{formatCurrency(l.price_per_day)}/d</span>
                      </div>
                    </Link>
                  ))}
                  {store.listings.length > 2 && (
                    <p className="text-center text-xs font-black uppercase tracking-widest text-[#8c7164] pt-2">
                      +{store.listings.length - 2} more artifacts
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
