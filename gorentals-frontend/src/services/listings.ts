// src/services/listings.ts — COMPLETE FINAL FILE
// Copy this EXACTLY. Do not modify the mapper.

import api from '@/lib/axios';
import type { Listing, SearchFilters } from '@/types';

interface ListingBackendResponse {
  id?: string | number;
  owner?: { id?: string | number; fullName?: string; isVerified?: boolean };
  title?: string; description?: string; category?: string; type?: string;
  pricePerDay?: number | string; securityDeposit?: number | string;
  isPublished?: boolean; isAvailable?: boolean; createdAt?: string;
  images?: string[]; city?: string; state?: string; location?: string;
  ratingCount?: number; totalRatings?: number;
  [key: string]: unknown;
}

function mapListingResponse(data: ListingBackendResponse): Listing {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const ratingCount  = data.ratingCount  ?? 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const totalRatings = data.totalRatings ?? 0;

  return {
    // Identity
    id:       String(data.id),
    ownerId: data.owner ? String(data.owner.id) : undefined,
    owner: data.owner ? {
      id: String(data.owner.id),
      fullName: data.owner.fullName ?? 'GoRentals Owner',
      isVerified: data.owner.isVerified !== false,
    } : undefined,

    // Content
    title:       data.title       ?? '',
    description: data.description ?? null,
    category:    data.category    ?? '',
    subcategory: data.type        ?? null,

    // Pricing — backend sends BigDecimal → JSON number
    pricePerDay:    Number(data.pricePerDay)     || 0,
    securityDeposit: Number(data.securityDeposit) || 0,

    // Status — strict boolean coercion, not truthy/falsy
    isPublished: data.isPublished === true,   // null → false (was draft)
    isAvailable: data.isAvailable !== false,  // null → true  (assume live)

    // Timestamp
    createdAt: data.createdAt ?? new Date().toISOString(),

    // Images — backend sends String[], interface wants ListingImage[]
    listingImages: (data.images ?? []).map((url: string, idx: number) => ({
      id:            `${data.id}-img-${idx}`,
      image_url:     url,
    })),

    // Store — derived from owner object in response
    stores: data.owner
      ? {
          id:                  String(data.owner.id),
          ownerId:             String(data.owner.id),
          store_name:          data.owner.fullName ?? 'GoRentals',
          store_description:   null,
          store_logo_url:      null,
          store_rating:        data.totalRatings ? Number(data.totalRatings) : 5.0,
          store_city:          data.city ?? 'Unknown',
          verification_status: 'verified',
          is_active:           true,
        }
      : undefined,

    // Additional required fields for Listing interface
    city:          data.city      ?? 'Unknown',
    state:         data.state     ?? 'Unknown',
    location:      data.location  ?? 'Unknown',
    type:          data.type      ?? 'General',
    ratingCount:   Number(data.ratingCount)  || 0,
    totalRatings:  Number(data.totalRatings) || 0,
  };
}

export async function getListings(filters: SearchFilters = {}): Promise<Listing[]> {
  try {
    const params = new URLSearchParams();
    if (filters.category)  params.append('category', String(filters.category));
    if (filters.city)      params.append('city', String(filters.city));
    if (filters.ownerId)   params.append('ownerId', String(filters.ownerId));
    if (filters.min_price) params.append('minPrice', String(filters.min_price));
    if (filters.max_price) params.append('maxPrice', String(filters.max_price));
    if (filters.keyword)   params.append('keyword', String(filters.keyword));
    if (filters.page != null) params.append('page', filters.page.toString());
    if (filters.size != null) params.append('size', filters.size.toString());

    let sortBy = 'createdAt', dir = 'desc';
    if (filters.sort === 'price_asc')  { sortBy = 'pricePerDay'; dir = 'asc'; }
    if (filters.sort === 'price_desc') { sortBy = 'pricePerDay'; dir = 'desc'; }
    params.append('sort', `${sortBy},${dir}`);

    const res = await api.get('/listings/search', { params });
    return (res.data.content ?? []).map(mapListingResponse);
  } catch (err: unknown) {
    const error = err as {
      response?: { status?: number; data?: unknown };
      request?: unknown;
      message?: string;
      code?: string;
    };
    if (process.env.NODE_ENV === "development") {
      if (error?.response) {
        console.error('[listings] getListings failed — HTTP', error.response.status, error.response.data);
      } else if (error?.request) {
        console.error('[listings] getListings failed — No response from server. Is the backend running on', process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api', '? Code:', error.code);
      } else {
        console.error('[listings] getListings failed —', error?.message ?? String(err));
      }
    }
    return [];
  }
}

export async function getListing(id: string): Promise<Listing | null> {
  try {
    const res = await api.get(`/listings/${id}`);
    return mapListingResponse(res.data);
  } catch (err: unknown) {
    const error = err as { response?: { data?: unknown }; message?: string };
    if (process.env.NODE_ENV === "development") console.error(`[listings] getListing(${id}) failed:`, error?.response?.data ?? error.message);
    return null;
  }
}

// _ownerId ignored — backend reads owner from JWT at /owner/mine
// No try/catch — caller must show real error state, not silent empty list
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getOwnerListings(_ownerId?: string): Promise<Listing[]> {
  const res = await api.get('/listings/owner/mine');
  const items: ListingBackendResponse[] = Array.isArray(res.data) ? res.data : (res.data.content ?? []);
  return items.map(mapListingResponse);
}

function mapListingToRequest(listing: Partial<Listing>) {
  return {
    title:           listing.title,
    description:     listing.description,
    category:        listing.category,
    type:            listing.subcategory ?? 'General',
    pricePerDay:     listing.pricePerDay,
    securityDeposit: listing.securityDeposit,
    isAvailable:     listing.isAvailable,
    isPublished:     listing.isPublished,
    images:          listing.listingImages?.map(i => i.image_url),
  };
}

export async function createListing(
  listing: Omit<Listing, 'id' | 'createdAt' | 'average_rating' | 'total_reviews' | 'total_views'>
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

export async function getAvailability(listingId: string): Promise<{ blockedRanges: { startDate: string; endDate: string; reason: 'BOOKING' | 'MANUAL' }[] }> {
  try {
    const res = await api.get(`/listings/${listingId}/availability`);
    return res.data;
  } catch (err: unknown) {
    console.error(`[listings] getAvailability(${listingId}) failed:`, err);
    return { blockedRanges: [] };
  }
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function uploadListingImages(_listingId: string, _files: File[]): Promise<void> {
  if (process.env.NODE_ENV === "development") console.warn('Use direct Supabase upload instead of uploadListingImages');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deleteListingImage(_listingId: string, _imageId: string): Promise<void> {
  if (process.env.NODE_ENV === "development") console.warn('Handle deletion via updateListingImages');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function setPrimaryImage(_listingId: string, _imageId: string): Promise<void> {
  if (process.env.NODE_ENV === "development") console.warn('Handle primary image via order in updateListingImages');
}


