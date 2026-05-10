"use client";

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Mail, ArrowLeft, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { LogoMark } from '@/components/ui/Logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // ── Handler preserved unchanged ──────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
    toast.success('Reset instructions sent!');
  };

  const maskEmail = (emailStr: string) => {
    const [name, domain] = emailStr.split('@');
    if (!name || !domain) return emailStr;
    const maskedName = name[0] + '***' + name[name.length - 1];
    return `${maskedName}@${domain}`;
  };

  return (
    <div className="flex min-h-screen bg-subtle">

      {/* ── LEFT PANEL — Branding ────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] bg-[#4F46E5] relative overflow-hidden flex-col justify-between p-14">
        {/* Ambient orbs */}
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
            <div className="w-20 h-20 bg-card/15 rounded-3xl flex items-center justify-center mb-8">
              <Lock className="w-10 h-10 text-white" strokeWidth={1.5} />
            </div>
            <h2 className="text-5xl font-bold text-white leading-tight mb-5">
              Secure access,<br />
              <span className="text-white/70">always.</span>
            </h2>
            <p className="text-indigo-200 text-lg leading-relaxed max-w-sm">
              Your account security is our priority. We use industry-standard encryption to keep your data safe at all times.
            </p>
          </div>

          {/* Trust pills — tonal, No-Line rule */}
          <div className="flex flex-col gap-4">
            {[
              { icon: ShieldCheck, label: 'End-to-end encrypted reset links'   },
              { icon: Mail,        label: 'Link expires in 15 minutes'          },
              { icon: Lock,        label: 'No data shared with third parties'   },
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

        {/* Bottom stats */}
        <div className="z-10 flex items-center gap-8">
          {[['256-bit', 'Encryption'], ['GDPR', 'Compliant'], ['24/7', 'Support']].map(([val, lbl]) => (
            <div key={lbl} className="text-center">
              <p className="text-2xl font-bold text-white">{val}</p>
              <p className="text-xs text-white/60 mt-0.5">{lbl}</p>
            </div>
          ))}
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
          {!sent ? (
            <>
              {/* Icon */}
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8">
                <Mail className="w-8 h-8 text-[#4F46E5]" strokeWidth={1.5} />
              </div>

              <div className="mb-8">
                <h1 className="text-3xl font-bold text-text mb-2 tracking-tight">Reset your password</h1>
                <p className="text-muted leading-relaxed">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email field — No-Line: tonal bg instead of border */}
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

                {/* Primary CTA — Indigo solid */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-2xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : 'Send reset link'}
                </button>
              </form>
            </>
          ) : (
            /* ── Success State ──────────────────────────────────── */
            <div>
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8">
                <CheckCircle2 className="w-8 h-8 text-[#4F46E5]" strokeWidth={1.5} />
              </div>
              <h2 className="text-3xl font-bold text-text mb-3 tracking-tight">Check your inbox</h2>
              <p className="text-muted leading-relaxed mb-8">
                We&apos;ve sent password reset instructions to{' '}
                <span className="font-bold text-text">{maskEmail(email)}</span>.
                Check your spam folder if you don&apos;t see it.
              </p>
              <button
                type="button"
                onClick={() => { setSent(false); setEmail(''); }}
                className="h-10 px-6 bg-subtle hover:bg-slate-200 text-text rounded-2xl text-sm font-semibold transition-colors"
              >
                Try a different email
              </button>
            </div>
          )}

          {/* Back to login */}
          <div className="mt-10 pt-8" style={{ borderTop: '1px solid #f1f5f9' }}>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-[#4F46E5] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
