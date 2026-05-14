// src/app/(dashboard)/dashboard/page.tsx
import { getApiUrl } from '@/lib/api-utils'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { BookingCard } from '../components/BookingCard'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Typography } from '@/components/ui/Typography'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { MessagePreview } from '../components/MessagePreview'

async function getRenterData(userId: string, token: string) {
  const headers = { Authorization: `Bearer ${token}` }
  try {
    const [bookingsRes, messagesRes] = await Promise.all([
      fetch(getApiUrl(`/bookings?userId=${userId}&limit=5`), { headers, cache: 'no-store' }),
      fetch(getApiUrl(`/conversations?userId=${userId}&limit=3`), { headers, cache: 'no-store' }),
    ])
    return {
      bookings: bookingsRes.ok ? await bookingsRes.json() : [],
      messages: messagesRes.ok ? await messagesRes.json() : [],
    }
  } catch {
    return { bookings: [], messages: [] }
  }
}

export default async function RenterDashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('gorentals_token')?.value ?? ''
  const user = await getCurrentUser()
  if (!user) redirect('/login?from=/dashboard')

  const { bookings, messages } = await getRenterData(user.id, token)
  const activeBookings = bookings.filter((b: any) => b.status === 'ACTIVE')
  const upcomingBookings = bookings.filter((b: any) => b.status === 'UPCOMING')

  return (
    <div className="space-y-8 animate-in fade-in duration-normal">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar 
            src={user.avatarUrl} 
            name={user.fullName} 
            size="xl" 
            className="rounded-2xl" 
          />
          <div>
            <Typography variant="h2">
              Hey {user.fullName.split(' ')[0]},
            </Typography>
            <Typography variant="body-sm" className="font-medium text-text-secondary">
              You're logged in as a <span className="text-brand-600 capitalize">{user.role.toLowerCase()}</span>
            </Typography>
          </div>
        </div>
        <Button asChild variant="primary" size="lg">
          <Link href="/search">Explore Gear</Link>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Active Rentals"
          value={activeBookings.length}
          icon="🔑"
          empty="No active gear"
          variant="success"
        />
        <StatCard
          label="Upcoming"
          value={upcomingBookings.length}
          icon="📅"
          empty="Nothing planned"
          variant="info"
        />
        <StatCard
          label="Unread Messages"
          value={messages.filter((m: any) => m.unreadCount > 0).length}
          icon="💬"
          empty="Inbox empty"
          variant="brand"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active bookings */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <Typography variant="h4">Rentals</Typography>
            <Link
              href="/dashboard/bookings"
              className="text-sm text-brand-600 hover:underline font-semibold"
            >
              See all
            </Link>
          </div>
          {bookings.length === 0 ? (
            <EmptyState
              icon="📦"
              title="No bookings found"
              description="Your active and upcoming rentals will appear here."
              action={<Button asChild variant="secondary" size="sm"><Link href="/search">Start Browsing</Link></Button>}
            />
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 4).map((booking: any) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </section>

        {/* Recent messages */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <Typography variant="h4">Messages</Typography>
            <Link
              href="/dashboard/messages"
              className="text-sm text-brand-600 hover:underline font-semibold"
            >
              Inbox
            </Link>
          </div>
          {messages.length === 0 ? (
            <EmptyState
              icon="💬"
              title="No chats yet"
              description="Conversations with owners will show up here."
            />
          ) : (
            <div className="space-y-3">
              {messages.map((msg: any) => (
                <MessagePreview key={msg.id} conversation={msg} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Owner CTA */}
      {user.role === 'RENTER' && (
        <Card variant="default" className="bg-brand-600 p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative border-none">
          <div className="relative z-10 text-center md:text-left">
            <Typography variant="h3" className="text-white">List your own gear</Typography>
            <Typography variant="body-sm" className="text-brand-50 mt-2 max-w-sm">
              Join thousands of owners earning passive income from their cameras, tools, and equipment.
            </Typography>
          </div>
          <Button asChild variant="secondary" size="lg" className="relative z-10 bg-white text-brand-600 hover:bg-brand-50 border-none">
            <Link href="/signup?role=OWNER">Become an Owner</Link>
          </Button>
          {/* Abstract decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-400/20 rounded-full -ml-10 -mb-10 blur-2xl" />
        </Card>
      )}
    </div>
  )
}

function StatCard({
  label, value, icon, empty, variant
}: {
  label: string; value: number; icon: string; empty: string; variant: 'success' | 'info' | 'brand'
}) {
  const styles = {
    success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    info: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400',
  }

  return (
    <Card interactive padding="lg" className="flex flex-col">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4 ${styles[variant]}`}>
        {icon}
      </div>
      <Typography variant="h2" className="mb-1">{value}</Typography>
      <Typography variant="body-sm" className="font-semibold text-text-tertiary">
        {value === 0 ? empty : label}
      </Typography>
    </Card>
  )
}

