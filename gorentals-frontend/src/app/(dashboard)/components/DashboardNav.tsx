// src/app/(dashboard)/components/DashboardNav.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import type { AuthUser } from '@/context/AuthContext'
import { Logo } from '@/components/ui/Logo'
import { Avatar } from '@/components/ui/Avatar'
import { Typography, Body } from '@/components/ui/Typography'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Bell } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'

const RENTER_NAV = [
  { href: '/dashboard',           label: 'Overview',  icon: '🏠' },
  { href: '/dashboard/bookings',  label: 'Bookings',  icon: '📋' },
  { href: '/dashboard/messages',  label: 'Messages',  icon: '💬' },
  { href: '/dashboard/profile',   label: 'Profile',   icon: '👤' },
]

const OWNER_NAV = [
  { href: '/owner',               label: 'Overview',  icon: '🏠' },
  { href: '/owner/listings',      label: 'Listings',  icon: '🏷️' },
  { href: '/owner/bookings',      label: 'Bookings',  icon: '📋' },
  { href: '/dashboard/messages',  label: 'Messages',  icon: '💬' },
  { href: '/dashboard/profile',   label: 'Profile',   icon: '👤' },
]

export function DashboardNav({ user }: { user: AuthUser }) {
  const pathname = usePathname()
  const { logout } = useAuth()
  const { unreadCount } = useNotifications(user?.id)
  const nav = user.role === 'OWNER' ? OWNER_NAV : RENTER_NAV

  return (
    <nav className="border-b border-border-subtle bg-surface-base sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo />

          {/* Nav items — horizontal on desktop */}
          <div className="hidden md:flex items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors min-h-[40px]',
                  pathname === item.href
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/50 dark:text-brand-400'
                    : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
                )}
              >
                <span className="text-base" aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* User section */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Link 
              href="/dashboard/notifications" 
              className="relative p-2 text-text-secondary hover:text-brand-600 transition-colors"
              title="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-950">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <div className="flex items-center gap-2">
              <Avatar name={user.fullName} size="sm" />
              <div className="hidden sm:block text-left">
                <Typography variant="body-xs" className="font-bold text-text-primary leading-tight">
                  {(user?.fullName || 'User').split(' ')[0]}
                </Typography>
                <Typography variant="body-xs" className="capitalize leading-tight">
                  {(user.role || 'RENTER').toLowerCase()}
                </Typography>
              </div>
            </div>
            <div className="sm:hidden">
               <ThemeToggle />
            </div>
            <button
              onClick={logout}
              className="text-xs text-text-tertiary hover:text-text-primary font-medium transition-colors px-3 py-2 rounded-lg hover:bg-surface-subtle min-h-[40px]"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <div className="md:hidden flex items-center gap-1 pb-2 overflow-x-auto no-scrollbar">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'shrink-0 flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-[10px] font-medium transition-colors min-h-[48px] justify-center',
                pathname === item.href
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/50 dark:text-brand-400'
                  : 'text-text-tertiary'
              )}
            >
              <span className="text-base" aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

