'use client';

import { useState, useEffect } from 'react';
import { getListings } from '@/services/listings';
import type { Listing } from '@/types';
import { MapPin, Search, Package, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Input } from '@/components/ui/Input';

// Removed "Testville" — only real Indian cities
const CITIES = ['All Cities', 'Hyderabad', 'Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];

export default function StoresPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    getListings({ city: selectedCity === 'All Cities' ? undefined : selectedCity })
      .then((data: any) => setListings(Array.isArray(data) ? data : data.content ?? []))
      .finally(() => setLoading(false));
  }, [selectedCity]);

  const filtered = listings.filter(l =>
    search ? l.stores?.store_name?.toLowerCase().includes(search.toLowerCase()) || l.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  // Group by store/owner
  const storeMap = new Map<string, { name: string; city: string; listings: Listing[] }>();
  filtered.forEach(l => {
    const storeId = l.owner_id || 'unknown';
    if (!storeMap.has(storeId)) {
      storeMap.set(storeId, {
        name: l.stores?.store_name || 'Independent Owner',
        city: l.stores?.store_city || '',
        listings: [],
      });
    }
    storeMap.get(storeId)!.listings.push(l);
  });
  const stores = Array.from(storeMap.entries());

  return (
    <div className="min-h-screen bg-[var(--bg)] pt-10 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

        {/* Header */}
        <div className="mb-14 pb-10 border-b border-[var(--border)]">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--primary)] mb-3">Owner Stores</p>
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-[var(--text)] leading-[0.9] mb-4">
            Browse<br /><span className="text-[var(--primary)]">Owners.</span>
          </h1>
          <p className="text-lg text-[var(--text-muted)] font-medium max-w-lg">
            Explore verified owners and their curated collections near you.
          </p>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by owner or store name..."
            icon={<Search className="w-4 h-4" />}
            className="bg-[var(--bg-card)] shadow-sm"
          />
        </div>

        {/* City Chips */}
        <div className="flex flex-wrap gap-2 mb-10">
          {CITIES.map(city => (
            <button
              key={city}
              onClick={() => { setSelectedCity(city); }}
              className={`px-4 py-2 rounded-[var(--r-pill)] text-xs font-bold uppercase tracking-widest transition-all border ${
                selectedCity === city
                  ? 'gradient-teal text-white border-transparent shadow-card'
                  : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--text)]'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Store Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-[var(--bg-card)] rounded-[var(--r-xl)] animate-pulse border border-[var(--border)]" />
            ))}
          </div>
        ) : stores.length === 0 ? (
          <div className="bg-[var(--bg-card)] rounded-[var(--r-xl)] p-24 text-center shadow-card border border-[var(--border)] max-w-2xl mx-auto mt-10">
            <div className="w-20 h-20 bg-[var(--primary-light)] rounded-[var(--r-xl)] flex items-center justify-center mx-auto mb-6 transform rotate-3">
              <MapPin className="h-10 w-10 text-[var(--primary)]" strokeWidth={1.5} />
            </div>
            <h3 className="text-3xl font-display font-bold text-[var(--text)] mb-3">No Owners Discovered</h3>
            <p className="text-[var(--text-muted)] text-lg max-w-md mx-auto leading-relaxed">
              {selectedCity !== 'All Cities' 
                ? `We haven't launched verified owners in ${selectedCity} yet. Be the first to list!` 
                : "No owners match your current search. Try a broader term."}
            </p>
            {selectedCity !== 'All Cities' && (
              <Link href="/signup?role=OWNER">
                <button className="mt-8 px-8 py-3 gradient-teal text-white rounded-[var(--r-md)] font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-card">
                  Become an Owner
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {stores.map(([id, store]) => (
              <div key={id} className="bg-[var(--bg-card)] rounded-[var(--r-xl)] overflow-hidden shadow-card hover:shadow-card-hover border border-[var(--border)] group transition-all hover:-translate-y-1">
                {/* Store header */}
                <div className="p-6 border-b border-[var(--border)]">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 gradient-teal rounded-[var(--r-lg)] flex items-center justify-center text-white font-display font-bold text-lg shadow-card flex-shrink-0">
                      {store.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-display font-bold text-[var(--text)] leading-tight truncate">{store.name}</h3>
                      {store.city && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] mt-0.5">
                          <MapPin className="w-3 h-3 text-[var(--primary)]" />
                          {store.city}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-faint)] uppercase tracking-widest">
                    <Package className="w-3.5 h-3.5 text-[var(--primary)]" />
                    {store.listings.length} item{store.listings.length !== 1 ? 's' : ''} available
                    <span className="ml-auto flex items-center gap-1 text-[var(--primary)]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  </div>
                </div>

                {/* Listings preview */}
                <div className="p-4 space-y-2">
                  {store.listings.slice(0, 2).map(l => (
                    <Link key={l.id} href={`/item/${l.id}`}>
                      <div className="flex justify-between items-center py-2.5 px-3 bg-[var(--bg-subtle)] rounded-[var(--r-md)] hover:bg-[var(--primary-light)] transition-colors group/item">
                        <span className="text-sm font-semibold text-[var(--text)] truncate max-w-[60%]">{l.title}</span>
                        <span className="text-sm font-bold text-[var(--primary)] group-hover/item:font-extrabold">{formatCurrency(l.price_per_day ?? 0)}/day</span>
                      </div>
                    </Link>
                  ))}
                  {store.listings.length > 2 && (
                    <p className="text-center text-xs font-bold uppercase tracking-widest text-[var(--text-faint)] pt-1">
                      +{store.listings.length - 2} more items
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
