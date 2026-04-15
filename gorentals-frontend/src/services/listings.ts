// src/services/listings.ts — COMPLETE FINAL FILE
// Copy this EXACTLY. Do not modify the mapper.

import api from '@/lib/axios';
import type { Listing, SearchFilters } from '@/types';

function mapListingResponse(data: any): Listing {
  const ratingCount  = data.ratingCount  ?? 0;
  const totalRatings = data.totalRatings ?? 0;
  const avgRating    = ratingCount > 0 ? totalRatings / ratingCount : 0;

  return {
    // Identity
    id:       String(data.id),
    store_id: data.owner?.id ? String(data.owner.id) : '',
    owner_id: data.owner?.id ? String(data.owner.id) : '',

    // Content
    title:       data.title       ?? '',
    description: data.description ?? null,
    category:    data.category    ?? '',
    subcategory: data.type        ?? null,
    brand:       null,
    condition:   'good' as const,   // valid: 'like_new'|'excellent'|'good'|'fair'

    // Pricing — backend sends BigDecimal → JSON number
    price_per_day:    Number(data.pricePerDay)     || 0,
    price_per_week:   null,
    price_per_month:  null,
    security_deposit: Number(data.securityDeposit) || 0,

    // Status — strict boolean coercion, not truthy/falsy
    is_published: data.isPublished === true,   // null → false (was draft)
    is_available: data.isAvailable !== false,  // null → true  (assume live)

    // Stats
    average_rating: avgRating,
    total_reviews:  ratingCount,
    total_views:    0,

    // Timestamp
    created_at: data.createdAt ?? new Date().toISOString(),

    // Images — backend sends String[], interface wants ListingImage[]
    listing_images: (data.images ?? []).map((url: string, idx: number) => ({
      id:            `${data.id}-img-${idx}`,
      listing_id:    String(data.id),
      image_url:     url,
      is_primary:    idx === 0,
      display_order: idx,
    })),

    // Store — derived from owner object in response
    stores: data.owner
      ? {
          id:                  String(data.owner.id),
          owner_id:            String(data.owner.id),
          store_name:          data.owner.fullName ?? 'GoRentals',
          store_description:   null,
          store_logo_url:      null,
          store_rating:        avgRating || 5,
          store_city:          data.city ?? null,
          verification_status: 'verified' as const,
          is_active:           true,
        }
      : undefined,
    owner: data.owner,
  };
}

export async function getListings(filters: SearchFilters = {}): Promise<Listing[]> {
  try {
    const params = new URLSearchParams();
    if (filters.category)  params.append('category', filters.category);
    if (filters.city)      params.append('city', filters.city);
    if (filters.min_price) params.append('minPrice', filters.min_price.toString());
    if (filters.max_price) params.append('maxPrice', filters.max_price.toString());

    let sortBy = 'createdAt', dir = 'desc';
    if (filters.sort === 'price_asc')  { sortBy = 'pricePerDay'; dir = 'asc'; }
    if (filters.sort === 'price_desc') { sortBy = 'pricePerDay'; dir = 'desc'; }
    params.append('sort', `${sortBy},${dir}`);

    const res = await api.get('/listings/search', { params });
    return (res.data.content ?? []).map(mapListingResponse);
  } catch (err: any) {
    console.error('[listings] getListings failed:', err?.response?.data ?? err.message);
    return [];
  }
}

export async function getListing(id: string): Promise<Listing | null> {
  try {
    const res = await api.get(`/listings/${id}`);
    return mapListingResponse(res.data);
  } catch (err: any) {
    console.error(`[listings] getListing(${id}) failed:`, err?.response?.data ?? err.message);
    return null;
  }
}

// _ownerId ignored — backend reads owner from JWT at /owner/mine
// No try/catch — caller must show real error state, not silent empty list
export async function getOwnerListings(_ownerId?: string): Promise<Listing[]> {
  const res = await api.get('/listings/owner/mine');
  const items: any[] = Array.isArray(res.data) ? res.data : (res.data.content ?? []);
  return items.map(mapListingResponse);
}

export async function createListing(
  listing: Omit<Listing, 'id' | 'created_at' | 'average_rating' | 'total_reviews' | 'total_views'>
): Promise<Listing> {
  const payload = {
    title:           listing.title,
    description:     listing.description,
    category:        listing.category,
    type:            listing.subcategory ?? 'General',
    pricePerDay:     listing.price_per_day,
    securityDeposit: listing.security_deposit,
    location:        listing.stores?.store_city ?? '',
    city:            listing.stores?.store_city ?? '',
    state:           '',
    isAvailable:     listing.is_available  ?? true,
    isPublished:     listing.is_published  ?? true,
    images:          listing.listing_images?.map(i => i.image_url) ?? [],
  };
  const res = await api.post('/listings', payload);
  return mapListingResponse(res.data);
}

export async function toggleListingAvailability(
  listingId: string,
  isAvailable: boolean
): Promise<Listing> {
  const res = await api.patch(
    `/listings/${listingId}/availability`,
    null,
    { params: { isAvailable } }
  );
  return mapListingResponse(res.data);
}

export async function publishListing(listingId: string): Promise<Listing> {
  const res = await api.patch(`/listings/${listingId}/publish`);
  return mapListingResponse(res.data);
}

export async function updateListing(
  listingId: string,
  data: Partial<Listing>
): Promise<Listing> {
  const res = await api.put(`/listings/${listingId}`, data);
  return mapListingResponse(res.data);
}

export async function deleteListing(listingId: string): Promise<void> {
  await api.delete(`/listings/${listingId}`);
}


export async function getMyListings(page = 0, size = 10) {
  const res = await api.get(`/listings/owner/mine?page=${page}&size=${size}`);
  return res.data;
}

// ─── Aliases for backward compatibility ───────────────────────────────────────
export const getAllListings = getListings;
export type ListingSearchParams = SearchFilters;

// ─── Image Management ─────────────────────────────────────────────────────────
export async function uploadListingImages(listingId: string, files: File[]): Promise<void> {
  const form = new FormData();
  files.forEach(f => form.append('files', f));
  await api.post(`/listings/${listingId}/images`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
}

export async function deleteListingImage(listingId: string, imageId: string): Promise<void> {
  await api.delete(`/listings/${listingId}/images/${imageId}`);
}

export async function setPrimaryImage(listingId: string, imageId: string): Promise<void> {
  await api.patch(`/listings/${listingId}/images/${imageId}/primary`);
}

