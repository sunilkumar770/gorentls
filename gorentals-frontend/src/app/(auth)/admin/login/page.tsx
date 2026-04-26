"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { adminSignIn, buildProfile } from '@/services/auth';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock, Mail, ShieldAlert, Tent } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await adminSignIn(email, password);
      if (error || !data) throw new Error(error || 'Admin authentication failed');
      const profile = buildProfile(data);
      console.log('[AdminLogin] Success. Profile received:', profile);
      login(data.accessToken, profile);
      toast.success(`Access granted — welcome, ${profile.fullName}`);
      router.replace('/admin/dashboard');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Authentication failure. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl gradient-teal flex items-center justify-center">
            <Tent className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-display font-bold text-white tracking-tight">GoRentals</span>
        </div>

        <div className="bg-[#1a1d22] rounded-[var(--r-xl)] border border-white/10 shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-white">Administrative Access</h1>
              <p className="text-xs text-white/40">Restricted to authorized personnel only</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <Input
                label="Admin Email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@gorentals.com"
                icon={<Mail className="w-4 h-4" />}
                className="bg-white/5 border-white/10 text-white focus:ring-amber-500/50"
              />

              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                className="bg-white/5 border-white/10 text-white focus:ring-amber-500/50"
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full py-3.5 bg-amber-500 text-black hover:bg-amber-400 mt-2"
            >
              Access Control Panel
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <Link href="/login" className="text-xs text-white/30 hover:text-white/60 transition-colors">
              ← Return to public sign-in
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          Unauthorized access attempts are logged and reported.
        </p>
      </div>
    </div>
  );
}
