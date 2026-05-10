'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, ShieldCheck, Calendar, ChevronLeft, ChevronRight, Package, Zap, CheckCircle2 } from 'lucide-react';

const MOCK_LISTING = {
  id: 1, title: 'Sony A7 III Full-Frame Mirrorless Camera', category: 'Cameras', condition: 'Like New',
  price: 1200, deposit: 5000, rating: 4.9, reviews: 34, city: 'Hyderabad',
  description: 'The Sony A7 III is a full-frame mirrorless camera offering outstanding image quality, impressive autofocus, and 4K video. Perfect for professional shoots, events, or travel. Comes with 28-70mm kit lens, 2 batteries, charger, and camera bag. Ideal for photographers who need a high-end camera without the purchase price.',
  specs: [{ label:'Condition', value:'Like New' }, { label:'Deposit', value:'₹5,000 refundable' }, { label:'Category', value:'Cameras' }, { label:'Location', value:'Hyderabad, Telangana' }],
  images: [
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=900&q=85',
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&q=80',
    'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=600&q=80',
    'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&q=80',
    'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=600&q=80',
  ],
  owner: { name:'Rahul Sharma', since: 2022, rating: 4.9, rentals: 87, avatar:'R', city:'Hyderabad', responseRate:'98%' },
  reviewList: [
    { name:'Priya K.', rating:5, date:'Apr 2025', text:'Excellent condition camera, Rahul was very helpful. Pickup was smooth and gear was exactly as described.' },
    { name:'Aarav M.', rating:5, date:'Mar 2025', text:'Great experience! The Sony A7III delivered stunning results for our wedding shoot.' },
    { name:'Sneha T.', rating:4, date:'Feb 2025', text:'Very good overall. Minor wear on the strap but camera itself is pristine. Would rent again.' },
  ],
};

const CONDITION_COLORS: Record<string,string> = { 'New':'bg-indigo-600 text-white', 'Like New':'bg-indigo-50 text-indigo-700', 'Good':'bg-amber-50 text-amber-700', 'Fair':'bg-subtle text-muted' };

