"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { signUp, buildProfile } from '@/services/auth';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, User, Mail, Phone, Lock, ShieldCheck, Zap, TrendingUp } from 'lucide-react';
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

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<'RENTER' | 'OWNER'>('RENTER');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  // ── All business logic preserved unchanged ────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast.error('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await signUp(email, password, name, phone, userType);

      if (error) { toast.error(error); return; }
      if (!data) throw new Error('Account creation failed. Please try again.');

      const profile = buildProfile(data);
      login(data.accessToken, profile);

      toast.success('Account created! Please verify your phone number via the OTP sent to your device.', {
        duration: 6000,
        icon: '📱'
      });

      if (userType === 'OWNER') {
        router.push('/owner/dashboard');
      } else {
        router.push('/');
      }
      router.refresh();
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error('[Signup] Client Error:', error);
      toast.error(error.message || 'Signup encountered an unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    toast('Google sign-in coming soon!', { icon: '🚀' });
  };

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e'];

  const leftPanelContent = {
    RENTER: {
      heading: 'Rent anything, from verified locals.',
      sub: 'Browse thousands of listings from KYC-verified owners near you. Book in minutes.',
      image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1500&auto=format&fit=crop',
      badge1: 'KYC Verified',
      badge2: 'Instant Booking',
    },
    OWNER: {
      heading: 'Turn idle gear into steady income.',
      sub: 'Join thousands of verified owners earning from cameras, tools, and electronics every week.',
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1500&auto=format&fit=crop',
      badge1: 'Start Earning',
      badge2: 'Secure Payments',
    },
  };

  const panel = leftPanelContent[userType];

  return (
    <div className="flex min-h-screen bg-subtle">

      {/* ── LEFT PANEL — Branding ────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] bg-[#4F46E5] relative overflow-hidden flex-col justify-between p-14">
        {/* Ambient orbs — no hard borders */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-card/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-20 w-[400px] h-[400px] bg-card/8 rounded-full blur-3xl" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 bg-card/20 rounded-2xl flex items-center justify-center">
            <LogoMark size={24} className="brightness-0 invert" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">GoRentals</span>
        </Link>

        {/* Dynamic copy per role */}
        <div className="z-10 space-y-6">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              {panel.heading}
            </h2>
            <p className="text-indigo-200 text-lg leading-relaxed max-w-sm">
              {panel.sub}
            </p>
          </div>

          {/* Trust signals — tonal pill design, No-Line rule */}
          <div className="flex flex-col gap-3">
            {[
              { icon: ShieldCheck, label: 'Every owner is KYC-verified'       },
              { icon: Zap,         label: 'Instant booking confirmation'        },
              { icon: TrendingUp,  label: 'Grow your rental income consistently'},
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

        {/* Photo inset — transitions on role switch */}
        <div className="z-10 relative w-full h-52 rounded-3xl overflow-hidden">
          <Image
            src={panel.image}
            alt={userType === 'OWNER' ? 'List your gear' : 'Rent gear'}
            fill
            className="object-cover opacity-60 transition-all duration-700"
            sizes="40vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/60 to-transparent" />
          <div className="absolute bottom-4 left-4 flex gap-2">
            <span className="px-3 py-1.5 bg-card/20 backdrop-blur-sm rounded-full text-[11px] font-bold text-white uppercase tracking-wider">{panel.badge1}</span>
            <span className="px-3 py-1.5 bg-card/20 backdrop-blur-sm rounded-full text-[11px] font-bold text-white uppercase tracking-wider">{panel.badge2}</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Form ───────────────────────────────────── */}
      <div className="w-full lg:w-[48%] flex flex-col justify-center px-8 sm:px-12 xl:px-16 bg-card min-h-screen overflow-y-auto py-14">

        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-8 lg:hidden">
          <LogoMark size={32} />
          <span className="text-xl font-bold text-text">GoRentals</span>
        </Link>

        <div className="max-w-md w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-2 tracking-tight">
              {userType === 'OWNER' ? 'Start earning today' : 'Join GoRentals'}
            </h1>
            <p className="text-muted">Rent or list — join for free, no credit card required.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── Role Toggle — No-Line: tonal surface shift ────── */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-faint uppercase tracking-widest">I want to…</label>
              <div className="grid grid-cols-2 gap-3 p-1 bg-subtle rounded-2xl">
                {([['RENTER', 'Rent Items', 'Browse & book gear'], ['OWNER', 'List Equipment', 'Earn from your gear']] as const).map(
                  ([type, title, sub]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setUserType(type)}
                      className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all text-left ${
                        userType === type
                          ? 'bg-card text-[#4F46E5] shadow-sm'
                          : 'text-muted hover:text-text'
                      }`}
                    >
                      <div className="font-bold">{title}</div>
                      <div className="text-[11px] opacity-70 mt-0.5">{sub}</div>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* ── Full Name ─────────────────────────────────────── */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-text">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-faint" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full h-12 pl-12 pr-4 bg-subtle rounded-2xl text-text placeholder:text-faint text-sm font-medium focus:outline-none focus:bg-card focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
              </div>
            </div>

            {/* ── Email ─────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-text">Email Address</label>
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

            {/* ── Phone ─────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-text">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-faint" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full h-12 pl-12 pr-4 bg-subtle rounded-2xl text-text placeholder:text-faint text-sm font-medium focus:outline-none focus:bg-card focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
              </div>
            </div>

            {/* ── Password ──────────────────────────────────────── */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-text">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-faint" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
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
              {/* Password strength indicator */}
              {password.length > 0 ? (
                <div className="space-y-1 pt-1">
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ backgroundColor: i <= passwordStrength ? strengthColor[passwordStrength] : '#e2e8f0' }}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-semibold" style={{ color: strengthColor[passwordStrength] }}>
                    {strengthLabel[passwordStrength]} password
                  </p>
                </div>
              ) : (
                <p className="text-xs text-faint pt-0.5">Minimum 8 characters</p>
              )}
            </div>

            {/* ── Terms checkbox ────────────────────────────────── */}
            <label className="flex items-start gap-3 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-indigo-600 cursor-pointer flex-shrink-0"
              />
              <span className="text-xs text-muted leading-relaxed">
                By creating an account, I agree to the{' '}
                <Link href="/terms" target="_blank" className="font-semibold text-[#4F46E5] hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" target="_blank" className="font-semibold text-[#4F46E5] hover:underline">Privacy Policy</Link>.
              </span>
            </label>

            {/* ── Primary CTA — Indigo solid ────────────────────── */}
            <button
              type="submit"
              disabled={loading || !agreed}
              className="w-full h-12 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-2xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60 mt-1"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : 'Create Account'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 py-1">
              <div className="h-px flex-1 bg-subtle" />
              <span className="text-xs font-medium text-faint">or continue with</span>
              <div className="h-px flex-1 bg-subtle" />
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="w-full h-12 bg-subtle hover:bg-subtle text-text rounded-2xl text-sm font-semibold transition-colors flex items-center justify-center gap-3"
            >
              <GoogleIcon />
              Sign up with Google
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
