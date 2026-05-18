'use client'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useChat } from '@/context/ChatContext'
import { useNotifications } from '@/hooks/useNotifications'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Menu, X, Bell } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function Navbar() {
  const { user, logout, isLoading } = useAuth()
  const { totalUnread: chatUnread } = useChat()
  const { unreadCount: notifUnread } = useNotifications(user?.id)
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Routes where the navbar should be hidden
  const hideNavbar = ['/login', '/signup', '/forgot-password'].includes(pathname)
  if (hideNavbar) return null

  // Dashboard routes get their own DashboardNav, so we hide the main Navbar there
  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/owner')
  if (isDashboard) return null

  const initials = user?.fullName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
      scrolled 
        ? 'py-3 bg-surface-base/80 backdrop-blur-md shadow-sm border-b border-border-subtle' 
        : 'py-5 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-500/20 group-hover:scale-110 transition-transform">G</div>
            <span className="font-bold text-text-primary text-xl tracking-tight hidden sm:block">GoRentals</span>
          </Link>

          {/* Navigation links */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/search" label="Browse" active={pathname.startsWith('/search')} />
            <NavLink href="/stores" label="Stores" active={pathname.startsWith('/stores')} />
            <NavLink href="/help" label="Help" active={pathname === '/help'} />
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2 sm:gap-6">
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>
            
            {!isLoading && (
              <>
                {user ? (
                  <div className="flex items-center gap-2 sm:gap-4">
                    {/* Notifications Link */}
                    <Link href="/dashboard/notifications" className="relative p-2 text-text-secondary hover:text-brand-500 transition-colors">
                      <Bell size={20} />
                      {notifUnread > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-status-error-text text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-surface-base">
                          {notifUnread > 9 ? '9+' : notifUnread}
                        </span>
                      )}
                    </Link>

                    {/* Inbox Link */}
                    <Link href="/dashboard/messages" className="relative p-2 text-text-secondary hover:text-brand-500 transition-colors">
                      <span className="text-xl">💬</span>
                      {chatUnread > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-status-error-text text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {chatUnread > 9 ? '9+' : chatUnread}
                        </span>
                      )}
                    </Link>
                    
                    {/* Profile Dropdown */}
                    <div className="relative" ref={menuRef}>
                      <button 
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex items-center gap-2 p-1 pl-3 rounded-full border border-border-subtle bg-surface-base hover:border-brand-300 transition-all shadow-sm"
                      >
                        <span className="text-xs font-bold text-text-secondary hidden sm:block">
                          {(user.fullName || 'User').split(' ')[0]}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-xs">
                          {initials}
                        </div>
                      </button>

                      {menuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-surface-base rounded-2xl shadow-xl border border-border-subtle py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="px-4 py-3 border-b border-border-subtle mb-1">
                            <p className="text-sm font-bold text-text-primary truncate">{user.fullName}</p>
                            <p className="text-xs text-text-muted truncate capitalize">{(user.role || 'RENTER').toLowerCase()}</p>
                          </div>
                          
                          <Link 
                            href={(user.role || 'RENTER') === 'OWNER' ? '/owner' : '/dashboard'} 
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-subtle transition-colors"
                            onClick={() => setMenuOpen(false)}
                          >
                            <span>🏠</span> Dashboard
                          </Link>
                          
                          <Link 
                            href="/dashboard/profile" 
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-subtle transition-colors"
                            onClick={() => setMenuOpen(false)}
                          >
                            <span>👤</span> Profile Settings
                          </Link>

                          {/* Theme Toggle inside desktop dropdown (optional but good for UX) */}
                          <div className="px-4 py-2 border-t border-border-subtle lg:hidden">
                             <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Appearance</p>
                             <ThemeToggle />
                          </div>

                          <div className="border-t border-border-subtle mt-1 pt-1">
                            <button 
                              onClick={() => { logout(); setMenuOpen(false); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-status-error-text hover:bg-status-error-bg/10 transition-colors"
                            >
                              <span>🚪</span> Sign out
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/login" className="px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors">
                      Sign in
                    </Link>
                    <Link 
                      href="/signup" 
                      className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-brand-500/20"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-text-secondary hover:bg-surface-subtle rounded-xl transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[60px] bg-surface-base/95 backdrop-blur-md z-[90] animate-in slide-in-from-top duration-300 overflow-y-auto border-t border-border-subtle">
          <div className="p-6 space-y-8">
            <div className="flex flex-col gap-2">
              <MobileNavLink href="/search" label="Browse" active={pathname.startsWith('/search')} onClick={() => setMobileMenuOpen(false)} />
              <MobileNavLink href="/stores" label="Stores" active={pathname.startsWith('/stores')} onClick={() => setMobileMenuOpen(false)} />
              <MobileNavLink href="/help" label="Help" active={pathname === '/help'} onClick={() => setMobileMenuOpen(false)} />
            </div>

            {/* Theme Section in Mobile Menu */}
            <div className="pt-8 border-t border-border-subtle">
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Appearance</p>
              <ThemeToggle />
            </div>
            
            {!user && (
              <div className="pt-8 border-t border-border-subtle flex flex-col gap-4">
                <Link 
                  href="/login" 
                  className="w-full py-4 text-center text-base font-bold text-text-primary border border-border-subtle rounded-2xl hover:bg-surface-subtle transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link 
                  href="/signup" 
                  className="w-full py-4 text-center text-base font-bold text-white bg-brand-500 rounded-2xl shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
        active 
          ? 'text-brand-600 dark:text-brand-400 bg-brand-selected border border-brand-selected-border/30' 
          : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
      }`}
    >
      {label}
    </Link>
  )
}

function MobileNavLink({ href, label, active, onClick }: { href: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={`px-4 py-4 rounded-2xl text-lg font-bold transition-all ${
        active 
          ? 'text-brand-600 dark:text-brand-400 bg-brand-selected' 
          : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      {label}
    </Link>
  )
}
