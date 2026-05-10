'use client';

import Link from 'next/link';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  Camera, 
  Edit3, 
  Calendar,
  Star,
  Package,
  Heart,
  ExternalLink
} from 'lucide-react';

const MOCK_PROFILE = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+91 98765 43210',
  city: 'Hyderabad',
  memberSince: 'March 2024',
  avatar: 'JD',
  type: 'Premium Renter',
  rentals: 15,
  wishlist: 8,
  reviews: 4,
  avgRating: 4.9,
  verifications: [
    { label: 'KYC Identity', status: 'Verified', date: 'Mar 12, 2024' },
    { label: 'Email Address', status: 'Verified', date: 'Mar 10, 2024' },
    { label: 'Phone Number', status: 'Verified', date: 'Mar 10, 2024' },
    { label: 'Payment Method', status: 'Verified', date: 'Apr 02, 2024' },
  ]
};

export default function ProfilePage() {
  const p = MOCK_PROFILE;

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header / Avatar Section */}
      <div className="bg-card rounded-[3rem] p-10 shadow-sm shadow-slate-100/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-32 -mt-32" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="relative group">
            <div className="w-32 h-32 bg-[#4F46E5] rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-indigo-100">
              {p.avatar}
            </div>
            <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-card border-4 border-border rounded-2xl flex items-center justify-center text-muted hover:text-[#4F46E5] transition-colors shadow-md">
              <Camera className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
              <h1 className="text-3xl font-black text-text tracking-tight">{p.name}</h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-[#4F46E5] text-xs font-bold rounded-full w-fit mx-auto md:mx-0">
                <ShieldCheck className="w-3.5 h-3.5" />{p.type}
              </span>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm text-muted mb-6">
              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{p.email}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{p.city}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />Joined {p.memberSince}</span>
            </div>
            <button className="inline-flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-colors">
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Trust & Verification */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xl font-bold text-text px-4">Trust & Safety</h2>
          <div className="bg-card rounded-[2.5rem] p-8 shadow-sm shadow-slate-100/50 space-y-6">
            {p.verifications.map((v) => (
              <div key={v.label} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#4F46E5]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-text">{v.label}</p>
                  <p className="text-[10px] text-faint uppercase tracking-widest font-bold">{v.status} · {v.date}</p>
                </div>
              </div>
            ))}
            
            <div className="pt-6 border-t-2 border-border">
              <div className="p-5 bg-subtle rounded-3xl flex items-center gap-4">
                <ShieldCheck className="w-8 h-8 text-[#4F46E5]" />
                <div>
                  <p className="text-xs font-bold text-text">Level 3 Trusted User</p>
                  <p className="text-[10px] text-faint leading-relaxed mt-0.5">High trust score allows for lower deposits on premium items.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Activity Summary */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-text px-4">Activity Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-card p-8 rounded-[2.5rem] shadow-sm shadow-slate-100/50 group hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
                <Package className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black text-text">{p.rentals}</p>
              <p className="text-sm font-bold text-faint uppercase tracking-widest mt-1">Total Rentals</p>
              <Link href="/dashboard/bookings" className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#4F46E5] hover:underline">
                View History <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-card p-8 rounded-[2.5rem] shadow-sm shadow-slate-100/50 group hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
                <Heart className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black text-text">{p.wishlist}</p>
              <p className="text-sm font-bold text-faint uppercase tracking-widest mt-1">Wishlist Items</p>
              <Link href="/search" className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#4F46E5] hover:underline">
                Browse More <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-card p-8 rounded-[2.5rem] shadow-sm shadow-slate-100/50 sm:col-span-2 flex items-center justify-between group hover:-translate-y-1 transition-transform">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-indigo-50 text-[#4F46E5] rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                  <Star className="w-6 h-6 fill-[#4F46E5]" />
                </div>
                <div>
                  <p className="text-3xl font-black text-text">{p.avgRating} <span className="text-lg text-slate-300">/ 5.0</span></p>
                  <p className="text-sm font-bold text-faint uppercase tracking-widest mt-1">Review Rating ({p.reviews} reviews)</p>
                </div>
              </div>
              <div className="hidden sm:flex gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-[#4F46E5] text-[#4F46E5]" />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
