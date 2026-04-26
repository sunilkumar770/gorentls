'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAllListings, getListing } from '@/services/listings';
import type { ListingSearchParams } from '@/services/listings';
import type { Listing } from '@/types';

export function useListings(filters: ListingSearchParams = {}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = JSON.stringify(filters);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllListings(filters);
      // Ensure we extract the array from PagedResponse if needed
      setListings(Array.isArray(data) ? data : (data as any).content || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  }, [filterKey]); // Re-run when serialized filters change

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return { listings, loading, error, refetch: fetchListings };
}

export function useListing(id: string) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getListing(id).then(data => {
      setListing(data);
      setLoading(false);
    });
  }, [id]);

  return { listing, loading };
}
