'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/user';
import { useRouter } from 'next/navigation';
import { Lock, LogOut, AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const { logout } = useAuth();
  const router = useRouter();

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      toast.error('New passwords do not match.');
      return;
    }
    if (newPwd.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setPwdLoading(true);
    try {
      await userService.changePassword({
        currentPassword: currentPwd,
        newPassword: newPwd,
      });
      toast.success('Password updated successfully.');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update password. Please try again.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    toast.success('Signed out successfully.');
  };

  return (
    <div className="min-h-screen bg-[#fff8f6] pt-12 pb-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

        {/* Header */}
        <div className="mb-12 border-b border-[#251913]/5 pb-12">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#f97316] mb-3">Account</p>
          <h1 className="text-6xl font-display font-black tracking-tighter text-[#251913] leading-[0.85]">
            Settings<span className="text-[#f97316]">.</span>
          </h1>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-ambient ring-1 ring-[#f97316]/5 mb-8">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[#251913]/5">
            <div className="w-10 h-10 bg-[#fff8f6] rounded-[0.75rem] flex items-center justify-center">
              <Lock className="w-4 h-4 text-[#f97316]" />
            </div>
            <h2 className="text-xl font-display font-black text-[#251913]">Change Password</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#8c7164] mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPwd}
                  onChange={e => setCurrentPwd(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pr-12 px-5 py-4 bg-[#fff8f6] rounded-[1rem] border border-transparent focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/10 outline-none text-[#251913] font-bold transition-all"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8c7164]">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#8c7164] mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  className="w-full pr-12 px-5 py-4 bg-[#fff8f6] rounded-[1rem] border border-transparent focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/10 outline-none text-[#251913] font-bold transition-all"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8c7164]">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#8c7164] mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-[#fff8f6] rounded-[1rem] border border-transparent focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/10 outline-none text-[#251913] font-bold transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={pwdLoading}
              className="gradient-signature w-full h-14 text-white rounded-[1rem] font-display font-black text-lg shadow-ambient hover:-translate-y-0.5 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {pwdLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Updating...</> : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Sign Out */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-ambient ring-1 ring-[#f97316]/5 mb-8">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#251913]/5">
            <div className="w-10 h-10 bg-[#fff8f6] rounded-[0.75rem] flex items-center justify-center">
              <LogOut className="w-4 h-4 text-[#f97316]" />
            </div>
            <h2 className="text-xl font-display font-black text-[#251913]">Sign Out</h2>
          </div>
          <p className="text-[#8c7164] font-medium mb-6">You will be returned to the home page and your session will be cleared.</p>
          <button
            onClick={handleLogout}
            className="px-8 py-4 bg-[#fef2f2] text-[#991b1b] rounded-full font-black text-sm uppercase tracking-widest hover:bg-[#fee2e2] transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-ambient ring-1 ring-red-100">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-red-50">
            <div className="w-10 h-10 bg-red-50 rounded-[0.75rem] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <h2 className="text-xl font-display font-black text-[#251913]">Danger Zone</h2>
          </div>
          <p className="text-[#8c7164] font-medium mb-6">Permanently delete your account and all associated data. This action cannot be undone.</p>
          <button
            disabled
            className="px-8 py-4 bg-red-50 text-red-400 rounded-full font-black text-sm uppercase tracking-widest cursor-not-allowed opacity-60"
            title="Contact support to delete your account"
          >
            Delete Account (Contact Support)
          </button>
        </div>

      </div>
    </div>
  );
}
