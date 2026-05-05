'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import type { Listing } from '@/types';

export interface FavoriteDto {
  id: number;
  listing: Listing;
  createdAt: string;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('gr_token') : null;
    if (!token) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.get<FavoriteDto[]>('/favorites/my-favorites');
      setFavorites(res.data);
    } catch (err: unknown) {
      const _err = err as { response?: { data?: { message?: string } }; message?: string };
      setError(_err?.response?.data?.message ?? 'Failed to load favorites.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const addFavorite = async (listingId: string) => {
    try {
      const res = await api.post<FavoriteDto>(`/favorites/${listingId}`);
      setFavorites(prev => [...prev, res.data]);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const removeFavorite = async (listingId: string) => {
    try {
      await api.delete(`/favorites/${listingId}`);
      setFavorites(prev => prev.filter(f => f.listing?.id !== listingId));
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  return { favorites, loading, error, refetch, addFavorite, removeFavorite };
}
