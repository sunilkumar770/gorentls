'use client';

import { useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Globe, 
  Mail, 
  Lock, 
  Trash2, 
  Smartphone,
  ChevronRight,
  ShieldCheck,
  Zap,
  Check
} from 'lucide-react';

const SECTIONS = [
  { id: 'personal', name: 'Personal Information', icon: User },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'security', name: 'Privacy & Security', icon: Shield },
  { id: 'payments', name: 'Payments', icon: CreditCard },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('personal');

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-text tracking-tight">Settings</h1>
        <p className="text-muted mt-2">Manage your account preferences and security.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar Nav */}
        <div className="lg:w-72 space-y-2">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-3xl text-sm font-bold transition-all ${
                activeTab === section.id 
                  ? 'bg-card text-[#4F46E5] shadow-sm shadow-slate-100/50' 
                  : 'text-muted hover:bg-card/50 hover:text-text'
              }`}
            >
              <section.icon className={`w-5 h-5 ${activeTab === section.id ? 'text-[#4F46E5]' : 'text-faint'}`} />
              {section.name}
              {activeTab === section.id && <div className="ml-auto w-1.5 h-1.5 bg-[#4F46E5] rounded-full" />}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-card rounded-[3rem] p-10 shadow-sm shadow-slate-100/50 min-h-[500px]">
          {activeTab === 'personal' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="relative group">
                  <div className="w-24 h-24 bg-indigo-100 rounded-[2rem] flex items-center justify-center text-[#4F46E5] text-3xl font-black">JD</div>
                  <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-card border-4 border-border rounded-xl flex items-center justify-center text-muted shadow-md">
                    <User className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-bold text-text">Profile Photo</h3>
                  <p className="text-sm text-faint mt-1">PNG or JPG up to 5MB.</p>
                  <div className="flex gap-3 mt-4">
                    <button className="px-5 py-2 bg-[#4F46E5] text-white rounded-xl text-xs font-bold hover:bg-[#4338CA] transition-colors">Upload New</button>
                    <button className="px-5 py-2 bg-subtle text-muted rounded-xl text-xs font-bold hover:bg-subtle transition-colors">Remove</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-faint uppercase tracking-widest ml-1">Full Name</label>
                  <input defaultValue="John Doe" className="w-full h-12 px-5 bg-subtle rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all border-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-faint uppercase tracking-widest ml-1">Email Address</label>
                  <input defaultValue="john.doe@example.com" className="w-full h-12 px-5 bg-subtle rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all border-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-faint uppercase tracking-widest ml-1">Phone Number</label>
                  <input defaultValue="+91 98765 43210" className="w-full h-12 px-5 bg-subtle rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all border-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-faint uppercase tracking-widest ml-1">Location</label>
                  <input defaultValue="Hyderabad, Telangana" className="w-full h-12 px-5 bg-subtle rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all border-none" />
                </div>
              </div>

              <div className="pt-6">
                <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div>
                <h3 className="text-xl font-bold text-text">Email Notifications</h3>
                <p className="text-sm text-muted mt-1">Manage which updates you receive via email.</p>
              </div>

              <div className="space-y-2">
                {[
                  { title: 'Booking Requests', desc: 'Get notified when someone wants to rent your item.', checked: true },
                  { title: 'New Messages', desc: 'Alerts for incoming chat messages from owners/renters.', checked: true },
                  { title: 'Promotional Offers', desc: 'Occasional discounts and platform updates.', checked: false },
                  { title: 'Security Alerts', desc: 'Crucial notifications about your account safety.', checked: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-6 bg-subtle rounded-[2rem] group hover:bg-indigo-50/30 transition-colors">
                    <div>
                      <p className="font-bold text-text">{item.title}</p>
                      <p className="text-xs text-faint mt-0.5">{item.desc}</p>
                    </div>
                    <button className={`w-12 h-6 rounded-full relative transition-colors ${item.checked ? 'bg-[#4F46E5]' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-card rounded-full transition-all ${item.checked ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="p-8 bg-indigo-50/50 rounded-[2.5rem] flex items-center gap-6">
                <div className="w-14 h-14 bg-card rounded-2xl flex items-center justify-center text-[#4F46E5] shadow-sm">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-text">Two-Factor Authentication</h3>
                  <p className="text-xs text-indigo-700 font-semibold mt-0.5">Currently Enabled · Protects your account with an extra layer of security.</p>
                </div>
                <button className="ml-auto px-5 py-2.5 bg-card text-text rounded-xl text-xs font-bold shadow-sm">Manage</button>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold text-text">Change Password</h3>
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-faint uppercase tracking-widest ml-1">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                      <input type="password" placeholder="••••••••" className="w-full h-12 pl-11 pr-5 bg-subtle rounded-2xl text-sm font-medium focus:outline-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-faint uppercase tracking-widest ml-1">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                      <input type="password" placeholder="••••••••" className="w-full h-12 pl-11 pr-5 bg-subtle rounded-2xl text-sm font-medium focus:outline-none" />
                    </div>
                  </div>
                  <button className="px-8 py-3.5 bg-[#4F46E5] text-white rounded-2xl text-sm font-bold hover:bg-[#4338CA] transition-all">Update Password</button>
                </div>
              </div>

              <div className="pt-10 border-t-2 border-border">
                <h3 className="text-lg font-bold text-rose-600 mb-4 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" /> Danger Zone
                </h3>
                <p className="text-sm text-muted mb-6 leading-relaxed">Once you delete your account, there is no going back. Please be certain.</p>
                <button className="px-8 py-3.5 border-2 border-rose-100 text-rose-500 rounded-2xl text-sm font-bold hover:bg-rose-50 transition-colors">
                  Delete My Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