export default function ListingDetailPage() {
  const [activeImg, setActiveImg] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const item = MOCK_LISTING;

  const days = startDate && endDate ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)) : 1;
  const total = days * item.price;

  return (
    <div className="min-h-screen bg-subtle pb-24">
      {/* Breadcrumb */}
      <div className="bg-card px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-faint">
          <Link href="/" className="hover:text-[#4F46E5]">Home</Link>
          <span>/</span>
          <Link href="/search" className="hover:text-[#4F46E5]">Browse</Link>
          <span>/</span>
          <span className="text-text font-medium">{item.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ── Left: Images + Details ─────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Image Carousel */}
            <div className="space-y-3">
              <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-subtle">
                <Image src={item.images[activeImg]} alt={item.title} fill className="object-cover" sizes="70vw" priority />
                <button onClick={() => setActiveImg(i => (i-1+item.images.length)%item.images.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-card/90 rounded-full flex items-center justify-center shadow-md hover:bg-card transition-colors">
                  <ChevronLeft className="w-5 h-5 text-text" />
                </button>
                <button onClick={() => setActiveImg(i => (i+1)%item.images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-card/90 rounded-full flex items-center justify-center shadow-md hover:bg-card transition-colors">
                  <ChevronRight className="w-5 h-5 text-text" />
                </button>
                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold ${CONDITION_COLORS[item.condition]}`}>{item.condition}</div>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {item.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden transition-all ${activeImg===i ? 'ring-2 ring-[#4F46E5] ring-offset-2' : 'opacity-60 hover:opacity-100'}`}>
                    <Image src={img} alt="" width={80} height={56} className="object-cover w-full h-full" />
                  </button>
                ))}
              </div>
            </div>

            {/* Title + Meta */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-indigo-50 text-[#4F46E5] text-xs font-bold rounded-full">{item.category}</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-bold text-text">{item.rating}</span>
                  <span className="text-sm text-faint">({item.reviews} reviews)</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-text mb-4 tracking-tight">{item.title}</h1>
              <div className="flex items-center gap-2 text-muted text-sm">
                <MapPin className="w-4 h-4" /><span>{item.city}</span>
              </div>
            </div>

            {/* Owner row */}
            <div className="flex items-center gap-4 p-5 bg-card rounded-2xl">
              <div className="w-14 h-14 bg-[#4F46E5] rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">{item.owner.avatar}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-text">{item.owner.name}</p>
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-[#4F46E5] text-xs font-bold rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />KYC Verified
                  </span>
                </div>
                <p className="text-sm text-muted">{item.owner.rentals} rentals · Member since {item.owner.since}</p>
              </div>
              <Link href="/stores/1" className="text-sm font-semibold text-[#4F46E5] hover:underline">View Store</Link>
            </div>

            {/* Description */}
            <div className="bg-card rounded-3xl p-8">
              <h2 className="text-xl font-bold text-text mb-4">About this item</h2>
              <p className="text-muted leading-relaxed">{item.description}</p>
            </div>

            {/* Specs grid */}
            <div className="bg-card rounded-3xl p-8">
              <h2 className="text-xl font-bold text-text mb-6">Details</h2>
              <div className="grid grid-cols-2 gap-4">
                {item.specs.map(s => (
                  <div key={s.label} className="p-4 bg-subtle rounded-2xl">
                    <p className="text-xs font-bold text-faint uppercase tracking-widest mb-1">{s.label}</p>
                    <p className="font-semibold text-text">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-card rounded-3xl p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="text-center">
                  <p className="text-5xl font-bold text-text">{item.rating}</p>
                  <div className="flex gap-0.5 justify-center mt-1">
                    {[1,2,3,4,5].map(i=><Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400"/>)}
                  </div>
                  <p className="text-sm text-faint mt-1">{item.reviews} reviews</p>
                </div>
              </div>
              <div className="space-y-6">
                {item.reviewList.map((r,i) => (
                  <div key={i} className={`pb-6 mb-4 ${i < item.reviewList.length - 1 ? 'bg-subtle -mx-8 px-8 py-6' : ''}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-[#4F46E5] font-bold text-sm">{r.name[0]}</div>
                      <div>
                        <p className="font-semibold text-text text-sm">{r.name}</p>
                        <p className="text-xs text-faint">{r.date}</p>
                      </div>
                      <div className="ml-auto flex gap-0.5">
                        {[1,2,3,4,5].map(s=><Star key={s} className={`w-3.5 h-3.5 ${s<=r.rating?'fill-amber-400 text-amber-400':'text-slate-200'}`}/>)}
                      </div>
                    </div>
                    <p className="text-sm text-muted leading-relaxed">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Booking Widget ──────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.08)] space-y-6">
              <div>
                <span className="text-4xl font-bold text-text">₹{item.price.toLocaleString()}</span>
                <span className="text-faint font-medium"> / day</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-faint uppercase tracking-widest">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                    <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                      className="w-full h-12 pl-11 pr-4 bg-subtle rounded-2xl text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-faint uppercase tracking-widest">End Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                    <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} min={startDate || new Date().toISOString().split('T')[0]}
                      className="w-full h-12 pl-11 pr-4 bg-subtle rounded-2xl text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all" />
                  </div>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="space-y-2 pt-6 bg-subtle -mx-7 px-7 py-6">
                <div className="flex justify-between text-sm text-muted">
                  <span>₹{item.price.toLocaleString()} × {days} day{days>1?'s':''}</span>
                  <span>₹{(days*item.price).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-muted">
                  <span>Service fee (10%)</span>
                  <span>₹{Math.round(total*0.1).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-text pt-6 mt-4 border-t-2 border-indigo-50">
                  <span>Total</span>
                  <span>₹{Math.round(total*1.1).toLocaleString()}</span>
                </div>
              </div>

              <button className="w-full h-13 py-3.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-2xl font-bold text-base transition-colors flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" />Book Now
              </button>
              <p className="text-xs text-center text-faint">You won&apos;t be charged until owner confirms</p>

              {/* Deposit note */}
              <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-2xl">
                <ShieldCheck className="w-5 h-5 text-[#4F46E5] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-800 leading-relaxed">
                  <strong>₹{item.deposit.toLocaleString()} deposit</strong> held in escrow — refunded within 48h after return.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
