"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { signUp, buildProfile } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Camera } from 'lucide-react';

import Image from 'next/image';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'RENTER' | 'OWNER'>('RENTER');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await signUp(email, password, name, phone, userType);
      
      if (error || !data) {
        throw new Error(error || 'Failed to create account');
      }

      const profile = buildProfile(data);
      login(data.accessToken, profile);

      toast.success('Your identity has been established.');
      
      // Role-based redirection
      if (userType === 'OWNER') {
        router.push('/owner/dashboard');
      } else {
        router.push('/');
      }
      
      router.refresh();
      
    } catch (err: any) {
      toast.error(err.message || 'Creation failure');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    toast('Google Authentication Coming Soon', {
      icon: '🚀',
      style: {
        borderRadius: '10px',
        background: '#251913',
        color: '#fff',
      },
    });
  };

  return (
    <div className="flex min-h-screen bg-[#fff8f6]">
      {/* Left Form Section: The Registration Portal */}
      <div className="w-full lg:w-[540px] flex flex-col justify-center px-10 sm:px-20 bg-white shadow-2xl z-10 relative">
        <Link href="/" className="flex items-center gap-2 mb-12 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-display font-black tracking-tighter text-[#251913]">
            GoRentals
          </span>
        </Link>

        <div className="max-w-md w-full mx-auto lg:mx-0">
          <h1 className="text-4xl md:text-5xl font-display font-black text-[#251913] mb-3 tracking-tighter">
            {userType === 'OWNER' ? 'Monetize your' : 'Join the'}<br/>
            <span className="text-[#f97316]">{userType === 'OWNER' ? 'Masterpieces.' : 'Circle.'}</span>
          </h1>
          <p className="text-[#8c7164] mb-10 font-medium text-lg leading-tight tracking-tight">
            {userType === 'OWNER' 
              ? 'Establish your store to access the global rental archive.' 
              : 'Establish your identity to access the global archive.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#8c7164]">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-5 py-3.5 bg-[#fff8f6] border border-transparent rounded-[1rem] focus:ring-2 focus:ring-[#f97316] focus:bg-white transition-all text-[#251913] font-bold outline-none placeholder-[#8c7164]/30"
                placeholder="Collector Name"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#8c7164]">Identifier/Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 bg-[#fff8f6] border border-transparent rounded-[1rem] focus:ring-2 focus:ring-[#f97316] focus:bg-white transition-all text-[#251913] font-bold outline-none placeholder-[#8c7164]/30"
                placeholder="you@archive.com"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#8c7164]">Phone Contact</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-5 py-3.5 bg-[#fff8f6] border border-transparent rounded-[1rem] focus:ring-2 focus:ring-[#f97316] focus:bg-white transition-all text-[#251913] font-bold outline-none placeholder-[#8c7164]/30"
                placeholder="+1 ••• ••• ••••"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#8c7164]">Secret Key/Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-[#fff8f6] border border-transparent rounded-[1rem] focus:ring-2 focus:ring-[#f97316] focus:bg-white transition-all text-[#251913] font-bold outline-none"
                placeholder="••••••••"
                minLength={8}
              />
              <p className="text-[10px] text-[#8c7164] font-bold uppercase tracking-widest opacity-50">Entropy: 8+ Characters required</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#8c7164]">Identity Purpose</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('RENTER')}
                  className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    userType === 'RENTER' 
                    ? 'bg-[#251913] text-white shadow-lg' 
                    : 'bg-[#fff8f6] text-[#8c7164] hover:bg-[#251913]/5'
                  }`}
                >
                  Renter
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('OWNER')}
                  className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    userType === 'OWNER' 
                    ? 'bg-[#251913] text-white shadow-lg' 
                    : 'bg-[#fff8f6] text-[#8c7164] hover:bg-[#251913]/5'
                  }`}
                >
                  Owner
                </button>
              </div>
              <p className="text-[10px] text-[#8c7164] font-bold uppercase tracking-widest opacity-50">
                {userType === 'OWNER' ? 'Establish a store and list inventory.' : 'Browse and rent professional gear.'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="gradient-signature w-full h-16 text-white rounded-[1.25rem] font-display font-black text-xl shadow-ambient transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 mt-4"
            >
              {loading ? 'Processing...' : 'Establish Identity'}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#8c7164]/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-white px-4 text-[#8c7164] font-bold opacity-30">OR</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignup}
              className="w-full h-14 bg-white border border-[#e5e7eb] text-[#251913] rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all hover:bg-[#f9fafb] active:scale-95"
            >
              <Image src="https://www.svgrepo.com/show/475656/google-color.svg" width={20} height={20} alt="Google" />
              Identify with Google
            </button>
          </form>

          <div className="mt-10 text-center lg:text-left pb-10">
            <p className="text-[#8c7164] font-medium">
              Already identified?{' '}
              <Link href="/login" className="text-[#f97316] font-black hover:underline ml-1">
                Enter Archive
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Hero Section: The Aesthetic Backdrop */}
      <div className="hidden lg:flex flex-1 relative bg-[#fff8f6] overflow-hidden">
        {/* Soft Tonal Blurs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#fda77a]/15 rounded-full blur-[120px] -ml-32 -mt-32" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#ffdbca]/25 rounded-full blur-[100px] -mr-32 -mb-32" />

        <div className="relative z-10 w-full h-full flex items-center justify-center p-24">
          <div className="relative w-full h-full max-w-2xl">
             <div className="absolute inset-x-0 bottom-10 z-20 translate-y-1/4">
                <div className="bg-white/40 backdrop-blur-3xl p-12 rounded-[3.5rem] shadow-[0_48px_96px_rgba(37,25,19,0.2)] border border-white/20">
                   <h2 className="text-4xl font-display font-black text-[#251913] leading-[0.9] mb-5 tracking-tighter">
                      {userType === 'OWNER' ? 'Monetize your' : 'Borrow the'}<br/>
                      <span className="text-[#f97316]">{userType === 'OWNER' ? 'Masterpieces.' : 'Extraordinary.'}</span>
                   </h2>
                   <p className="text-lg text-[#584237] font-medium leading-relaxed tracking-tight">
                      {userType === 'OWNER' 
                        ? 'From high-end optics to rare tools, turn your professional inventory into a passive revenue stream.'
                        : 'Access the most exclusive marketplace for professional-grade gear and rare artifacts.'}
                   </p>
                   
                   <div className="flex gap-4 mt-8">
                      <div className="px-4 py-2 bg-[#251913] rounded-full text-white text-[10px] font-black uppercase tracking-widest">
                        {userType === 'OWNER' ? 'Global Reach' : 'Rare Archive'}
                      </div>
                      <div className="px-4 py-2 bg-white rounded-full text-[#251913] text-[10px] font-black uppercase tracking-widest shadow-sm">
                        Secured Payments
                      </div>
                   </div>
                </div>
             </div>
             
             <div className="relative h-full w-full rounded-[4rem] overflow-hidden shadow-2xl -rotate-2">
                <Image 
                   src={userType === 'OWNER' 
                     ? "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=2544&auto=format&fit=crop"
                     : "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2671&auto=format&fit=crop"} 
                   alt="Professional Gear" 
                   fill 
                   className="object-cover transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#251913]/10 to-[#251913]/40" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
