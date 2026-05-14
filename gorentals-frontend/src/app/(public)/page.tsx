import { getApiUrl } from '@/lib/api-utils'
import { HeroSection } from './components/HeroSection'
import { CategoryGrid } from './components/CategoryGrid'
import { ListingGrid } from './components/ListingGrid'
import { TrustBand } from './components/TrustBand'
import { OwnerCTABand } from './components/OwnerCTABand'

// Type for the API response
interface ListingDTO {
  id: string
  title: string
  images?: string[]
  pricePerDay: number
  location?: string
  category?: string
  condition?: string
  owner?: {
    fullName: string
    isVerified?: boolean
  }
}

async function getListings(): Promise<ListingDTO[]> {
  try {
    const res = await fetch(getApiUrl('/listings?limit=12'), {
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    
    // Support both direct array and paginated content structure
    const rawListings = Array.isArray(data) ? data : data.content ?? []
    
    // Filter out smoke/test entries at the frontend as a secondary safety net
    return rawListings.filter((item: ListingDTO) => {
      const title = item.title?.toLowerCase() || ''
      const ownerName = item.owner?.fullName?.toLowerCase() || ''
      
      const isSmoke = title.includes('smoke') || ownerName.includes('smoke')
      const isTest = title.includes('test') || ownerName.includes('test')
      
      return !isSmoke && !isTest
    })
  } catch (error) {
    console.error('Failed to fetch listings:', error)
    return []
  }
}

export default async function HomePage() {
  const listings = await getListings()

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950">
      <HeroSection />
      
      <div className="space-y-4">
        <CategoryGrid />
        <ListingGrid listings={listings} />
        <TrustBand />
        <OwnerCTABand />
      </div>
    </main>
  )
}

