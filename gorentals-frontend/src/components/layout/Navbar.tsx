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

// ── GoRentals SVG Wordmark ────────────────────────────────────────
function GoRentalsLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group focus:outline-none">
      <svg
        width="32" height="32" viewBox="0 0 32 32" fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 group-hover:scale-105 transition-transform"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="9" fill="#01696f"/>
        <path
          d="M10 16.5C10 13.46 12.46 11 15.5 11C17.36 11 19.02 11.94 20 13.38L17.5 14.9C17.06 14.34 16.32 14 15.5 14C14.12 14 13 15.12 13 16.5C13 17.88 14.12 19 15.5 19H17V17.5H15.5V15.5H19.5V19C19.5 20.66 17.88 22 15.5 22C12.46 22 10 19.54 10 16.5Z"
          fill="white"
        />
      </svg>
      <span
        className="font-display text-xl font-bold text-[#1a1a18] tracking-tight"
        style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}
      >
        GoRentals
      </span>
    </Link>
  );
}

export function Navbar() {
  const { user, profile, isOwner, isAdmin, loading, logout } = useAuth();
  const { totalUnread } = useChat();
  const router   = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Track scroll position to apply stronger shadow when scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    <nav
      className={`sticky top-0 z-50 transition-shadow duration-200 ${
        scrolled
          ? 'bg-[#f7f6f2]/90 backdrop-blur-xl backdrop-saturate-150 shadow-[0_1px_0_rgba(1,105,111,0.1),0_4px_24px_rgba(0,0,0,0.06)]'
          : 'bg-[#f7f6f2]/80 backdrop-blur-md shadow-[0_1px_0_rgba(1,105,111,0.08)]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <div className="flex items-center gap-8">
            <GoRentalsLogo />

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => {
                if (link.auth && !user) return null;
                const isActive  = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                const showBadge = link.href === '/messages' && totalUnread > 0;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isActive
                        ? 'text-[#01696f] nav-underline'
                        : 'text-[#6b6b65] hover:text-[#1a1a18] hover:bg-black/5'
                    }`}
                  >
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
            <Link href="/search" className="p-2 rounded-lg text-[#6b6b65] hover:text-[#1a1a18] hover:bg-black/5 transition-colors md:hidden">
              <Search className="w-5 h-5" />
            </Link>

            {/* Mobile messages icon */}
            {user && (
              <Link href="/messages" className="relative p-2 rounded-lg text-[#6b6b65] hover:text-[#1a1a18] hover:bg-black/5 transition-colors md:hidden">
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
                      className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#01696f] rounded-xl hover:bg-[#015a5f] transition-colors shadow-sm">
                      <Plus className="w-4 h-4" /> List item
                    </Link>

                    <div className="relative" ref={menuRef}>
                      <button onClick={() => setMenuOpen(o => !o)}
                        className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl border border-[#01696f]/20 hover:border-[#01696f]/40 hover:bg-[#01696f]/5 transition-all">
                        <div className="w-7 h-7 rounded-full bg-[#01696f]/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-[#01696f]">
                            {profile?.fullName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <span className="hidden sm:block text-sm font-medium text-[#1a1a18] max-w-[100px] truncate">
                          {profile?.fullName?.split(' ')[0] || 'Account'}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-[#6b6b65] transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {menuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#01696f]/10 py-1 z-50">
                          <div className="px-4 py-3 border-b border-[#f3f4f6]">
                            <p className="text-sm font-semibold text-[#1a1a18] truncate">{profile?.fullName || 'User'}</p>
                            <p className="text-xs text-[#6b6b65] truncate mt-0.5">{user.email}</p>
                          </div>

                          {[
                            { href: '/dashboard',   label: 'My Rentals',  icon: LayoutDashboard },
                            { href: '/my-bookings', label: 'My Bookings', icon: Calendar       },
                          ].map(({ href, label, icon: Icon }) => (
                            <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f7f6f2] hover:text-[#1a1a18] transition-colors">
                              <Icon className="w-4 h-4 text-[#6b6b65]" /> {label}
                            </Link>
                          ))}

                          <Link href="/messages" onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f7f6f2] hover:text-[#1a1a18] transition-colors">
                            <MessageCircle className="w-4 h-4 text-[#6b6b65]" />
                            <span className="flex-1">Messages</span>
                            {totalUnread > 0 && (
                              <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                                {totalUnread > 99 ? '99+' : totalUnread}
                              </span>
                            )}
                          </Link>

                          {isAdmin && (
                            <Link href="/admin" onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#01696f] hover:bg-[#01696f]/5 transition-colors">
                              <Shield className="w-4 h-4 text-[#01696f]" /> Admin Control Center
                            </Link>
                          )}

                          {isOwner && (<>
                            <Link href="/owner/dashboard" onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f7f6f2] hover:text-[#1a1a18] transition-colors">
                              <LayoutDashboard className="w-4 h-4 text-[#6b6b65]" /> Owner Dashboard
                            </Link>
                            <Link href="/owner/bookings" onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f7f6f2] hover:text-[#1a1a18] transition-colors">
                              <ClipboardList className="w-4 h-4 text-[#6b6b65]" /> Manage Bookings
                            </Link>
                          </>)}

                          <Link href="/profile" onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f7f6f2] hover:text-[#1a1a18] transition-colors">
                            <User className="w-4 h-4 text-[#6b6b65]" /> Profile &amp; Settings
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
                    {/* Ghost Sign in */}
                    <Link
                      href="/login"
                      className="px-4 py-2 text-sm font-semibold text-[#6b6b65] hover:text-[#1a1a18] hover:bg-black/5 rounded-lg transition-colors"
                    >
                      Sign in
                    </Link>
                    {/* Solid primary CTA */}
                    <Link
                      href="/signup"
                      className="px-5 py-2.5 text-sm font-bold text-white bg-[#01696f] rounded-xl hover:bg-[#015a5f] transition-colors shadow-sm"
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
