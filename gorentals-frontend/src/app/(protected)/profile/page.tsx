"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/services/user';
import api from '@/lib/axios';
import KYCModal from '@/components/profile/KYCModal';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  User, Mail, Phone, Shield, Calendar, MapPin, 
  CheckCircle2, Clock, AlertTriangle, Lock, LogOut, 
  Eye, EyeOff, Loader2 
} from 'lucide-react';
import UpgradeOwnerCard from '@/components/UpgradeOwnerCard';


export default function ProfileSettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'danger'>('profile');
  
  // Profile State
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [requestingKYC, setRequestingKYC] = useState(false);

  // Security State
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  const kycStatus = user?.kycStatus || 'PENDING';

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const userTypeLabel = {
    OWNER: 'Verified Owner',
    RENTER: 'Renter',
    ADMIN: 'Administrator',
    SUPER_ADMIN: 'Super Administrator',
  }[user?.role || 'RENTER'];

  // Handlers
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const updated = await updateProfile({ fullName, phone });
      updateUser(updated);
      toast.success('Profile updated successfully.');
      setEditing(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

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
      await api.patch('/users/profile/password', {
        currentPassword: currentPwd,
        newPassword: newPwd,
      });
      toast.success('Password updated successfully.');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update password.');
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
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Header Banner */}
      <div className="bg-white border-b border-[#e5e7eb] pt-12 pb-6 px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 items-center md:items-end justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-[#f0fdf4] text-[#16a34a] rounded-full flex items-center justify-center font-bold text-3xl ring-4 ring-white shadow-sm shrink-0">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#111827]">{user?.fullName || 'Anonymous'}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="text-[#6b7280] flex items-center gap-1.5 text-sm font-medium">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  user?.role === 'OWNER' ? 'bg-[#f0fdf4] text-[#15803d]' : 'bg-[#f3f4f6] text-[#4b5563]'
                }`}>
                  {userTypeLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 hide-scrollbar">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'profile' ? 'bg-white text-[#111827] shadow-sm border border-[#e5e7eb]' : 'text-[#6b7280] hover:bg-[#f3f4f6]'
              }`}
            >
              <User className={`w-5 h-5 ${activeTab === 'profile' ? 'text-[#16a34a]' : ''}`} />
              Personal Info
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'security' ? 'bg-white text-[#111827] shadow-sm border border-[#e5e7eb]' : 'text-[#6b7280] hover:bg-[#f3f4f6]'
              }`}
            >
              <Lock className={`w-5 h-5 ${activeTab === 'security' ? 'text-[#16a34a]' : ''}`} />
              Security
            </button>
            <button 
              onClick={() => setActiveTab('danger')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'danger' ? 'bg-white text-[#111827] shadow-sm border border-[#e5e7eb]' : 'text-[#6b7280] hover:bg-red-50 hover:text-red-600'
              }`}
            >
              <AlertTriangle className={`w-5 h-5 ${activeTab === 'danger' ? 'text-red-500' : ''}`} />
              Danger Zone
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          
          {/* ---- PROFILE TAB ---- */}
          {activeTab === 'profile' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
              
              {user?.role === 'RENTER' && (
                <div className="mb-6">
                  <UpgradeOwnerCard />
                </div>
              )}

              {/* Verification Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-6">

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      kycStatus === 'VERIFIED' ? 'bg-[#f0fdf4] text-[#16a34a]' : 
                      kycStatus === 'PENDING' ? 'bg-amber-50 text-amber-500' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {kycStatus === 'VERIFIED' ? <CheckCircle2 className="w-6 h-6" /> :
                       kycStatus === 'PENDING' ? <Clock className="w-6 h-6" /> :
                       <Shield className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#111827]">
                        {kycStatus === 'VERIFIED' ? 'Identity Verified' : 
                         kycStatus === 'PENDING' ? 'Verification Pending' : 'Action Required'}
                      </h3>
                      <p className="text-sm text-[#6b7280]">
                        {kycStatus === 'VERIFIED' 
                          ? 'You can now rent and list items freely.'
                          : kycStatus === 'PENDING'
                          ? 'We are reviewing your documents.'
                          : 'Verify your ID to unlock renting.'}
                      </p>
                    </div>
                  </div>
                  {kycStatus !== 'VERIFIED' && (
                    <button 
                      onClick={() => setRequestingKYC(true)}
                      className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-[#16a34a] hover:bg-[#15803d] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={kycStatus === 'PENDING'}
                    >
                      {kycStatus === 'PENDING' ? 'Submitted' : 'Verify Now'}
                    </button>
                  )}
                </div>
              </div>

              {/* Personal Details */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg text-[#111827]">Personal Details</h3>
                  <button
                    onClick={() => setEditing(!editing)}
                    className="text-sm font-semibold text-[#16a34a] hover:text-[#15803d] transition-colors"
                  >
                    {editing ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#6b7280] mb-1.5">Full Name</label>
                      {editing ? (
                        <input
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#f9fafb] border border-[#d1d5db] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] text-[#111827]"
                        />
                      ) : (
                        <p className="font-medium text-[#111827]">{fullName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#6b7280] mb-1.5">Phone Number</label>
                      {editing ? (
                        <input
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#f9fafb] border border-[#d1d5db] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] text-[#111827]"
                        />
                      ) : (
                        <p className="font-medium text-[#111827]">{phone || 'Not provided'}</p>
                      )}
                    </div>
                  </div>

                  {user?.city && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#6b7280] mb-1.5">Location</label>
                      <p className="font-medium text-[#111827] flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#9ca3af]" />
                        {user.city}{user.state ? `, ${user.state}` : ''}
                      </p>
                    </div>
                  )}

                  {editing && (
                    <div className="pt-4 border-t border-[#f3f4f6]">
                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#111827] hover:bg-[#374151] text-white rounded-xl font-semibold text-sm transition-colors"
                      >
                        {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ---- SECURITY TAB ---- */}
          {activeTab === 'security' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-6">
                <h3 className="font-bold text-lg text-[#111827] mb-2">Change Password</h3>
                <p className="text-[#6b7280] text-sm mb-6">Ensure your account is using a long, random password to stay secure.</p>
                
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1.5">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPwd}
                        onChange={e => setCurrentPwd(e.target.value)}
                        required
                        className="w-full pr-10 px-4 py-2.5 bg-[#f9fafb] border border-[#d1d5db] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] text-[#111827]"
                      />
                      <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#4b5563]">
                        {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPwd}
                        onChange={e => setNewPwd(e.target.value)}
                        required
                        minLength={8}
                        className="w-full pr-10 px-4 py-2.5 bg-[#f9fafb] border border-[#d1d5db] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] text-[#111827]"
                      />
                      <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#4b5563]">
                        {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPwd}
                      onChange={e => setConfirmPwd(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-[#f9fafb] border border-[#d1d5db] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] text-[#111827]"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={pwdLoading}
                      className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#111827] hover:bg-[#374151] text-white rounded-xl font-semibold text-sm transition-colors"
                    >
                      {pwdLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ---- DANGER TAB ---- */}
          {activeTab === 'danger' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
              
              <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <LogOut className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#111827]">Sign Out</h3>
                    <p className="text-[#6b7280] text-sm mb-4 mt-1">End your current session on this device.</p>
                    <button
                      onClick={handleLogout}
                      className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-semibold text-sm transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-red-600">Delete Account</h3>
                    <p className="text-[#6b7280] text-sm mb-4 mt-1">
                      Permanently delete your account and all associated data. This action cannot be undone and you will lose access to all your listings and bookings.
                    </p>
                    <button
                      disabled
                      className="px-5 py-2.5 bg-red-50 text-red-400 rounded-xl font-semibold text-sm border border-red-100 cursor-not-allowed"
                    >
                      Delete Account (Contact Support)
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        <KYCModal 
          isOpen={requestingKYC} 
          onClose={() => setRequestingKYC(false)} 
        />
      </div>
    </div>
  );
}
