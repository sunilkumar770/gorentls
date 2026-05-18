"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  Mail, 
  ArrowLeft, 
  CheckCircle2, 
  Lock, 
  ShieldCheck, 
  KeyRound, 
  Phone, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  Sparkles, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { LogoMark } from '@/components/ui/Logo';

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  // ── States ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [identifier, setIdentifier] = useState(''); // email or phone number
  const [loading, setLoading] = useState(false);
  
  // OTP input states
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timer, setTimer] = useState(300); // 5 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  
  // Password step states
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Redirect countdown state
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // ── Timer Effect ───────────────────────────────────────────────────
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  // ── Success State Redirect Effect ──────────────────────────────────
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 4 && redirectCountdown > 0) {
      interval = setInterval(() => {
        setRedirectCountdown((prev) => prev - 1);
      }, 1000);
    } else if (step === 4 && redirectCountdown === 0) {
      router.push('/login');
    }
    return () => clearInterval(interval);
  }, [step, redirectCountdown, router]);

  // ── Password Validation Rules ──────────────────────────────────────
  const hasMinLength = newPassword.length >= 6;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword && newPassword === confirmPassword;
  const isPasswordValid = hasMinLength && hasNumber && hasSpecialChar && passwordsMatch;

  // ── Handlers ───────────────────────────────────────────────────────
  
  // Step 1: Initiate Password Reset (Request OTP)
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error('Please enter your email or phone number');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier.trim() }), // passes to Spring Boot
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to request code. Please check your input.');
      }

      toast.success('Verification code sent successfully!');
      setTimer(300);
      setTimerActive(true);
      setStep(2);
      
      // Auto focus first OTP input block after transition
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 300);
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          otp: otpCode
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid or expired verification code');
      }

      setResetToken(data.resetToken);
      toast.success('Code verified successfully!');
      setStep(3);
    } catch (error: any) {
      toast.error(error.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      toast.error('Please make sure all password criteria are satisfied');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          newPassword: newPassword
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Reset failed');
      }

      toast.success('Password updated successfully!');
      setStep(4);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input focus handlers ───────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (!cleanValue) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    // Take only the last character if multi characters typed
    const digit = cleanValue[cleanValue.length - 1];
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-focus next input
    if (index < 5 && digit) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Empty value backspace: focus previous input
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      otpRefs.current[5]?.focus();
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const maskIdentifier = (val: string) => {
    if (val.includes('@')) {
      const [name, domain] = val.split('@');
      if (!name || !domain) return val;
      const maskedName = name[0] + '***' + name[name.length - 1];
      return `${maskedName}@${domain}`;
    } else {
      if (val.length < 4) return val;
      return '***-***-' + val.slice(-4);
    }
  };

  return (
    <div className="flex min-h-screen bg-subtle">
      
      {/* ── LEFT PANEL — Branding (Matching GoRentals theme) ────────── */}
      <div className="hidden lg:flex lg:w-[52%] bg-[#4F46E5] relative overflow-hidden flex-col justify-between p-14">
        {/* Ambient background glow */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-card/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-20 w-[400px] h-[400px] bg-card/8 rounded-full blur-3xl" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 bg-card/20 rounded-2xl flex items-center justify-center transition-transform hover:scale-105">
            <LogoMark size={24} className="brightness-0 invert" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">GoRentals</span>
        </Link>

        {/* Centre Brand Information */}
        <div className="z-10 space-y-8">
          <div>
            <div className="w-20 h-20 bg-card/15 rounded-3xl flex items-center justify-center mb-8 relative">
              <Lock className="w-10 h-10 text-white" strokeWidth={1.5} />
              <div className="absolute top-0 right-0 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#4F46E5]" />
            </div>
            <h2 className="text-5xl font-bold text-white leading-tight mb-5">
              Secure reset,<br />
              <span className="text-indigo-200">total visibility.</span>
            </h2>
            <p className="text-indigo-100 text-lg leading-relaxed max-w-sm">
              We leverage military-grade hashing algorithms and verification systems to guard your transaction assets and rental accounts.
            </p>
          </div>

          {/* Trust pills */}
          <div className="flex flex-col gap-4">
            {[
              { icon: ShieldCheck, label: 'Secure 6-digit numeric OTP' },
              { icon: Mail,        label: 'Auto-expires in 5 minutes for security' },
              { icon: Lock,        label: 'Session-gated password update vault' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 bg-card/10 rounded-2xl px-4 py-3 hover:bg-card/15 transition-all">
                <div className="w-9 h-9 bg-card/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-medium text-white/90">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Brand stats */}
        <div className="z-10 flex items-center gap-8">
          {[['SHA-256', 'Hashing'], ['SSL', 'Protected'], ['OTP', 'Enforced']].map(([val, lbl]) => (
            <div key={lbl} className="text-center">
              <p className="text-2xl font-bold text-white">{val}</p>
              <p className="text-xs text-white/60 mt-0.5">{lbl}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL — Dynamic Multi-Step Interactive Form ───────── */}
      <div className="w-full lg:w-[48%] flex flex-col justify-center px-8 sm:px-14 xl:px-20 bg-card min-h-screen relative">
        
        {/* Decorative backdrop light */}
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />

        {/* Mobile branding */}
        <Link href="/" className="flex items-center gap-2.5 mb-10 lg:hidden">
          <LogoMark size={32} />
          <span className="text-xl font-bold text-text">GoRentals</span>
        </Link>

        <div className="max-w-md w-full relative z-10 transition-all duration-500 ease-in-out">
          
          {/* STEP 1: Find Account / Request OTP */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-5 duration-300">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8">
                <KeyRound className="w-8 h-8 text-[#4F46E5]" strokeWidth={1.5} />
              </div>

              <div className="mb-8">
                <h1 className="text-3xl font-bold text-text mb-2 tracking-tight">Reset password</h1>
                <p className="text-muted leading-relaxed">
                  Enter your email address or phone number. We will send you a secure 6-digit OTP code to verify your identity.
                </p>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-text">Email address or Phone number</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center text-faint">
                      <Mail className="w-5 h-5 text-indigo-500/60" />
                    </div>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder="email@example.com or 9876543210"
                      className="w-full h-12 pl-12 pr-4 bg-subtle rounded-2xl text-text placeholder:text-faint text-sm font-medium focus:outline-none focus:bg-card focus:ring-2 focus:ring-indigo-500/30 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-2xl text-sm font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20"
                >
                  {loading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: Verify OTP Screen */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right duration-300">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-8">
                <ShieldCheck className="w-8 h-8 text-amber-600" strokeWidth={1.5} />
              </div>

              <div className="mb-8">
                <h1 className="text-3xl font-bold text-text mb-2 tracking-tight">Enter OTP Code</h1>
                <p className="text-muted leading-relaxed">
                  We sent a 6-digit code to <span className="font-semibold text-text">{maskIdentifier(identifier)}</span>.
                </p>
                <p className="text-xs text-amber-600/80 mt-1 font-medium bg-amber-50 rounded-lg p-2.5 inline-block">
                  💡 Running locally? The SMS OTP code is logged clearly in your Spring Boot server logs!
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-text block text-center">6-Digit Verification Code</label>
                  
                  {/* OTP block input field */}
                  <div className="flex justify-between gap-2 max-w-sm mx-auto">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={el => { otpRefs.current[idx] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(idx, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        className="w-12 h-14 bg-subtle rounded-xl text-center text-xl font-bold text-text focus:outline-none focus:bg-card focus:ring-2 focus:ring-indigo-500/40 transition-all border-none focus:shadow-md"
                      />
                    ))}
                  </div>
                </div>

                {/* Resend and timer options */}
                <div className="flex items-center justify-between px-1 text-sm font-semibold">
                  {timerActive ? (
                    <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                      Code expires in {formatTimer(timer)}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      className="text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Resend Code
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setStep(1); setOtp(Array(6).fill('')); }}
                    className="text-muted hover:text-text transition-colors"
                  >
                    Change contact details
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.join('').length < 6}
                  className="w-full h-12 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-2xl text-sm font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg"
                >
                  {loading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : 'Verify Verification Code'}
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: Enter New Password */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right duration-300">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8 animate-bounce">
                <Lock className="w-8 h-8 text-emerald-600" strokeWidth={1.5} />
              </div>

              <div className="mb-8">
                <h1 className="text-3xl font-bold text-text mb-2 tracking-tight">Create new password</h1>
                <p className="text-muted leading-relaxed">
                  Provide a new, strong password to guard your GoRentals operational profile.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-text">New password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-faint" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-12 pl-12 pr-12 bg-subtle rounded-2xl text-text placeholder:text-faint text-sm font-medium focus:outline-none focus:bg-card focus:ring-2 focus:ring-indigo-500/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-faint hover:text-text transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-text">Confirm new password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-faint" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-12 pl-12 pr-12 bg-subtle rounded-2xl text-text placeholder:text-faint text-sm font-medium focus:outline-none focus:bg-card focus:ring-2 focus:ring-indigo-500/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-faint hover:text-text transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Validation Feedbacks */}
                <div className="bg-subtle p-4 rounded-2xl space-y-2 mt-4">
                  <p className="text-xs font-bold text-text uppercase tracking-wider">Password requirements</p>
                  
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${hasMinLength ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-semibold text-muted">Min 6 characters</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${hasNumber ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-semibold text-muted">At least 1 digit</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${hasSpecialChar ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {hasSpecialChar ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-semibold text-muted">1 special symbol</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${passwordsMatch ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {passwordsMatch ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-semibold text-muted">Passwords match</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isPasswordValid}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-emerald-600/10"
                >
                  {loading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : (
                    <>
                      <span>Secure Reset Password</span>
                      <Sparkles className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 4: Success Redirection */}
          {step === 4 && (
            <div className="animate-in zoom-in-95 duration-400 text-center">
              <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-emerald-100 relative">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 animate-bounce" strokeWidth={1.5} />
                <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-emerald-400 rounded-full animate-ping" />
              </div>

              <h2 className="text-3xl font-bold text-text mb-3 tracking-tight">Security Vault Restored</h2>
              <p className="text-muted leading-relaxed max-w-sm mx-auto mb-8">
                Your new password has been successfully written to your profile database. Returning to the secure gateway interface shortly.
              </p>

              {/* Graphical countdown bar */}
              <div className="w-full bg-subtle h-2 rounded-full overflow-hidden mb-6">
                <div 
                  className="bg-emerald-600 h-full transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${(redirectCountdown / 5) * 100}%` }}
                />
              </div>

              <p className="text-xs font-bold text-emerald-600 bg-emerald-50 py-1.5 px-3 rounded-full inline-block">
                Auto redirecting in {redirectCountdown}s...
              </p>

              <div className="mt-8">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                >
                  Return to secure gateway immediately
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Back to sign in / Back button link */}
          {step !== 4 && (
            <div className="mt-10 pt-8" style={{ borderTop: '1px solid #f1f5f9' }}>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-[#4F46E5] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
