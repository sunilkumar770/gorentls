'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/user';
import KYCModal from '@/components/profile/KYCModal';
import { User, Mail, Phone, Shield, Calendar, MapPin, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [requestingKYC, setRequestingKYC] = useState(false);

  const kycStatus = user?.kycStatus || 'PENDING';

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const userTypeLabel = {
    store_owner: 'Verified Owner',
    renter: 'Collector',
    admin: 'Administrator',
  }[user?.userType || 'renter'];

  const userTypeBadge = {
    store_owner: 'bg-[#ecfdf5] text-[#065f46]',
    renter: 'bg-[#fff8f6] text-[#9d4300]',
    admin: 'bg-[#eff6ff] text-[#1e40af]',
  }[user?.userType || 'renter'];

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await userService.updateProfile({
        fullName,
        phone,
      });
      updateUser(updated);
      toast.success('Profile updated successfully.');
      setEditing(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f6] pt-12 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

        {/* Header */}
        <div className="mb-12 border-b border-[#251913]/5 pb-12">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#f97316] mb-3">Account</p>
          <h1 className="text-6xl font-display font-black tracking-tighter text-[#251913] leading-[0.85] mb-4">
            Your<span className="text-[#f97316]"> Profile.</span>
          </h1>
        </div>

        {/* Avatar + Identity Card */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-ambient ring-1 ring-[#f97316]/5 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <div className="w-24 h-24 bg-gradient-to-br from-[#f97316] to-[#ea580c] rounded-[1.5rem] flex items-center justify-center text-white font-display font-black text-4xl shadow-lg shrink-0">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <h2 className="text-3xl font-display font-black text-[#251913]">{user?.fullName || 'Anonymous'}</h2>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest self-center ${userTypeBadge}`}>
                  {userTypeLabel}
                </span>
              </div>
              <p className="text-[#8c7164] font-medium">{user?.email}</p>
              {user?.city && (
                <div className="flex items-center gap-1.5 justify-center sm:justify-start text-sm text-[#8c7164] font-bold mt-2">
                  <MapPin className="w-3.5 h-3.5 text-[#f97316]" />
                  {user.city}{user.state ? `, ${user.state}` : ''}
                </div>
              )}
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="px-6 py-3 bg-[#fff8f6] rounded-full text-xs font-black uppercase tracking-widest text-[#251913] hover:bg-[#ffeae0] transition-colors ring-1 ring-[#f97316]/10"
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Info Fields */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-ambient ring-1 ring-[#f97316]/5 mb-8">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#8c7164] mb-8 pb-4 border-b border-[#251913]/5">Identity Details</h3>
          <div className="space-y-6">
            {[
              { icon: User,     label: 'Full Name',   value: fullName,  setter: setFullName, editable: true  },
              { icon: Mail,     label: 'Email',        value: user?.email || '', setter: () => {}, editable: false },
              { icon: Phone,    label: 'Phone',        value: phone,     setter: setPhone,    editable: true  },
              { icon: Shield,   label: 'Account Type', value: userTypeLabel, setter: () => {}, editable: false },
              { icon: Calendar, label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'Unknown', setter: () => {}, editable: false },
            ].map(field => {
              const Icon = field.icon;
              return (
                <div key={field.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#fff8f6] rounded-[0.75rem] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[#f97316]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8c7164] mb-1">{field.label}</p>
                    {editing && field.editable ? (
                      <input
                        value={field.value}
                        onChange={e => field.setter(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#fff8f6] rounded-[0.75rem] border border-transparent focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/10 outline-none text-[#251913] font-bold transition-all"
                      />
                    ) : (
                      <p className="text-lg font-bold text-[#251913]">{field.value || '—'}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {editing && (
            <div className="mt-8 flex gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="gradient-signature px-8 py-4 text-white rounded-full font-display font-black shadow-ambient hover:-translate-y-0.5 transition-transform disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-8 py-4 bg-[#fff8f6] text-[#251913] rounded-full font-black text-sm hover:bg-[#ffeae0] transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Verification Status */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-ambient ring-1 ring-[#f97316]/5 mb-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center ${
                kycStatus === 'APPROVED' ? 'bg-[#ecfdf5]' : 
                kycStatus === 'SUBMITTED' ? 'bg-[#fffbeb]' : 'bg-[#fff8f6]'
              }`}>
                {kycStatus === 'APPROVED' ? <CheckCircle className="w-5 h-5 text-[#10b981]" /> :
                 kycStatus === 'SUBMITTED' ? <Clock className="w-5 h-5 text-[#f59e0b]" /> :
                 <Shield className="w-5 h-5 text-[#f97316]" />}
              </div>
              <div>
                <h3 className="font-display font-black text-[#251913] text-lg">
                  {kycStatus === 'APPROVED' ? 'Identity Verified' : 
                   kycStatus === 'SUBMITTED' ? 'Verification in Progress' : 
                   'Identity Unverified'}
                </h3>
                <p className="text-sm text-[#8c7164] font-medium">
                  {kycStatus === 'APPROVED' 
                    ? 'Your identity has been confirmed by the GoRentals team.'
                    : kycStatus === 'SUBMITTED'
                    ? 'We are currently reviewing your documents. Check back in 24h.'
                    : 'Complete identity verification to unlock all platform features.'}
                </p>
              </div>
            </div>
            {kycStatus !== 'APPROVED' && (
              <button 
                onClick={() => setRequestingKYC(true)}
                className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                  kycStatus === 'SUBMITTED'
                    ? 'bg-gray-100 text-[#8c7164] cursor-default'
                    : 'bg-[#f97316] text-white hover:bg-[#ea580c] shadow-lg shadow-[#f97316]/20'
                }`}
                disabled={kycStatus === 'SUBMITTED'}
              >
                {kycStatus === 'SUBMITTED' ? 'Documents Submitted' : 'Verify Identity'}
              </button>
            )}
          </div>
        </div>

        <KYCModal 
          isOpen={requestingKYC} 
          onClose={() => setRequestingKYC(false)} 
        />
      </div>
    </div>
  );
}
