'use client';

import { useEffect, useState, useCallback } from 'react';
import { getListings, getListing } from '@/services/listings';
import type { Listing, SearchFilters } from '@/types';

export function useListings(initialFilters: SearchFilters = {}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getListings(filters);
      setListings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return { listings, loading, error, filters, setFilters, refetch: fetchListings };
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
