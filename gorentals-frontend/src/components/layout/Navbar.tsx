'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/contexts/ChatContext';
import {
  Search, Plus, LayoutDashboard, LogOut, User, ChevronDown,
  Calendar, ClipboardList, Shield, MessageCircle,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export function Navbar() {
  const { user, profile, isOwner, isAdmin, loading, logout } = useAuth();
  const { totalUnread } = useChat();
  const router   = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push('/login');
    router.refresh();
  };

  const navLinks = [
    { href: '/search',   label: 'Browse',   auth: false },
    { href: '/stores',   label: 'Stores',   auth: false },
    { href: '/messages', label: 'Messages', auth: true  },
    { href: '/help',     label: 'Help',     auth: false },
  ];

  const badgeClass = 'absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none';

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#e5e7eb]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-8 h-8 bg-[#16a34a] rounded-lg flex items-center justify-center text-white font-black text-sm flex-shrink-0">G</span>
              <span className="font-bold text-lg text-[#111827] tracking-tight">GoRentals</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => {
                if (link.auth && !user) return null;
                const isActive  = pathname.startsWith(link.href);
                const showBadge = link.href === '/messages' && totalUnread > 0;
                return (
                  <Link key={link.href} href={link.href}
                    className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'text-[#16a34a] bg-[#f0fdf4]' : 'text-[#374151] hover:text-[#111827] hover:bg-[#f9fafb]'
                    }`}>
                    {link.label}
                    {showBadge && (
                      <span className={badgeClass}>
                        {totalUnread > 99 ? '99+' : totalUnread}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <Link href="/search" className="p-2 rounded-lg text-[#6b7280] hover:text-[#111827] hover:bg-[#f9fafb] transition-colors md:hidden">
              <Search className="w-5 h-5" />
            </Link>

            {/* Mobile messages icon */}
            {user && (
              <Link href="/messages" className="relative p-2 rounded-lg text-[#6b7280] hover:text-[#111827] hover:bg-[#f9fafb] transition-colors md:hidden">
                <MessageCircle className="w-5 h-5" />
                {totalUnread > 0 && (
                  <span className={badgeClass}>{totalUnread > 9 ? '9+' : totalUnread}</span>
                )}
              </Link>
            )}

            {!loading && (
              <>
                {user ? (
                  <>
                    <Link href="/create-listing"
                      className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#16a34a] border border-[#16a34a] rounded-lg hover:bg-[#f0fdf4] transition-colors">
                      <Plus className="w-4 h-4" /> List item
                    </Link>

                    <div className="relative" ref={menuRef}>
                      <button onClick={() => setMenuOpen(o => !o)}
                        className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg border border-[#e5e7eb] hover:border-[#d1d5db] hover:bg-[#f9fafb] transition-colors">
                        <div className="w-7 h-7 rounded-full bg-[#f0fdf4] flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-[#16a34a]">
                            {profile?.fullName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <span className="hidden sm:block text-sm font-medium text-[#111827] max-w-[100px] truncate">
                          {profile?.fullName?.split(' ')[0] || 'Account'}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-[#6b7280] transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {menuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#e5e7eb] py-1 z-50">
                          <div className="px-4 py-3 border-b border-[#f3f4f6]">
                            <p className="text-sm font-semibold text-[#111827] truncate">{profile?.fullName || 'User'}</p>
                            <p className="text-xs text-[#6b7280] truncate mt-0.5">{user.email}</p>
                          </div>

                          {[
                            { href: '/dashboard',       label: 'My Rentals',       icon: LayoutDashboard },
                            { href: '/my-bookings',     label: 'My Bookings',      icon: Calendar       },
                          ].map(({ href, label, icon: Icon }) => (
                            <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f9fafb] hover:text-[#111827] transition-colors">
                              <Icon className="w-4 h-4 text-[#6b7280]" /> {label}
                            </Link>
                          ))}

                          {/* Messages with live badge in dropdown */}
                          <Link href="/messages" onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f9fafb] hover:text-[#111827] transition-colors">
                            <MessageCircle className="w-4 h-4 text-[#6b7280]" />
                            <span className="flex-1">Messages</span>
                            {totalUnread > 0 && (
                              <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                                {totalUnread > 99 ? '99+' : totalUnread}
                              </span>
                            )}
                          </Link>

                          {isAdmin && (
                            <Link href="/admin" onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#f97316] hover:bg-[#f97316]/5 transition-colors">
                              <Shield className="w-4 h-4 text-[#f97316]" /> Admin Control Center
                            </Link>
                          )}

                          {isOwner && (<>
                            <Link href="/owner/dashboard" onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f9fafb] hover:text-[#111827] transition-colors">
                              <LayoutDashboard className="w-4 h-4 text-[#6b7280]" /> Owner Dashboard
                            </Link>
                            <Link href="/owner/bookings" onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f9fafb] hover:text-[#111827] transition-colors">
                              <ClipboardList className="w-4 h-4 text-[#6b7280]" /> Manage Bookings
                            </Link>
                          </>)}

                          <Link href="/profile" onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f9fafb] hover:text-[#111827] transition-colors">
                            <User className="w-4 h-4 text-[#6b7280]" /> Profile & Settings
                          </Link>

                          <div className="border-t border-[#f3f4f6] mt-1 pt-1">
                            <button onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                              <LogOut className="w-4 h-4" /> Sign out
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="px-3 py-2 text-sm font-medium text-[#374151] hover:text-[#111827] hover:bg-[#f9fafb] rounded-lg transition-colors">Sign in</Link>
                    <Link href="/signup" className="px-4 py-2 text-sm font-semibold text-white bg-[#16a34a] rounded-lg hover:bg-[#15803d] transition-colors">Get started</Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
