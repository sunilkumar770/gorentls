"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { signIn, adminSignIn, buildProfile } from '@/services/auth';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Star, Zap } from 'lucide-react';
import { LogoMark } from '@/components/ui/Logo';
import Image from 'next/image';

// ── Google SVG ────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<'RENTER' | 'OWNER' | 'ADMIN'>('RENTER');
  const [loading, setLoading] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    setRedirectTo(params.get('redirect'));
  }, []);

  // ── All business logic preserved unchanged ────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (userType === 'ADMIN') {
        result = await adminSignIn(email, password);
      } else {
        result = await signIn(email, password);
      }

      const { data, error } = result;
      if (error || !data) throw new Error(error || 'Identity verification failed');

      const profile = buildProfile(data);
      login(data.accessToken, profile);

      toast.success(userType === 'ADMIN' ? `Welcome back, ${profile.fullName}` : 'Welcome back to the collection.');

      const role = profile.role.toUpperCase();
      const dest = role === 'ADMIN'
        ? '/admin'
        : role === 'OWNER'
          ? '/owner/dashboard'
          : redirectTo ?? '/dashboard';

      router.replace(dest);
      router.refresh();
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error('[Login] Client Error:', error);
      toast.error(error.message || 'Sign-in encountered an unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-subtle flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-subtle">

      {/* ── LEFT PANEL — Branding ────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] bg-[#4F46E5] relative overflow-hidden flex-col justify-between p-14">
        {/* Ambient background orbs — no borders */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-card/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-20 w-[400px] h-[400px] bg-card/8 rounded-full blur-3xl" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 bg-card/20 rounded-2xl flex items-center justify-center">
            <LogoMark size={24} className="brightness-0 invert" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">GoRentals</span>
        </Link>

        {/* Centre copy */}
        <div className="z-10 space-y-8">
          <div>
            <h2 className="text-5xl font-bold text-white leading-tight mb-5">
              Welcome back —<br />
              <span className="text-white/70">login to continue</span>
            </h2>
            <p className="text-indigo-200 text-lg leading-relaxed max-w-sm">
              Access your rentals, bookings, and listings from Hyderabad&apos;s most trusted gear marketplace.
            </p>
          </div>

          {/* Trust pills — No-Line: tonal background shift */}
          <div className="flex flex-col gap-4">
            {[
              { icon: ShieldCheck, label: 'KYC-verified owners on every listing' },
              { icon: Zap,         label: 'Instant booking confirmation'         },
              { icon: Star,        label: '4.9★ average platform rating'         },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 bg-card/10 rounded-2xl px-4 py-3">
                <div className="w-9 h-9 bg-card/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-medium text-white/90">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Photo inset */}
        <div className="z-10 relative w-full h-48 rounded-3xl overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=700&q=80"
            alt="Camera gear for rent"
            fill
            className="object-cover opacity-60"
            sizes="40vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/60 to-transparent" />
        </div>
      </div>

      {/* ── RIGHT PANEL — Form ───────────────────────────────────── */}
      <div className="w-full lg:w-[48%] flex flex-col justify-center px-8 sm:px-14 xl:px-20 bg-card min-h-screen">

        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-10 lg:hidden">
          <LogoMark size={32} />
          <span className="text-xl font-bold text-text">GoRentals</span>
        </Link>

        <div className="max-w-md w-full">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-text mb-2 tracking-tight">Sign in</h1>
            <p className="text-muted">Welcome back. Enter your details to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-text">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-faint" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-12 pl-12 pr-4 bg-subtle rounded-2xl text-text placeholder:text-faint text-sm font-medium focus:outline-none focus:bg-card focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-text">Password</label>
                <Link href="/forgot-password" className="text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA] transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-faint" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 pl-12 pr-12 bg-subtle rounded-2xl text-text placeholder:text-faint text-sm font-medium focus:outline-none focus:bg-card focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-faint hover:text-muted transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
              />
              <span className="text-sm text-muted group-hover:text-text transition-colors">Remember me</span>
            </label>

            {/* Primary CTA — Indigo solid, No-Line */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-2xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : 'Sign in'}
            </button>

            {/* Divider — tonal, not a border line in the "No-Line" sense, but unavoidable for semantic */}
            <div className="flex items-center gap-4 py-1">
              <div className="h-px flex-1 bg-subtle" />
              <span className="text-xs font-medium text-faint">or continue with</span>
              <div className="h-px flex-1 bg-subtle" />
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={() => toast('Google sign-in coming soon!', { icon: '🚀' })}
              className="w-full h-12 bg-subtle hover:bg-subtle text-text rounded-2xl text-sm font-semibold transition-colors flex items-center justify-center gap-3"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
