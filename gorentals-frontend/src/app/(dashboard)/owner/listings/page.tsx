'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getOwnerListings } from '@/services/listings'
import type { Listing } from '@/types'
import Link from 'next/link'
import { Typography } from '@/components/ui/Typography'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'

export default function OwnerListingsPage() {
  const { user, loading: authLoading } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && user) {
      getOwnerListings(user.id).then(data => {
        setListings(data)
        setLoading(false)
      })
    }
  }, [user, authLoading])

  if (loading || authLoading) return <div className="p-8 text-center text-text-tertiary">Loading listings...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Typography variant="h2">My Inventory</Typography>
        <Button asChild variant="primary">
          <Link href="/create-listing">+ Add Item</Link>
        </Button>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          icon="🏷️"
          title="No active listings"
          description="You haven't listed any items yet."
          action={<Button asChild variant="secondary"><Link href="/create-listing">Create Listing</Link></Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(item => (
            <Card key={item.id} padding="none" interactive className="overflow-hidden group">
              <div className="aspect-[4/3] bg-surface-raised relative overflow-hidden">
                {item.listing_images?.[0] ? (
                  <img src={item.listing_images[0].image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="flex items-center justify-center h-full text-text-tertiary text-4xl">📷</div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <Badge variant={item.is_published ? 'success' : 'warning'} size="sm">
                    {item.is_published ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              </div>
              <div className="p-4 flex flex-col h-[140px]">
                <Typography variant="body-sm" className="font-bold text-text-primary truncate">{item.title}</Typography>
                <Typography variant="body-xs" className="text-text-secondary mt-1 line-clamp-2 min-h-[40px]">{item.description || 'No description provided.'}</Typography>
                <div className="mt-auto flex items-center justify-between">
                  <Typography variant="body-md" className="font-extrabold text-brand-600">
                    ₹{item.price_per_day?.toLocaleString('en-IN')}/day
                  </Typography>
                  <Link
                    href={`/owner/listings/${item.id}/edit`}
                    className="text-xs font-bold text-brand-600 hover:text-brand-800 transition-colors px-3 py-1.5 bg-brand-50 rounded-lg hover:bg-brand-100"
                  >
                    EDIT
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
