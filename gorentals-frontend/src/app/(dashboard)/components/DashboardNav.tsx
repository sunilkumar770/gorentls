'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'

const RENTER_NAV = [
  { href: '/dashboard',           label: 'Overview',  emoji: '🏠' },
  { href: '/dashboard/bookings',  label: 'Bookings',  emoji: '📋' },
  { href: '/dashboard/messages',  label: 'Messages',  emoji: '💬' },
  { href: '/dashboard/profile',   label: 'Profile',   emoji: '👤' },
]

const OWNER_NAV = [
  { href: '/owner',               label: 'Overview',  emoji: '🏠' },
  { href: '/owner/listings',      label: 'Listings',  emoji: '🏷️' },
  { href: '/create-listing',      label: 'Create',    emoji: '➕' },
  { href: '/owner/bookings',      label: 'Bookings',  emoji: '📋' },
  { href: '/dashboard/messages',  label: 'Messages',  emoji: '💬' },
  { href: '/dashboard/profile',   label: 'Profile',   emoji: '👤' },
]

export default function DashboardNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const navLinks = user?.role === 'OWNER' ? OWNER_NAV : RENTER_NAV

  return (
    <nav className="
      sticky top-0 z-50 w-full
      bg-background/80 backdrop-blur-md dark:bg-background/80
      border-b border-border
      shadow-sm
    ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* LEFT: Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
              G
            </div>
            <span className="font-bold text-base text-foreground hidden sm:block">
              GoRentals
            </span>
          </Link>

          {/* CENTER: Nav Links */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-nowrap">
            {navLinks.map(({ href, label, emoji }) => {
              const isActive = pathname === href || 
                (href !== '/dashboard' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                    transition-all duration-200 whitespace-nowrap shrink-0
                    ${isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }
                  `}
                >
                  <span>{emoji}</span>
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Bell */}
            <Link
              href="/notifications"
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Bell size={18} />
            </Link>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Avatar + Name */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user?.fullName?.slice(0, 2).toUpperCase() ?? 'RT'}
              </div>
              <div className="hidden md:flex flex-col leading-tight max-w-[100px]">
                <span className="text-xs font-semibold text-foreground truncate">
                  {user?.fullName ?? 'renter'}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {user?.role?.toLowerCase() ?? 'Renter'}
                </span>
              </div>
            </div>

            {/* Sign Out */}
            <button
              onClick={logout}
              className="hidden md:block text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded hover:bg-muted"
            >
              Sign out
            </button>
          </div>

        </div>
      </div>
    </nav>
  )
}

