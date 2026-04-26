"use client";

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Mail, ArrowLeft, Tent, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call — wire to real endpoint when available
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
    toast.success('Reset instructions sent!');
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-10 group w-fit">
          <div className="w-9 h-9 rounded-xl gradient-teal flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Tent className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-display font-bold text-[var(--text)] tracking-tight">GoRentals</span>
        </Link>

        <div className="bg-[var(--bg-card)] rounded-[var(--r-xl)] border border-[var(--border)] shadow-card p-8">
          {!sent ? (
            <>
              <h1 className="text-2xl font-display font-bold text-[var(--text)] mb-2">Reset your password</h1>
              <p className="text-[var(--text-muted)] text-sm mb-8 leading-relaxed">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-[var(--text)]">Email address</label>
                  <div className="relative">
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-12"
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-faint)]" />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  size="md"
                  loading={loading}
                  className="w-full"
                >
                  Send reset link
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-[var(--primary-light)] rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-[var(--primary)]" />
              </div>
              <h2 className="text-xl font-display font-bold text-[var(--text)] mb-2">Check your inbox</h2>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-6">
                We&apos;ve sent password reset instructions to <span className="font-semibold text-[var(--text)]">{email}</span>. Check your spam folder if you don&apos;t see it.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="text-sm text-[var(--primary)] font-semibold hover:underline"
              >
                Try a different email
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-[var(--border)] text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
