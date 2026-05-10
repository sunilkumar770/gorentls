'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ShieldCheck, MapPin, CreditCard, Wallet, CheckCircle2, Info, ArrowRight } from 'lucide-react';

const MOCK_ORDER = {
  item: {
    id: 1,
    title: 'Sony A7 III Full-Frame Mirrorless Camera',
    thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80',
    owner: 'Rahul Sharma',
    location: 'Hyderabad',
  },
  dates: {
    start: '2025-05-15',
    end: '2025-05-18',
    days: 3,
  },
  pricing: {
    rate: 1200,
    originalRate: 1500,
    subtotal: 3600,
    shipping: 200,
    deposit: 5000,
    discount: 450,
  }
};

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const order = MOCK_ORDER;
  const total = order.pricing.subtotal + order.pricing.shipping + order.pricing.deposit - order.pricing.discount;

  return (
    <div className="min-h-screen bg-subtle pb-20">
      {/* Navigation */}
      <div className="bg-card px-4 py-4 sticky top-0 z-50 shadow-sm shadow-slate-100/50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/book" className="flex items-center gap-2 text-muted hover:text-text transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="font-semibold">Review booking</span>
          </Link>
          <h1 className="text-lg font-bold text-text">Checkout</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Main Content */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Order Summary Section */}
            <div className="bg-card rounded-[2rem] p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
              <h3 className="text-xl font-bold text-text mb-6">Order Summary</h3>
              
              <div className="flex gap-5 pb-8 mb-6 bg-subtle -mx-8 px-8 py-6 rounded-t-[2rem]">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-subtle flex-shrink-0">
                  <Image src={order.item.thumbnail} alt={order.item.title} width={96} height={96} className="object-cover w-full h-full" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-text leading-tight mb-1">{order.item.title}</h4>
                  <div className="flex items-center gap-1.5 text-faint text-sm mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{order.item.location}</span>
                  </div>
                  <p className="text-xs text-muted">Owner: <span className="text-text font-semibold">{order.item.owner}</span></p>
                </div>
              </div>

              <div className="pt-6 grid grid-cols-2 gap-4">
                <div className="p-4 bg-subtle rounded-2xl">
                  <p className="text-[10px] font-bold text-faint uppercase tracking-widest mb-1">Rental Period</p>
                  <p className="text-sm font-bold text-text">{order.dates.days} Days</p>
                </div>
                <div className="p-4 bg-subtle rounded-2xl">
                  <p className="text-[10px] font-bold text-faint uppercase tracking-widest mb-1">Dates</p>
                  <p className="text-sm font-bold text-text">May 15 - May 18</p>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-card rounded-[2rem] p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
              <h3 className="text-xl font-bold text-text mb-6">Payment Method</h3>
              
              <div className="space-y-4">
                <button 
                  onClick={() => setPaymentMethod('phonepe')}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all border-2 ${paymentMethod === 'phonepe' ? 'border-indigo-600 bg-indigo-50/30' : 'border-border bg-subtle hover:bg-subtle'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-text">PhonePe / UPI</p>
                      <p className="text-xs text-muted">Pay using UPI, Wallets or Cards</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'phonepe' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                    {paymentMethod === 'phonepe' && <div className="w-2 h-2 bg-card rounded-full" />}
                  </div>
                </button>

                <button 
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all border-2 ${paymentMethod === 'razorpay' ? 'border-indigo-600 bg-indigo-50/30' : 'border-border bg-subtle hover:bg-subtle'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-text">Razorpay</p>
                      <p className="text-xs text-muted">Safe & Secure Credit/Debit Card payments</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'razorpay' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                    {paymentMethod === 'razorpay' && <div className="w-2 h-2 bg-card rounded-full" />}
                  </div>
                </button>
              </div>
            </div>

          </div>

          {/* Sidebar / Total */}
          <div className="md:col-span-5">
            <div className="sticky top-28 space-y-6">
              <div className="bg-card rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
                <h3 className="text-xl font-bold text-text mb-6">Price Breakdown</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-muted font-medium">
                    <span>Daily rate</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs line-through text-slate-300">₹{order.pricing.originalRate}</span>
                      <span className="text-text font-bold">₹{order.pricing.rate}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-muted font-medium">
                    <span>Subtotal ({order.dates.days} days)</span>
                    <span className="text-text">₹{order.pricing.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted font-medium">
                    <span>Shipping</span>
                    <span className="text-text">₹{order.pricing.shipping.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50/50 p-3 rounded-xl">
                    <span>Special Discount</span>
                    <span>-₹{order.pricing.discount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted font-medium pb-6 mb-4 bg-subtle -mx-8 px-8 py-6">
                    <span className="flex items-center gap-1.5">
                      Refundable Deposit
                      <Info className="w-3.5 h-3.5 text-slate-300" />
                    </span>
                    <span className="text-text font-bold">₹{order.pricing.deposit.toLocaleString()}</span>
                  </div>
                  
                  <div className="pt-4">
                    <div className="flex justify-between items-end mb-8">
                      <div>
                        <p className="text-xs font-bold text-faint uppercase tracking-widest mb-1">Final Total</p>
                        <p className="text-4xl font-black text-[#4F46E5]">₹{total.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <button className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 group">
                      Confirm & Pay
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-center text-[10px] text-faint mt-4 px-4 uppercase tracking-wider font-bold">
                      By clicking you agree to GoRentals Terms & Privacy Policy
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 flex items-start gap-4">
                <div className="w-10 h-10 bg-card/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Escrow Protection Active</h4>
                  <p className="text-[11px] text-white/70 leading-relaxed mt-1">Your funds are safe. We only release payment to the owner after you confirm the item&apos;s arrival and quality.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
