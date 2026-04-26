"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { signIn, buildProfile } from '@/services/auth';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { LogoMark } from '@/components/ui/Logo';
import Image from 'next/image';

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<'RENTER' | 'OWNER'>('RENTER');
  const [loading, setLoading] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    setMounted(true);
    // Manually parse redirect param to avoid Suspense de-opt
    const params = new URLSearchParams(window.location.search);
    setRedirectTo(params.get('redirect'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        toast.error(error);
        return;
      }
      
      if (!data) throw new Error('Sign-in failed. Please check your credentials.');

      const profile = buildProfile(data);
      login(data.accessToken, profile);
      toast.success('Welcome back!');
      
      const role = profile.role.toUpperCase();
      const dest = role === 'OWNER' ? '/owner/dashboard' : (redirectTo ?? '/dashboard');
      router.replace(dest);
      router.refresh();
      
    } catch (err: any) {
      console.error('[Login] Client Error:', err);
      toast.error(err.message || 'Sign-in encountered an unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  const subtitles: Record<'RENTER' | 'OWNER', string> = {
    RENTER: 'Sign in to access your rentals and bookings.',
    OWNER: 'Sign in to manage your listings and incoming requests.',
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[var(--primary-light)] border-t-[var(--primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* Left — Form */}
      <div className="w-full lg:w-[520px] flex flex-col justify-center px-8 sm:px-16 bg-[var(--bg-card)] shadow-card z-10 relative">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-12 group focus:outline-none">
          <LogoMark size={36} className="group-hover:scale-105 transition-transform" />
          <span className="text-2xl font-display font-bold text-[var(--text)] tracking-tight">GoRentals</span>
        </Link>

        <div className="max-w-sm w-full mx-auto lg:mx-0">
          <h1 className="text-3xl font-display font-bold text-[var(--text)] mb-2">
            Welcome back
          </h1>
          <p className="text-[var(--text-muted)] mb-8 leading-relaxed text-sm">
            {subtitles[userType]}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector — Renter & Owner only */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Sign in as
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--bg)] rounded-xl">
                {(['RENTER', 'OWNER'] as const).map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setUserType(role)}
                    className={`py-2.5 rounded-lg text-xs font-bold transition-all ${
                      userType === role
                        ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-sm border border-[var(--border)]'
                        : 'text-[var(--text-faint)] hover:text-[var(--text-muted)]'
                    }`}
                  >
                    {role.charAt(0) + role.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Email address"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                icon={<Mail className="w-4 h-4" />}
              />

              <div className="space-y-1.5 relative">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-semibold text-[var(--text)]">Password</label>
                  <Link href="/forgot-password" className="text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={<Lock className="w-4 h-4" />}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-[38px] text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary CTA */}
            <Button
              type="submit"
              variant="gradient"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Sign in
            </Button>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[var(--bg-card)] px-4 text-xs text-[var(--text-faint)] font-medium">or continue with</span>
              </div>
            </div>

            {/* Google OAuth button — inline SVG to avoid broken img */}
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => toast('Google sign-in coming soon!', { icon: '🚀' })}
              className="w-full gap-3"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>

      {/* Right — Visual panel */}
      <div className="hidden lg:flex flex-1 relative bg-[var(--primary)] overflow-hidden">
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
            Join verified renters and owners on GoRentals — Hyderabad&apos;s peer-to-peer rental marketplace.
          </p>
          <div className="flex items-center gap-8 mt-10">
            {[['Verified', 'KYC Owners'], ['Secured', 'Payments'], ['4.9★', 'Avg. Rating']].map(([val, lbl]) => (
              <div key={lbl} className="text-center">
                <p className="text-xl font-display font-bold">{val}</p>
                <p className="text-xs text-white/60 mt-0.5">{lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
