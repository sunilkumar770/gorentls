"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { signIn, adminSignIn, buildProfile } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { Suspense } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        if (error || !data) throw new Error(error || 'Admin sign-in failed');
        const profile = buildProfile(data);
        login(data.accessToken, profile);
        toast.success(`Welcome back, ${profile.fullName}`);
        router.replace('/admin/dashboard');
      } else {
        const { data, error } = await signIn(email, password);
        if (error || !data) throw new Error(error || 'Sign-in failed');
        const profile = buildProfile(data);
        login(data.accessToken, profile);
        toast.success('Welcome back!');
        const role = profile.role.toUpperCase();
        const dest = role === 'OWNER' ? '/owner/dashboard' : (redirectTo ?? '/dashboard');
        router.replace(dest);
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Sign-in failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f7f6f2]">
      {/* Left — Form */}
      <div className="w-full lg:w-[520px] flex flex-col justify-center px-8 sm:px-16 bg-white shadow-[1px_0_0_rgba(1,105,111,0.08)] z-10 relative">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-12 group">
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"
            className="group-hover:scale-105 transition-transform" aria-hidden="true">
            <rect width="32" height="32" rx="9" fill="#01696f"/>
            <path d="M10 16.5C10 13.46 12.46 11 15.5 11C17.36 11 19.02 11.94 20 13.38L17.5 14.9C17.06 14.34 16.32 14 15.5 14C14.12 14 13 15.12 13 16.5C13 17.88 14.12 19 15.5 19H17V17.5H15.5V15.5H19.5V19C19.5 20.66 17.88 22 15.5 22C12.46 22 10 19.54 10 16.5Z" fill="white"/>
          </svg>
          <span className="text-2xl font-display font-bold text-[#1a1a18] tracking-tight">GoRentals</span>
        </Link>

        <div className="max-w-sm w-full mx-auto lg:mx-0">
          <h1 className="text-3xl font-display font-bold text-[#1a1a18] mb-2">
            Welcome back
          </h1>
          <p className="text-[#6b6b65] mb-8 leading-relaxed">
            Sign in to access your rentals and bookings.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#6b6b65] uppercase tracking-wider">
                Sign in as
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-[#f7f6f2] rounded-xl">
                {(['RENTER', 'OWNER', 'ADMIN'] as const).map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setUserType(role)}
                    className={`py-2.5 rounded-lg text-xs font-bold transition-all ${
                      userType === role
                        ? 'bg-white text-[#01696f] shadow-sm border border-[#01696f]/10'
                        : 'text-[#9b9b93] hover:text-[#6b6b65]'
                    }`}
                  >
                    {role.charAt(0) + role.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-[#1a1a18]">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9b9b93]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-[#f7f6f2] border border-transparent rounded-xl focus:ring-2 focus:ring-[#01696f] focus:bg-white transition-all text-[#1a1a18] outline-none placeholder-[#9b9b93] text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-[#1a1a18]">Password</label>
                <Link href="#" className="text-xs font-semibold text-[#01696f] hover:text-[#015a5f] transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9b9b93]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 bg-[#f7f6f2] border border-transparent rounded-xl focus:ring-2 focus:ring-[#01696f] focus:bg-white transition-all text-[#1a1a18] outline-none text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9b9b93] hover:text-[#6b6b65] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#01696f] text-white font-bold rounded-xl hover:bg-[#015a5f] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#eeeee9]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs text-[#9b9b93] font-medium">or continue with</span>
              </div>
            </div>

            {/* Google OAuth button */}
            <button
              type="button"
              onClick={() => toast('Google sign-in coming soon!', { icon: '🚀' })}
              className="w-full py-3.5 bg-white border border-[#eeeee9] text-[#1a1a18] rounded-xl font-semibold text-sm flex items-center justify-center gap-3 hover:bg-[#f7f6f2] transition-colors"
            >
              <Image src="https://www.svgrepo.com/show/475656/google-color.svg" width={18} height={18} alt="Google" />
              Continue with Google
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#6b6b65]">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold text-[#01696f] hover:text-[#015a5f] transition-colors">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>

      {/* Right — Visual panel */}
      <div className="hidden lg:flex flex-1 relative bg-[#01696f] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,_rgba(255,255,255,0.08)_0%,_transparent_60%)]" />
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-16 text-white text-center">
          <div className="relative w-full h-64 mb-10 rounded-3xl overflow-hidden shadow-2xl">
            <Image
              src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=700&q=80"
              alt="Camera gear"
              fill
              className="object-cover opacity-80"
              sizes="40vw"
              priority
            />
          </div>
          <h2 className="text-3xl font-display font-bold mb-4 leading-tight">
            Rent anything,<br />from trusted owners
          </h2>
          <p className="text-white/70 text-base leading-relaxed max-w-xs">
            Join thousands of renters and owners on GoRentals — Hyderabad&apos;s peer-to-peer rental marketplace.
          </p>
          {/* Trust badges */}
          <div className="flex items-center gap-6 mt-10">
            {[['500+', 'Owners'], ['2K+', 'Listings'], ['4.9★', 'Rating']].map(([val, lbl]) => (
              <div key={lbl} className="text-center">
                <p className="text-2xl font-display font-bold">{val}</p>
                <p className="text-xs text-white/60 mt-0.5">{lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f7f6f2] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#01696f]/20 border-t-[#01696f] animate-spin" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
