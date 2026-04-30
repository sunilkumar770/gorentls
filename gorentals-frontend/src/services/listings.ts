// src/services/listings.ts — COMPLETE FINAL FILE
// Copy this EXACTLY. Do not modify the mapper.

import api from '@/lib/axios';
import type { Listing, SearchFilters } from '@/types';

function mapListingResponse(data: Record<string, any>): Listing {
  const ratingCount  = data.ratingCount  ?? 0;
  const totalRatings = data.totalRatings ?? 0;

  return {
    // Identity
    id:       String(data.id),
    owner_id: data.owner ? String(data.owner.id) : undefined,

    // Content
    title:       data.title       ?? '',
    description: data.description ?? null,
    category:    data.category    ?? '',
    subcategory: data.type        ?? null,

    // Pricing — backend sends BigDecimal → JSON number
    price_per_day:    Number(data.pricePerDay)     || 0,
    security_deposit: Number(data.securityDeposit) || 0,

    // Status — strict boolean coercion, not truthy/falsy
    is_published: data.isPublished === true,   // null → false (was draft)
    is_available: data.isAvailable !== false,  // null → true  (assume live)

    // Timestamp
    created_at: data.createdAt ?? new Date().toISOString(),

    // Images — backend sends String[], interface wants ListingImage[]
    listing_images: (data.images ?? []).map((url: string, idx: number) => ({
      id:            `${data.id}-img-${idx}`,
      image_url:     url,
    })),

    // Store — derived from owner object in response
    stores: data.owner
      ? {
          id:                  String(data.owner.id),
          store_name:          data.owner.fullName ?? 'GoRentals',
          store_city:          data.city ?? 'Unknown',
          verification_status: 'verified',
        }
      : undefined,
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
    return [];
  }
}

export async function getListing(id: string): Promise<Listing | null> {
  try {
    const res = await api.get(`/listings/${id}`);
    return mapListingResponse(res.data);
  } catch (err: any) {
    return null;
  }
}

// _ownerId ignored — backend reads owner from JWT at /owner/mine
// No try/catch — caller must show real error state, not silent empty list
export async function getOwnerListings(_ownerId?: string): Promise<Listing[]> {
  const res = await api.get('/listings/owner/mine');
  const items: Record<string, any>[] = Array.isArray(res.data) ? res.data : (res.data.content ?? []);
  return items.map(mapListingResponse);
}

function mapListingToRequest(listing: Partial<Listing>) {
  return {
    title:           listing.title,
    description:     listing.description,
    category:        listing.category,
    type:            listing.subcategory ?? 'General',
    pricePerDay:     listing.price_per_day,
    securityDeposit: listing.security_deposit,
    isAvailable:     listing.is_available,
    isPublished:     listing.is_published,
    images:          listing.listing_images?.map(i => i.image_url),
  };
}

export async function createListing(
  listing: Omit<Listing, 'id' | 'created_at' | 'average_rating' | 'total_reviews' | 'total_views'>
): Promise<Listing> {
  const payload = mapListingToRequest(listing);
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
  const payload = mapListingToRequest(data);
  const res = await api.put(`/listings/${listingId}`, payload);
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
// For the production-hardened flow, we upload to Supabase and then update the listing via PUT
export async function updateListingImages(listingId: string, imageUrls: string[]): Promise<Listing> {
  const res = await api.get(`/listings/${listingId}`);
  const currentData = res.data;

  const payload = {
    ...currentData,
    images: imageUrls,
  };

  const updated = await api.put(`/listings/${listingId}`, payload);
  return mapListingResponse(updated.data);
}

// Keeping these as no-ops or removing if they are replaced by direct listing update logic
export async function uploadListingImages(_listingId: string, _files: File[]): Promise<void> {
}

export async function deleteListingImage(_listingId: string, _imageId: string): Promise<void> {
}

export async function setPrimaryImage(_listingId: string, _imageId: string): Promise<void> {
}

