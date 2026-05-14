import { ListingCard } from './ListingCard'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Typography, H2, Body } from '@/components/ui/Typography'
import { EmptyState } from '@/components/ui/EmptyState'

interface Listing {
  id: string
  title: string
  images?: string[]
  pricePerDay: number
  location?: string
  category?: string
  condition?: string
  owner?: { fullName: string; isVerified?: boolean }
}

export function ListingGrid({ listings }: { listings: Listing[] }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <H2>Available near you</H2>
          <Body subtle className="mt-2">
            Professional gear, verified owners, local pickup.
          </Body>
        </div>
        {listings.length > 0 && (
          <Link href="/search" className="hidden sm:block">
            <Button variant="ghost" size="sm" rightIcon={
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            }>
              Explore marketplace
            </Button>
          </Link>
        )}
      </div>

      {listings.length === 0 ? (
        <EmptyState
          icon="✨"
          title="Your community is just getting started"
          description="GoRentals is growing fast in Hyderabad. Be the first to list your gear and start earning from your professional equipment."
          cta={{
            label: "List your first item",
            href: "/signup?role=OWNER"
          }}
          size="lg"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {listings.map((item) => (
            <ListingCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {listings.length > 0 && (
        <div className="mt-12 text-center sm:hidden">
          <Link href="/search">
            <Button variant="ghost" size="sm" fullWidth>
              Explore all listings →
            </Button>
          </Link>
        </div>
      )}
    </section>
  )
}


