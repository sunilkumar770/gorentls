'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, ShieldCheck, CheckCircle2, Package, Zap, Calendar, AlertTriangle } from 'lucide-react';

const MOCK_STORE = {
  id:1, name:'Rahul Sharma', city:'Hyderabad', since:2022, avatar:'R',
  rating:4.9, reviews:34, items:8, rentals:87, responseRate:'98%',
  bio: 'Professional photographer and tech enthusiast based in Hyderabad. I rent out my personal camera gear and electronics — all maintained to the highest standard. Every item is cleaned, tested, and packed before handover. Happy to meet in person for pickup or arrange delivery within Hyderabad.',
  verifications: ['KYC Identity Verified','Email Verified','Phone Verified','Payment Method Verified'],
  categories: ['Cameras','Drones','Audio'],
  listings: [
    { id:1, title:'Sony A7 III Full-Frame Camera',    price:1200, rating:4.9, condition:'Like New', image:'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80' },
    { id:2, title:'DJI Mini 3 Pro Drone',              price:1800, rating:4.7, condition:'Good',     image:'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=600&q=80' },
    { id:3, title:'Rode VideoMic Pro+ Microphone',     price:450,  rating:4.8, condition:'Like New', image:'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&q=80' },
    { id:4, title:'Canon EOS R5 with 24-70mm Lens',    price:2200, rating:4.9, condition:'New',      image:'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&q=80' },
  ],
  reviewList: [
    { name:'Priya K.',  rating:5, date:'Apr 2025', text:'Excellent camera, Rahul was super helpful and pickup was smooth.' },
    { name:'Aarav M.',  rating:5, date:'Mar 2025', text:'Great experience! The gear was exactly as described and in perfect condition.' },
    { name:'Sneha T.',  rating:4, date:'Feb 2025', text:'Very professional owner. Would definitely rent again from Rahul.' },
  ],
};

const CONDITION_COLORS: Record<string,string> = { 'New':'bg-indigo-600 text-white','Like New':'bg-indigo-50 text-indigo-700','Good':'bg-amber-50 text-amber-700','Fair':'bg-subtle text-muted' };

export default function StoreDetailPage() {
  const store = MOCK_STORE;
  return (
    <div className="min-h-screen bg-subtle pb-24">
      {/* Hero */}
      <div className="bg-card py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-24 h-24 bg-[#4F46E5] rounded-3xl flex items-center justify-center text-white font-bold text-4xl flex-shrink-0">{store.avatar}</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-3xl font-bold text-text tracking-tight">{store.name}</h1>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-[#4F46E5] text-xs font-bold rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />KYC Verified
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted text-sm mb-3">
                <MapPin className="w-4 h-4" />{store.city} · Member since {store.since}
              </div>
              <div className="flex flex-wrap gap-2">
                {store.categories.map(c => <span key={c} className="px-3 py-1 bg-subtle text-muted text-xs font-semibold rounded-xl">{c}</span>)}
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 p-6 bg-subtle rounded-3xl">
            {[
              { label:'Active Items',   value:store.items       },
              { label:'Total Rentals',  value:store.rentals     },
              { label:'Avg Rating',     value:`${store.rating}★` },
              { label:'Response Rate',  value:store.responseRate },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-text">{s.value}</p>
                <p className="text-xs text-faint mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">
          {/* About */}
          <div className="bg-card rounded-3xl p-8">
            <h2 className="text-xl font-bold text-text mb-4">About this owner</h2>
            <p className="text-muted leading-relaxed">{store.bio}</p>
          </div>

          {/* Listings */}
          <div>
            <h2 className="text-xl font-bold text-text mb-5">Listed by {store.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {store.listings.map(item => (
                <Link key={item.id} href={`/listings/${item.id}`}
                  className="group bg-card rounded-3xl overflow-hidden hover:shadow-[0_20px_40px_rgb(0,0,0,0.07)] transition-all duration-300 hover:-translate-y-0.5">
                  <div className="relative aspect-video overflow-hidden">
                    <Image src={item.image} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="40vw" />
                    <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold ${CONDITION_COLORS[item.condition]}`}>{item.condition}</div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-text mb-2 line-clamp-1 group-hover:text-[#4F46E5] transition-colors">{item.title}</h3>
                    <div className="flex items-center justify-between">
                      <div><span className="text-xl font-bold text-text">₹{item.price.toLocaleString()}</span><span className="text-sm text-faint"> /day</span></div>
                      <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-amber-400 text-amber-400"/><span className="text-sm font-bold text-text">{item.rating}</span></div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-card rounded-3xl p-8">
            <h2 className="text-xl font-bold text-text mb-6">Reviews</h2>
            <div className="space-y-6">
              {store.reviewList.map((r,i) => (
                <div key={i} className={`pb-6 mb-4 ${i < store.reviewList.length - 1 ? 'bg-subtle -mx-8 px-8 py-6' : ''}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-[#4F46E5] font-bold text-sm">{r.name[0]}</div>
                    <div><p className="font-semibold text-text text-sm">{r.name}</p><p className="text-xs text-faint">{r.date}</p></div>
                    <div className="ml-auto flex gap-0.5">{[1,2,3,4,5].map(s=><Star key={s} className={`w-3.5 h-3.5 ${s<=r.rating?'fill-amber-400 text-amber-400':'text-slate-200'}`}/>)}</div>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Report link */}
          <div className="text-center">
            <button className="flex items-center gap-2 text-sm text-faint hover:text-red-500 transition-colors mx-auto">
              <AlertTriangle className="w-4 h-4" />Report this owner
            </button>
          </div>
        </div>

        {/* Right sidebar — Verification card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="bg-card rounded-3xl p-7">
              <h3 className="font-bold text-text mb-5">Verification</h3>
              <div className="space-y-3">
                {store.verifications.map(v => (
                  <div key={v} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#4F46E5] flex-shrink-0" />
                    <span className="text-sm font-medium text-text">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-3xl p-7">
              <h3 className="font-bold text-text mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted">Response rate</span><span className="font-semibold text-text">{store.responseRate}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted">Avg rating</span><span className="font-semibold text-text">{store.rating} ★</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted">Total reviews</span><span className="font-semibold text-text">{store.reviewList.length}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted">Active listings</span><span className="font-semibold text-text">{store.items}</span></div>
              </div>
            </div>

            <Link href="/search"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-2xl text-sm font-bold transition-colors">
              <Package className="w-4 h-4" />Browse All Listings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
