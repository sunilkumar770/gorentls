'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Search, Plus, LayoutDashboard, LogOut, User, ChevronDown, Calendar, ClipboardList, Shield, Bell } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';

/** Poll unread notification count every 30 s while logged in. */
function useUnreadCount(loggedIn: boolean) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!loggedIn) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('gr_token') : null;
      if (!token) return;
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
      const res = await fetch(`${base}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch { /* silently ignore — bell badge is non-critical */ }
  }, [loggedIn]);

  useEffect(() => {
    fetchCount();
    if (!loggedIn) return;
    const id = setInterval(fetchCount, 30_000);
    return () => clearInterval(id);
  }, [fetchCount, loggedIn]);

  return unreadCount;
}

export function Navbar() {
  const { user, profile, isOwner, isAdmin, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const unreadCount = useUnreadCount(!!user);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
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
    { href: '/search', label: 'Browse' },
    { href: '/stores', label: 'Stores' },
    { href: '/help', label: 'Help' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#e5e7eb]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-8 h-8 bg-[#16a34a] rounded-lg flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                G
              </span>
              <span className="font-bold text-lg text-[#111827] tracking-tight">GoRentals</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith(link.href)
                      ? 'text-[#16a34a] bg-[#f0fdf4]'
                      : 'text-[#374151] hover:text-[#111827] hover:bg-[#f9fafb]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search icon — mobile */}
            <Link
              href="/search"
              className="p-2 rounded-lg text-[#6b7280] hover:text-[#111827] hover:bg-[#f9fafb] transition-colors md:hidden"
            >
              <Search className="w-5 h-5" />
            </Link>

            {!loading && (
              <>
                {user ? (
                  <>
                    {/* Notification bell */}
                    <Link
                      href="/notifications"
                      title="Notifications"
                      className="relative p-2 rounded-lg text-[#6b7280] hover:text-[#111827] hover:bg-[#f9fafb] transition-colors"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>

                    {/* Add listing shortcut */}
                    <Link
                      href="/create-listing"
                      className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#16a34a] border border-[#16a34a] rounded-lg hover:bg-[#f0fdf4] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      List item
                    </Link>

                    {/* User avatar dropdown */}
                    <div className="relative" ref={menuRef}>
                      <button
                        onClick={() => setMenuOpen(o => !o)}
                        className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg border border-[#e5e7eb] hover:border-[#d1d5db] hover:bg-[#f9fafb] transition-colors"
                      >
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

                      {/* Dropdown */}
                      {menuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#e5e7eb] py-1 z-50">
                          {/* User info header */}
                          <div className="px-4 py-3 border-b border-[#f3f4f6]">
                            <p className="text-sm font-semibold text-[#111827] truncate">
                              {profile?.fullName || 'User'}
                            </p>
                            <p className="text-xs text-[#6b7280] truncate mt-0.5">{user.email}</p>
                          </div>

                          <Link
                            href="/dashboard"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f9fafb] hover:text-[#111827] transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 text-[#6b7280]" />
                            My Rentals
                          </Link>

                          <Link
                            href="/my-bookings"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f9fafb] hover:text-[#111827] transition-colors"
                          >
                            <Calendar className="w-4 h-4 text-[#6b7280]" />
                            My Bookings
                          </Link>

                          {isAdmin && (
                            <Link
                              href="/admin"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#f97316] hover:bg-[#f97316]/5 transition-colors"
                            >
                              <Shield className="w-4 h-4 text-[#f97316]" />
                              Admin Control Center
                            </Link>
                          )}

                          {isOwner && (
                            <>
                              <Link
                                href="/owner/dashboard"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f9fafb] hover:text-[#111827] transition-colors"
                              >
                                <LayoutDashboard className="w-4 h-4 text-[#6b7280]" />
                                Owner Dashboard
                              </Link>
                              
                              <Link
                                href="/owner/bookings"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f9fafb] hover:text-[#111827] transition-colors"
                              >
                                <ClipboardList className="w-4 h-4 text-[#6b7280]" />
                                Manage Bookings
                              </Link>
                            </>
                          )}

                          <Link
                            href="/profile"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f9fafb] hover:text-[#111827] transition-colors"
                          >
                            <User className="w-4 h-4 text-[#6b7280]" />
                            Profile & Settings
                          </Link>

                          <div className="border-t border-[#f3f4f6] mt-1 pt-1">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              Sign out
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="px-3 py-2 text-sm font-medium text-[#374151] hover:text-[#111827] hover:bg-[#f9fafb] rounded-lg transition-colors"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      className="px-4 py-2 text-sm font-semibold text-white bg-[#16a34a] rounded-lg hover:bg-[#15803d] transition-colors"
                    >
                      Get started
                    </Link>
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
