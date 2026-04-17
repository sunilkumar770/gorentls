"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { signIn, adminSignIn, buildProfile } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Camera } from 'lucide-react';
import Image from 'next/image';
import { Suspense } from 'react';

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'RENTER' | 'OWNER' | 'ADMIN'>('RENTER');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  
  const redirectTo = searchParams.get('redirect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (userType === 'ADMIN') {
        const { data, error } = await adminSignIn(email, password);
        if (error || !data) {
          throw new Error(error || 'Admin identity verification failed');
        }
        
        const profile = buildProfile(data);
        login(data.accessToken, profile);
        
        toast.success(`Welcome back, ${profile.fullName}`);
        router.replace('/admin');

      } else {
        const { data, error } = await signIn(email, password);
        if (error || !data) {
          throw new Error(error || 'Identity verification failed');
        }

        const profile = buildProfile(data);
        login(data.accessToken, profile);

        toast.success('Welcome back to the collection.');
        
        const role = profile.role.toUpperCase();
        const dest = role === 'OWNER' 
          ? '/owner/dashboard' 
          : redirectTo ?? '/dashboard';
          
        router.replace(dest);
      }
      
      router.refresh();
      
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
      console.error('[login] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
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
      {/* Left Form Section: The Portal */}
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
            Welcome <br/><span className="text-[#f97316]">Home.</span>
          </h1>
          <p className="text-[#8c7164] mb-8 font-medium text-lg leading-tight tracking-tight">Access your curated collection and active rentals.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#8c7164]">Identifer/Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 bg-[#fff8f6] border border-transparent rounded-[1rem] focus:ring-2 focus:ring-[#f97316] focus:bg-white transition-all text-[#251913] font-bold text-lg outline-none placeholder-[#8c7164]/30"
                placeholder="collector@archive.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#8c7164]">Secret Key/Password</label>
                <Link href="#" className="text-xs font-black uppercase tracking-widest text-[#f97316] hover:underline">
                  Reset
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-[#fff8f6] border border-transparent rounded-[1rem] focus:ring-2 focus:ring-[#f97316] focus:bg-white transition-all text-[#251913] font-bold text-lg outline-none"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#8c7164]">Identifying As</label>
              <div className="grid grid-cols-3 gap-2">
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
                <button
                  type="button"
                  onClick={() => setUserType('ADMIN')}
                  className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    userType === 'ADMIN' 
                    ? 'bg-[#251913] text-white shadow-lg' 
                    : 'bg-[#fff8f6] text-[#8c7164] hover:bg-[#251913]/5'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="gradient-signature w-full h-16 text-white rounded-[1.25rem] font-display font-black text-xl shadow-ambient transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 mt-4"
            >
              {loading ? 'Verifying Identity...' : 'Identify & Enter'}
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
              onClick={handleGoogleLogin}
              className="w-full h-14 bg-white border border-[#e5e7eb] text-[#251913] rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all hover:bg-[#f9fafb] active:scale-95"
            >
              <Image src="https://www.svgrepo.com/show/475656/google-color.svg" width={20} height={20} alt="Google" />
              Identify with Google
            </button>
          </form>

          <div className="mt-12 text-center lg:text-left">
            <p className="text-[#8c7164] font-medium">
              New to the Archive?{' '}
              <Link href="/signup" className="text-[#f97316] font-black hover:underline ml-1">
                Establish Identity
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Hero Section: The Aesthetic Backdrop */}
      <div className="hidden lg:flex flex-1 relative bg-[#fff8f6] overflow-hidden">
        {/* Soft Tonal Blurs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#fda77a]/10 rounded-full blur-[120px] -mr-32 -mt-32 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#ffdbca]/20 rounded-full blur-[100px] -ml-32 -mb-32" />

        <div className="relative z-10 w-full h-full flex items-center justify-center p-20">
          <div className="relative w-full h-full max-w-2xl">
             <div className="absolute inset-x-0 -top-20 z-20">
                <div className="bg-white/40 backdrop-blur-2xl p-10 rounded-[3rem] shadow-ambient ring-1 ring-white/50 border border-white/20 scale-110">
                   <h2 className="text-4xl font-display font-black text-[#251913] leading-none mb-4">
                      Rent the <br/><span className="text-[#f97316]">Extraordinary.</span>
                   </h2>
                   <p className="text-xl text-[#584237] font-medium leading-relaxed tracking-tight">
                      Join the most exclusive marketplace for professional-grade gear and rare artifacts.
                   </p>
                </div>
             </div>
             
             <div className="relative h-full w-full rounded-[4rem] overflow-hidden shadow-2xl rotate-3">
                <Image 
                   src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2671&auto=format&fit=crop" 
                   alt="Editorial Gear" 
                   fill 
                   className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#251913]/40 via-transparent to-transparent" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fff8f6] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#f97316]/20 border-t-[#f97316] animate-spin" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
