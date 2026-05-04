'use client';

import { useState, useEffect, useCallback } from 'react';
import { getEscrowSummary } from '@/app/actions/escrow';
import { useStomp } from '@/lib/websocket/stomp-client';

export interface EscrowSummary {
  bookingId: string;
  bookingStatus: string;
  escrowStatus: string;
  advanceAmount: number;
  remainingAmount: number;
  platformFee: number;
  gstAmount: number;
  totalCollected: number;
  tdsAmount: number;
  tcsAmount: number;
  disputeWindowEndsAt: string | null;
}

export function useEscrow(bookingId: string) {
  const [escrow, setEscrow] = useState<EscrowSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 1. Initial fetch via Server Action
  useEffect(() => {
    let isMounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    getEscrowSummary(bookingId)
      .then((data) => {
        if (isMounted) setEscrow(data);
      })
      .catch((err) => {
        console.error('Failed to fetch escrow summary:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [bookingId]);
  
  // 2. Real-time updates via WebSocket
  const { subscribe } = useStomp();
  
  useEffect(() => {
    const unsubscribe = subscribe(
      `/topic/bookings/${bookingId}/escrow`,
      (message) => {
        try {
          const update = JSON.parse(message.body);
          setEscrow(prev => prev ? { ...prev, ...update } : update);
        } catch (e) {
          console.error('Failed to parse escrow update message', e);
        }
      }
    );
    return () => {
      unsubscribe();
    };
  }, [bookingId, subscribe]);
  
  // 3. Refresh helper
  const refresh = useCallback(() => {
    setIsLoading(true);
    getEscrowSummary(bookingId)
      .then(setEscrow)
      .catch((err) => console.error('Failed to refresh escrow:', err))
      .finally(() => setIsLoading(false));
  }, [bookingId]);
  
  return { escrow, isLoading, refresh };
}
