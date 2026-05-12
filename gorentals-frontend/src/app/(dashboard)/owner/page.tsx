// src/app/(dashboard)/owner/page.tsx
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Typography } from '@/components/ui/Typography'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { EarningsChart } from '@/components/analytics/EarningsChart'
import { AlertCircle, TrendingUp, Info } from 'lucide-react'

async function getOwnerData(ownerId: string, token: string) {
  const base = process.env.NEXT_PUBLIC_API_URL
  const headers = { Authorization: `Bearer ${token}` }
  try {
    const [listingsRes, bookingRequestsRes, earningsRes, statsRes] = await Promise.all([
      fetch(`${base}/api/items/owner/mine`, { headers, cache: 'no-store' }),
      fetch(`${base}/api/bookings/owner/bookings?status=PENDING`, { headers, cache: 'no-store' }),
      fetch(`${base}/api/earnings/owner/current`, { headers, cache: 'no-store' }),
      fetch(`${base}/api/bookings/owner/stats?period=8weeks`, { headers, cache: 'no-store' }),
    ])
    return {
      listings: listingsRes.ok ? (await listingsRes.json()).content || [] : [],
      pendingBookings: bookingRequestsRes.ok ? (await bookingRequestsRes.json()).content || [] : [],
      earnings: earningsRes.ok ? await earningsRes.json() : null,
      stats: statsRes.ok ? await statsRes.json() : [],
    }
  } catch {
    return { listings: [], pendingBookings: [], earnings: null, stats: [] }
  }
}

