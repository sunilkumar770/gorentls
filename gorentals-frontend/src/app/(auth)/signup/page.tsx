"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { signUp, buildProfile } from '@/services/auth';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Eye, EyeOff, User, Mail, Phone, Lock } from 'lucide-react';
import { LogoMark } from '@/components/ui/Logo';
import Image from 'next/image';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast.error('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await signUp(email, password, name, phone, userType);
      
      if (error) {
        toast.error(error);
        return;
      }
      
      if (!data) throw new Error('Account creation failed. Please try again.');

      const profile = buildProfile(data);
      login(data.accessToken, profile);
      toast.success('Account created successfully!');
      
      if (userType === 'OWNER') {
        router.push('/owner/dashboard');
      } else {
        router.push('/');
      }
      router.refresh();
      
    } catch (err: any) {
      console.error('[Signup] Client Error:', err);
      toast.error(err.message || 'Signup encountered an unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    toast('Google sign-in coming soon!', { icon: '🚀' });
  };

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#10b981'];

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* Left Form Section */}
      <div className="w-full lg:w-[560px] flex flex-col justify-center px-8 sm:px-16 bg-[var(--bg-card)] shadow-card z-10 relative overflow-y-auto py-12">
        
        {/* Logo — shared GoRentals mark, consistent with Navbar + Footer */}
        <Link href="/" className="flex items-center gap-2.5 mb-10 group focus:outline-none">
          <LogoMark size={36} className="group-hover:scale-105 transition-transform" />
          <span className="text-2xl font-display font-bold text-[var(--text)] tracking-tight">GoRentals</span>
        </Link>

        <div className="max-w-md w-full mx-auto lg:mx-0">
          <h1 className="text-3xl font-display font-bold text-[var(--text)] mb-2 tracking-tight">
            {userType === 'OWNER' ? 'Start earning today' : 'Join GoRentals'}
          </h1>
          <p className="text-[var(--text-muted)] mb-8 text-sm leading-relaxed">
            Rent or list — join for free, no credit card required.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">I want to...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('RENTER')}
                  className={`py-3 px-4 rounded-[var(--r-md)] text-sm font-semibold transition-all text-left border-2 ${
                    userType === 'RENTER' 
                    ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]' 
                    : 'border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="font-bold">Rent Items</div>
                  <div className="text-[11px] opacity-70 mt-0.5">Browse &amp; book gear</div>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('OWNER')}
                  className={`py-3 px-4 rounded-[var(--r-md)] text-sm font-semibold transition-all text-left border-2 ${
                    userType === 'OWNER' 
                    ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]' 
                    : 'border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="font-bold">List Equipment</div>
                  <div className="text-[11px] opacity-70 mt-0.5">Earn from your gear</div>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Full Name"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                icon={<User className="w-4 h-4" />}
              />

              <Input
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                icon={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Phone Number"
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                icon={<Phone className="w-4 h-4" />}
              />

              <div className="space-y-1.5 relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  icon={<Lock className="w-4 h-4" />}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-10 text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength bar */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ backgroundColor: i <= passwordStrength ? strengthColor[passwordStrength] : 'var(--border)' }}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-semibold" style={{ color: strengthColor[passwordStrength] }}>
                    {strengthLabel[passwordStrength]} password
                  </p>
                </div>
              )}
              {password.length === 0 && <p className="text-xs text-[var(--text-faint)]">Minimum 8 characters</p>}
              </div>

            {/* Terms consent checkbox */}
            <label className="flex items-start gap-3 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-[var(--primary)] cursor-pointer flex-shrink-0"
              />
              <span className="text-xs text-[var(--text-muted)] leading-relaxed">
                By creating an account, I agree to the{' '}
                <Link href="/terms" className="text-[var(--primary)] font-semibold hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-[var(--primary)] font-semibold hover:underline">Privacy Policy</Link>.
              </span>
            </label>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              loading={loading}
              disabled={!agreed}
              className="w-full mt-2"
            >
              Create Account
            </Button>

            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[var(--bg-card)] px-4 text-xs text-[var(--text-faint)] font-medium">or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={handleGoogleSignup}
              className="w-full gap-3"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Sign up with Google
            </Button>
          </form>

          <div className="mt-8 text-center pb-4">
            <p className="text-[var(--text-muted)] text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-[var(--primary)] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Hero Section */}
      <div className="hidden lg:flex flex-1 relative bg-[var(--bg)] overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--primary-light)] rounded-full blur-[100px] opacity-60 -mt-32 -mr-32" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--bg-subtle)] rounded-full blur-[80px] -mb-20 -ml-20" />

        <div className="relative w-full h-full flex flex-col justify-center items-center p-20 z-10">
          <div className="relative w-full max-w-md aspect-[3/4] rounded-[2rem] overflow-hidden shadow-card-hover">
            <Image 
              src={userType === 'OWNER' 
                ? "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1500&auto=format&fit=crop"
                : "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1500&auto=format&fit=crop"} 
              alt={userType === 'OWNER' ? "List your professional gear" : "Rent professional gear"} 
              fill 
              className="object-cover transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary-muted)]/90 via-transparent to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <h2 className="text-2xl font-display font-bold mb-2">
                {userType === 'OWNER' ? 'Earn from idle gear.' : 'Access the best gear.'}
              </h2>
              <p className="text-white/80 text-sm leading-relaxed">
                {userType === 'OWNER' 
                  ? 'Join verified owners earning consistently from their cameras, tools, and electronics.'
                  : 'Borrow exactly what you need, from KYC-verified owners near you.'}
              </p>
              <div className="flex gap-3 mt-5">
                <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-[11px] font-bold uppercase tracking-widest">
                  {userType === 'OWNER' ? 'Start Earning' : 'KYC Verified'}
                </div>
                <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-[11px] font-bold uppercase tracking-widest">
                  Secure Payments
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
