'use client';

import { useState, useEffect, useCallback } from 'react';
import { safeStorage } from '@/lib/safeStorage';

const KEY = 'gr_wishlist';

export function useWishlist() {
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = JSON.parse(safeStorage.getItem(KEY) ?? '[]') as string[];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIds(new Set(stored));
    } catch { /* noop */ }
  }, []);

  const persist = useCallback((next: Set<string>) => {
    setIds(next);
    try {
      safeStorage.setItem(KEY, JSON.stringify([...next]));
    } catch { /* noop — Safari private mode */ }
  }, []);

  const toggle = useCallback((listingId: string) => {
    setIds(prev => {
      const next = new Set(prev);
      if (next.has(listingId)) {
        next.delete(listingId);
      } else {
        next.add(listingId);
      }
      persist(next);
      return next;
    });
  }, [persist]);

  const isWishlisted  = useCallback((id: string) => ids.has(id), [ids]);
  const wishlistIds   = [...ids];
  const count         = ids.size;

  return { wishlistIds, count, toggle, isWishlisted };
}