export default async function OwnerDashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('gorentals_token')?.value ?? ''
  const user = await getCurrentUser()

  if (!user) redirect('/login?from=/owner')
  if (user.role !== 'OWNER' && user.role !== 'ADMIN') redirect('/dashboard')

  const { listings, pendingBookings, earnings, stats } = await getOwnerData(user.id, token)

  return (
    <div className="space-y-8 animate-in fade-in duration-normal">
      {/* KYC Alert if not verified */}
      {!user.isVerified && (
        <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 p-4">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <Typography variant="body-md" className="font-bold text-amber-900 dark:text-amber-100">
                KYC Verification Required
              </Typography>
              <Typography variant="body-sm" className="mt-0.5 text-amber-700 dark:text-amber-400">
                Your listings are currently held in draft mode. Complete your identity verification to start accepting bookings and earning.
              </Typography>
              <Button asChild variant="secondary" size="sm" className="mt-3 bg-white dark:bg-slate-900 border-amber-200 hover:bg-amber-100">
                <Link href="/dashboard/profile">Complete Verification</Link>
              </Button>
            </div>
          </div>
        </Card>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Typography variant="h2">
            {user.storeName ?? `${user.fullName.split(' ')[0]}'s Store`}
          </Typography>
          <div className="flex items-center gap-2 mt-1">
            <Typography variant="body-sm" className="font-medium text-text-secondary">
              Owner Dashboard
            </Typography>
            {user.isVerified && (
              <Badge variant="success" dot size="sm">KYC VERIFIED</Badge>
            )}
          </div>
        </div>
        <Button asChild variant="primary" size="lg">
          <Link href="/owner/listings/new">+ Create Listing</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatItem label="Listings" value={listings.length} />
        <StatItem label="Requests" value={pendingBookings.length} highlight={pendingBookings.length > 0} />
        <Link href="/owner/drafts">
          <StatItem label="Drafts" value="View" highlight={!user.isVerified} />
        </Link>
        <StatItem 
          label="This Month" 
          value={earnings?.totalEarned != null ? `₹${earnings.totalEarned.toLocaleString('en-IN')}` : '₹0'} 
          variant="success"
        />
        <StatItem 
          label="Payouts" 
          value={earnings?.pendingPayout != null ? `₹${earnings.pendingPayout.toLocaleString('en-IN')}` : '₹0'} 
        />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <Typography variant="h4" className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Earnings Trend
            </Typography>
            <Typography variant="body-xs" className="font-bold text-slate-500 uppercase tracking-wider">
              Last 7 Days
            </Typography>
          </div>
          <Card className="p-6">
            <EarningsChart data={stats} />
          </Card>
        </section>

        <section className="space-y-4">
          <Typography variant="h4" className="flex items-center gap-2">
            <Info className="w-5 h-5 text-indigo-600" />
            Performance Tips
          </Typography>
          <div className="space-y-3">
            <TipCard 
              icon="📸" 
              title="Add 5 High-Quality Photos" 
              desc="Listings with more photos get 2.4x more inquiries." 
            />
            <TipCard 
              icon="⚡" 
              title="Faster Response Time" 
              desc="Replying within 1 hour boosts your visibility." 
            />
            <TipCard 
              icon="🛡️" 
              title="Review Descriptions" 
              desc="Mention included accessories clearly to avoid disputes." 
            />
          </div>
        </section>
      </div>

      {/* Pending requests */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <Typography variant="h4" className="flex items-center gap-2">
            New Requests
            {pendingBookings.length > 0 && (
              <Badge variant="warning" size="sm">{pendingBookings.length}</Badge>
            )}
          </Typography>
          <Link href="/owner/bookings" className="text-sm text-brand-600 font-semibold hover:underline">
            Manage all
          </Link>
        </div>
        {pendingBookings.length === 0 ? (
          <EmptyState
            icon="📋"
            title="All caught up"
            description="New rental requests from customers will show up here."
          />
        ) : (
          <div className="space-y-3">
            {pendingBookings.slice(0, 5).map((booking: any) => (
              <BookingRequestCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </section>

      {/* Inventory */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <Typography variant="h4">Your Inventory</Typography>
          <Link href="/owner/listings" className="text-sm text-brand-600 font-semibold hover:underline">
            Manage items
          </Link>
        </div>
        {listings.length === 0 ? (
          <EmptyState
            icon="🏷️"
            title="No active listings"
            description="Add your first item to start earning today."
            action={<Button asChild variant="secondary" size="sm"><Link href="/owner/listings/new">Add Item</Link></Button>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.slice(0, 6).map((item: any) => (
              <OwnerListingCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatItem({ label, value, highlight, variant }: { label: string; value: any; highlight?: boolean; variant?: 'success' | 'brand' }) {
  return (
    <Card 
      interactive
      variant={highlight ? 'raised' : 'default'}
      className={highlight ? 'border-brand-300 dark:border-brand-700 bg-brand-50/10' : ''}
    >
      <Typography variant="h3" className={cn(
        variant === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 
        highlight ? 'text-brand-600 dark:text-brand-400' : 'text-text-primary'
      )}>
        {value}
      </Typography>
      <Typography variant="label" className="mt-1 block">{label}</Typography>
    </Card>
  )
}

function BookingRequestCard({ booking }: { booking: any }) {
  return (
    <Card variant="bordered" className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 hover:bg-surface-subtle transition-all group">
      <div className="flex-1 min-w-0">
        <Typography variant="body-md" className="font-bold text-text-primary">
          {booking.renterName ?? 'Customer'} wants {booking.listing?.title}
        </Typography>
        <Typography variant="body-xs" className="mt-1">
          {new Date(booking.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} –{' '}
          {new Date(booking.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          {' · '} <span className="font-bold text-text-primary">₹{booking.totalAmount?.toLocaleString('en-IN')}</span>
        </Typography>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button variant="success" size="sm" className="flex-1 sm:flex-none">Accept</Button>
        <Button variant="secondary" size="sm" className="flex-1 sm:flex-none">Decline</Button>
      </div>
    </Card>
  )
}

function OwnerListingCard({ item }: { item: any }) {
  return (
    <Card padding="none" interactive className="overflow-hidden group">
      <div className="aspect-[4/3] bg-surface-raised relative overflow-hidden">
        {item.images?.[0] ? (
          <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="flex items-center justify-center h-full text-text-tertiary text-4xl">📷</div>
        )}
        <div className="absolute top-3 right-3">
          <Badge variant="success" size="sm">Active</Badge>
        </div>
      </div>
      <div className="p-4">
        <Typography variant="body-sm" className="font-bold text-text-primary truncate">{item.title}</Typography>
        <div className="flex items-center justify-between mt-3">
          <Typography variant="body-md" className="font-extrabold text-brand-600">
            ₹{item.pricePerDay?.toLocaleString('en-IN')}/day
          </Typography>
          <Link
            href={`/owner/listings/${item.id}/edit`}
            className="text-xs font-bold text-text-tertiary hover:text-brand-600 transition-colors"
          >
            EDIT
          </Link>
        </div>
      </div>
    </Card>
  )
}

function TipCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <Card variant="bordered" className="p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
      <div className="flex gap-3">
        <span className="text-xl shrink-0">{icon}</span>
        <div>
          <Typography variant="body-sm" className="font-bold leading-none">{title}</Typography>
          <Typography variant="body-xs" className="mt-1 leading-relaxed text-slate-500">{desc}</Typography>
        </div>
      </div>
    </Card>
  )
}

import { cn } from '@/lib/utils'
