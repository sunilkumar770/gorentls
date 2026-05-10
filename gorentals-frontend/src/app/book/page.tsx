'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Calendar, Info, ShieldCheck, MapPin, CheckCircle2, Truck, Zap } from 'lucide-react';

const MOCK_ITEM = {
  id: 1,
  title: 'Sony A7 III Full-Frame Mirrorless Camera',
  owner: 'Rahul Sharma',
  location: 'Hyderabad, Telangana',
  condition: 'Like New',
  price: 1200,
  thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80',
};

const SHIPPING_OPTIONS = [
  { id: 'standard', name: 'Standard Delivery', time: '5-7 business days', price: 0 },
  { id: 'express', name: 'Express Shipping', time: '2-3 business days', price: 200 },
  { id: 'nextday', name: 'Next Day Delivery', time: '1 business day', price: 350 },
];

export default function BookPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [shipping, setShipping] = useState('standard');

  const days = startDate && endDate ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)) : 0;
  const subtotal = days * MOCK_ITEM.price;
  const shippingPrice = SHIPPING_OPTIONS.find(s => s.id === shipping)?.price || 0;
  const total = subtotal + shippingPrice;

  return (
    <div className="min-h-screen bg-subtle pb-20">
      {/* Header / Nav */}
      <div className="bg-card px-4 py-4 sticky top-0 z-50 shadow-sm shadow-slate-100/50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href={`/listings/${MOCK_ITEM.id}`} className="flex items-center gap-2 text-muted hover:text-text transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="font-semibold">Back to item</span>
          </Link>
          <h1 className="text-lg font-bold text-text">Booking Details</h1>
          <div className="w-10"></div> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Item Summary Card (Mobile visible, Desktop left) */}
            <div className="bg-card rounded-3xl p-6 flex gap-4 items-center shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-subtle flex-shrink-0">
                <Image src={MOCK_ITEM.thumbnail} alt={MOCK_ITEM.title} width={96} height={96} className="object-cover w-full h-full" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{MOCK_ITEM.condition}</span>
                </div>
                <h2 className="font-bold text-text line-clamp-1">{MOCK_ITEM.title}</h2>
                <div className="flex items-center gap-1.5 text-faint text-sm mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{MOCK_ITEM.location}</span>
                </div>
                <p className="text-xs text-muted mt-1">Rented by <span className="text-text font-semibold">{MOCK_ITEM.owner}</span></p>
              </div>
            </div>

            {/* Date Selection */}
            <div className="bg-card rounded-3xl p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-text">Select rental dates</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-faint uppercase tracking-widest ml-1">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-faint pointer-events-none" />
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={e => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full h-14 pl-12 pr-4 bg-subtle rounded-2xl text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all border-none" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-faint uppercase tracking-widest ml-1">End Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-faint pointer-events-none" />
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={e => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      className="w-full h-14 pl-12 pr-4 bg-subtle rounded-2xl text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all border-none" 
                    />
                  </div>
                </div>
              </div>

              {days > 0 && (
                <div className="p-4 bg-indigo-50 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Info className="w-5 h-5 text-indigo-600" />
                  <p className="text-sm font-medium text-indigo-900">You&apos;re renting this item for <span className="font-bold">{days} day{days > 1 ? 's' : ''}</span></p>
                </div>
              )}
            </div>

            {/* Shipping Options */}
            <div className="bg-card rounded-3xl p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-text">Shipping method</h3>
              </div>

              <div className="space-y-3">
                {SHIPPING_OPTIONS.map((opt) => (
                  <label key={opt.id} className={`group relative flex items-center justify-between p-5 rounded-2xl cursor-pointer transition-all ${shipping === opt.id ? 'bg-indigo-50 ring-2 ring-indigo-600/10' : 'bg-subtle hover:bg-subtle'}`}>
                    <input type="radio" name="shipping" value={opt.id} checked={shipping === opt.id} onChange={() => setShipping(opt.id)} className="sr-only" />
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${shipping === opt.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-card'}`}>
                        {shipping === opt.id && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <p className="font-bold text-text">{opt.name}</p>
                        <p className="text-xs text-muted">{opt.time}</p>
                      </div>
                    </div>
                    <p className="font-bold text-text">{opt.price === 0 ? 'FREE' : `₹${opt.price}`}</p>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 space-y-6">
              <div className="bg-card rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
                <h3 className="text-xl font-bold text-text mb-6">Price Details</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-muted font-medium">
                    <span>Rental rate (₹{MOCK_ITEM.price}/day)</span>
                    <span className="text-text">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted font-medium">
                    <span>Shipping fee</span>
                    <span className="text-text">{shippingPrice === 0 ? 'FREE' : `₹${shippingPrice}`}</span>
                  </div>
                  <div className="flex justify-between text-muted font-medium">
                    <span>Duration</span>
                    <span className="text-text">{days} day{days > 1 ? 's' : ''}</span>
                  </div>
                  
                  <div className="pt-6 mt-6 bg-subtle -mx-8 px-8 py-6 rounded-b-[2rem]">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs font-bold text-faint uppercase tracking-widest mb-1">Total amount</p>
                        <p className="text-3xl font-black text-text">₹{total.toLocaleString()}</p>
                      </div>
                      <Link href="/checkout" className={`h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-200 ${days === 0 ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                        <Zap className="w-5 h-5 fill-white" />
                        Proceed
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="bg-card rounded-3xl p-6 flex items-start gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-indigo-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-text">Protected Rental</h4>
                  <p className="text-xs text-muted leading-relaxed mt-1">Your payment is held securely in escrow until you receive and verify the item.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
