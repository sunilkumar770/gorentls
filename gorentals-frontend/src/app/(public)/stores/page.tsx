'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, MapPin, Search, ShieldCheck, Package, X } from 'lucide-react';

const CITIES = ['All Cities','Hyderabad','Mumbai','Delhi','Bengaluru','Chennai','Pune','Kolkata','Ahmedabad'];

const MOCK_STORES = [
  { id:1, name:'Rahul Sharma', city:'Hyderabad', since:2022, rating:4.9, reviews:34, items:8,  tags:['Cameras','Drones'],     responseRate:'98%', avatar:'R' },
  { id:2, name:'Priya Kapoor', city:'Bengaluru', since:2021, rating:4.7, reviews:21, items:5,  tags:['Laptops','Electronics'], responseRate:'95%', avatar:'P' },
  { id:3, name:'Aarav Mehta',  city:'Mumbai',    since:2023, rating:5.0, reviews:12, items:3,  tags:['Cameras','Audio'],       responseRate:'100%',avatar:'A' },
  { id:4, name:'Sneha Trivedi',city:'Chennai',   since:2022, rating:4.8, reviews:18, items:6,  tags:['Audio','Gaming'],        responseRate:'97%', avatar:'S' },
  { id:5, name:'Kiran Reddy',  city:'Pune',      since:2021, rating:4.6, reviews:29, items:12, tags:['Tools','Camping'],       responseRate:'92%', avatar:'K' },
  { id:6, name:'Anita Patel',  city:'Delhi',     since:2023, rating:4.5, reviews:15, items:4,  tags:['Camping','Sports'],      responseRate:'96%', avatar:'A' },
  { id:7, name:'Dev Joshi',    city:'Hyderabad', since:2022, rating:4.8, reviews:41, items:7,  tags:['Gaming','Electronics'],  responseRate:'99%', avatar:'D' },
  { id:8, name:'Vijay Nair',   city:'Bengaluru', since:2020, rating:4.4, reviews:9,  items:2,  tags:['Vehicles'],              responseRate:'90%', avatar:'V' },
];

const AVATAR_COLORS = ['bg-[#4F46E5]','bg-indigo-700','bg-amber-600','bg-rose-600','bg-cyan-600','bg-violet-600'];

export default function StoresPage() {
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [search, setSearch] = useState('');

  const filtered = MOCK_STORES.filter(s => {
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
        <p className="text-sm text-faint font-medium mb-6">{filtered.length} owner{filtered.length!==1?'s':''} found</p>

        {filtered.length === 0 ? (
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
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-[#4F46E5] text-xs font-bold rounded-full flex-shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5" />KYC Verified
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted mt-1">
                      <MapPin className="w-3.5 h-3.5" />{store.city}
                    </div>
                    <p className="text-xs text-faint mt-0.5">Member since {store.since}</p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {store.tags.map(t => (
                    <span key={t} className="px-2.5 py-1 bg-subtle text-muted text-xs font-semibold rounded-xl">{t}</span>
                  ))}
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

                <Link href={`/stores/${store.id}`}
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
