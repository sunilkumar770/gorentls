import api from '@/lib/axios';
import type { Listing, SearchFilters } from '@/types';

// Mapper to map the Java ListingResponse into our UI's Listing interface
function mapListingResponse(data: any): Listing {
  return {
    id: data.id,
    store_id: data.owner?.id || '',
    owner_id: data.owner?.id || '',
    title: data.title,
    description: data.description,
    category: data.category,
    subcategory: data.type || null,
    brand: null,
    condition: 'good',
    price_per_day: data.pricePerDay || 0,
    price_per_week: null,
    price_per_month: null,
    security_deposit: data.securityDeposit || 0,
    is_published: data.isPublished !== false, // Default true
    is_available: data.isAvailable !== false, // Default true
    average_rating: data.totalRatings || 0,
    total_reviews: data.ratingCount || 0,
    total_views: 0,
    created_at: data.createdAt || new Date().toISOString(),
    listing_images: (data.images || []).map((url: string, index: number) => ({
      id: `${data.id}-img-${index}`,
      listing_id: data.id,
      image_url: url,
      is_primary: index === 0,
      display_order: index,
    })),
    stores: data.owner ? {
      id: data.owner.id,
      owner_id: data.owner.id,
      store_name: data.owner.fullName || 'Awesome Rentals',
      store_description: null,
      store_logo_url: null,
      store_rating: data.ratingCount ? (data.totalRatings / data.ratingCount) : 5,
      store_city: data.city || null,
      verification_status: 'verified',
      is_active: true
    } : undefined
  };
}

export async function getListings(filters: SearchFilters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.city) params.append('city', filters.city);
    if (filters.min_price) params.append('minPrice', filters.min_price.toString());
    if (filters.max_price) params.append('maxPrice', filters.max_price.toString());
    
    // Sort mapping
    let sortBy = 'createdAt';
    let dir = 'desc';
    if (filters.sort === 'price_asc') { sortBy = 'pricePerDay'; dir = 'asc'; }
    if (filters.sort === 'price_desc') { sortBy = 'pricePerDay'; dir = 'desc'; }
    
    params.append('sort', `${sortBy},${dir}`);

    const response = await api.get('/listings/search', { params });
    // Spring boot Page<T> returns data in `content`
    const content = response.data.content || [];
    return content.map(mapListingResponse) as Listing[];
  } catch (error: any) {
    console.error('Failed to get listings', error);
    return [];
  }
}

export async function getListing(id: string): Promise<Listing | null> {
  try {
    const response = await api.get(`/listings/${id}`);
    return mapListingResponse(response.data);
  } catch (error: any) {
    console.error(`Failed to get listing ${id}`, error);
    return null;
  }
}

export async function getOwnerListings(ownerId: string): Promise<Listing[]> {
  try {
    // Owner looks at their own listings using the /owner/mine exact path
    const response = await api.get('/listings/owner/mine');
    const content = response.data.content || [];
    return content.map(mapListingResponse);
  } catch (error: any) {
    console.error('Failed to get owner listings', error);
    throw error;
  }
}

export async function createListing(
  listing: Omit<Listing, 'id' | 'created_at' | 'average_rating' | 'total_reviews' | 'total_views'>
) {
  try {
    // Map from UI Listing type → Java ListingRequest shape
    // ALL fields come from the caller — nothing is hardcoded
    const javaRequest = {
      title:           listing.title,
      description:     listing.description,
      category:        listing.category,
      type:            listing.subcategory || 'General',
      pricePerDay:     listing.price_per_day,
      securityDeposit: listing.security_deposit,
      location:        listing.stores?.store_city || '',
      city:            listing.stores?.store_city || '',
      state:           '',
      isAvailable:     listing.is_available ?? true,
      isPublished:     listing.is_published ?? true,
      images:          listing.listing_images?.map(img => img.image_url) ?? [],
    };

    const response = await api.post('/listings', javaRequest);
    return mapListingResponse(response.data);
  } catch (error) {
    console.error('Failed to create listing', error);
    throw error;
  }
}

export async function uploadListingImage(file: File, listingId: string): Promise<string> {
  // For now we will just return a placeholder or implement base64 if needed, 
  // since we haven't built out the AWS S3 endpoint on the Java side yet.
  return URL.createObjectURL(file);
}

export async function updateListing(
  listingId: string, 
  data: Partial<Listing> // Use Listing or properly mapped Partial
) {
  const res = await api.put(`/listings/${listingId}`, data);
  return res.data;
}

export async function deleteListing(listingId: string) {
  await api.delete(`/listings/${listingId}`);
}

export async function publishListing(listingId: string) {
  const res = await api.patch(`/listings/${listingId}/publish`);
  return res.data;
}

export async function getMyListings(page = 0, size = 10) {
  const res = await api.get(`/listings/owner/mine?page=${page}&size=${size}`);
  return res.data;
}

// TODO: export const toggleListingAvailability = async (listingId: string, isAvailable: boolean) => {
// Endpoint PATCH /api/listings/{id}/availability does NOT exist in ListingController.java
// }
