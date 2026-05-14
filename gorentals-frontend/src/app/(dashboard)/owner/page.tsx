// src/app/(dashboard)/owner/page.tsx
import { getApiUrl } from '@/lib/api-utils'
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
import { 
  AlertCircle, TrendingUp, ShieldCheck, 
  Package, Calendar, DollarSign, ArrowUpRight,
  Clock, CheckCircle2, XCircle, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types matching OwnerAnalyticsDTO from OwnerAnalyticsService ───────────────
interface RevenuePoint {
  week: string
  revenue: number
}

interface RecentBooking {
  id: string
  renterName: string
  listingTitle: string
  startDate: string
  endDate: string
  totalAmount: number
  status: string
}

interface OwnerAnalytics {
  totalRevenue: number
  pendingRevenue: number
  totalBookings: number
  confirmedBookings: number
  pendingBookings: number
  rejectedBookings: number
  completionRate: number
  activeListings: number
  totalListings: number
  averageBookingValue: number
  recentBookings: RecentBooking[]
  revenueChart: RevenuePoint[]
}

// ── Data fetcher ─────────────────────────────────────────────────────────────
async function getOwnerData(token: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
  const headers = { Authorization: `Bearer ${token}` }

  try {
    const [listingsRes, bookingsRes, analyticsRes] = await Promise.all([
      fetch(getApiUrl('/listings/owner/mine'), { headers, next: { revalidate: 60 } }),
      fetch(getApiUrl('/bookings/owner/bookings'), { headers, next: { revalidate: 60 } }),
      fetch(getApiUrl('/owner/analytics'), { headers, next: { revalidate: 60 } })
    ])

    if (!analyticsRes.ok) throw new Error('Failed to fetch analytics')

    const listings = listingsRes.ok ? await listingsRes.json() : []
    const bookings = bookingsRes.ok ? await bookingsRes.json() : []
    const analytics: OwnerAnalytics = await analyticsRes.json()

    return { listings, bookings, analytics }
  } catch (error) {
    console.error('Owner dashboard fetch error:', error)
    return null
  }
}

export default async function OwnerDashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('gorentals_token')?.value
  if (!token) redirect('/login')

  const data = await getOwnerData(token)
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <Typography variant="h3" className="mb-2">Dashboard Unavailable</Typography>
        <Typography variant="body-md" className="text-slate-500 mb-6">
          There was a problem connecting to the server. Please check your connection.
        </Typography>
        <Link href="/owner">
          <Button>Retry Connection</Button>
        </Link>
      </div>
    )
  }

  const { analytics } = data

  const stats = [
    { label: 'Total Revenue', value: `₹${(analytics.totalRevenue ?? 0).toLocaleString()}`, subValue: `₹${(analytics.pendingRevenue ?? 0).toLocaleString()} pending`, icon: DollarSign, color: 'emerald' },
    { label: 'Active Listings', value: analytics.activeListings ?? 0, subValue: `out of ${analytics.totalListings ?? 0}`, icon: Package, color: 'indigo' },
    { label: 'Total Bookings', value: analytics.totalBookings ?? 0, subValue: `${analytics.completionRate ?? 0}% completion`, icon: Calendar, color: 'amber' },
    { label: 'Avg. Booking', value: `₹${(analytics.averageBookingValue ?? 0).toLocaleString()}`, subValue: 'per rental', icon: TrendingUp, color: 'violet' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Typography variant="h1" className="text-3xl font-bold tracking-tight">Dashboard Overview</Typography>
          <div className="flex items-center gap-2 mt-2 text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <Typography variant="body-sm">Your store is active and generating revenue</Typography>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/owner/listings/new">
            <Button size="lg" className="rounded-2xl shadow-lg shadow-indigo-500/20">
              <Package className="w-4 h-4 mr-2" />
              Add New Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="p-6 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <Typography variant="label" className="text-slate-400 uppercase tracking-widest text-[10px] mb-2">
                  {stat.label}
                </Typography>
                <Typography variant="h2" className="text-2xl font-bold">{stat.value}</Typography>
                <Typography variant="body-xs" className="text-slate-500 mt-1 flex items-center gap-1 font-medium">
                  {stat.subValue}
                </Typography>
              </div>
              <div className={cn(
                "p-3 rounded-2xl",
                stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                stat.color === 'indigo' ? "bg-indigo-50 text-indigo-600" :
                stat.color === 'amber' ? "bg-amber-50 text-amber-600" :
                "bg-violet-50 text-violet-600"
              )}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <Card className="lg:col-span-2 p-8 border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Typography variant="h3" className="text-xl font-bold">Revenue Performance</Typography>
              <Typography variant="body-sm" className="text-slate-500">Weekly earnings trends for your gear</Typography>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-xs font-bold">
              <ArrowUpRight className="w-3 h-3" />
              {analytics.completionRate}%
            </div>
          </div>
          <div className="h-[350px] w-full">
            <EarningsChart data={analytics.revenueChart} />
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-8 border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <Typography variant="h3" className="text-xl font-bold">Recent Requests</Typography>
            <Link href="/owner/bookings" className="text-indigo-600 text-xs font-bold hover:underline flex items-center gap-1">
              View All
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-6">
            {analytics.recentBookings.length > 0 ? (
              analytics.recentBookings.map((booking) => (
                <div key={booking.id} className="group relative flex items-start gap-4 pb-6 border-b border-slate-50 dark:border-slate-800 last:border-0 last:pb-0">
                  <div className={cn(
                    "mt-1 p-2 rounded-xl shrink-0",
                    booking.status === 'PENDING' ? "bg-amber-50 text-amber-600" :
                    booking.status === 'CONFIRMED' ? "bg-emerald-50 text-emerald-600" :
                    "bg-slate-50 text-slate-400"
                  )}>
                    {booking.status === 'PENDING' ? <Clock className="w-4 h-4" /> :
                     booking.status === 'CONFIRMED' ? <CheckCircle2 className="w-4 h-4" /> :
                     <XCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <Typography variant="body-sm" className="font-bold truncate text-slate-900 dark:text-white">
                        {booking.listingTitle}
                      </Typography>
                      <Typography variant="body-xs" className="font-bold text-emerald-600 whitespace-nowrap">
                        ₹{(booking.totalAmount ?? 0).toLocaleString()}
                      </Typography>
                    </div>
                    <Typography variant="body-xs" className="text-slate-500 mt-0.5">
                      requested by {booking.renterName}
                    </Typography>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant={booking.status === 'PENDING' ? 'warning' : booking.status === 'CONFIRMED' ? 'brand' : 'neutral'} size="sm">
                        {booking.status}
                      </Badge>
                      <Typography variant="body-xs" className="text-slate-400 text-[10px] uppercase font-bold">
                        {booking.startDate ? new Date(booking.startDate).toLocaleDateString() : '—'}
                      </Typography>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <Typography variant="body-sm" className="text-slate-400">No recent activity</Typography>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
