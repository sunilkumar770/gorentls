// src/contexts/ChatContext.tsx
// Global WebSocket manager + unread badge state.
// Mounted above Navbar in layout.tsx — persists across ALL page navigations.
'use client';

import {
  createContext, useContext, useEffect,
  useState, useCallback, useRef,
} from 'react';
import { useAuth } from '@/hooks/useAuth';
import websocketService from '@/services/websocketService';
import { getConversations } from '@/services/messages';
import type { StompSubscription } from '@stomp/stompjs';

interface ChatContextType {
  totalUnread:   number;
  refreshUnread: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType>({
  totalUnread:   0,
  refreshUnread: async () => {},
});

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);

  // Tracks the active inbox STOMP subscription so cleanup can unsubscribe it.
  // This is the CORRECT React 18 Strict Mode guard:
  // — refs survive the Strict Mode unmount between the two effect fires
  // — so we can check + clear the sub in cleanup, preventing duplicates
  const inboxSubRef    = useRef<StompSubscription | null>(null);
  const isSubscribed   = useRef(false);
  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authCleanupRef = useRef<(() => void) | null>(null);

  // ── Core: fetch unread count from API (never +1 — always source of truth) ──
  const refreshUnread = useCallback(async (): Promise<void> => {
    if (!user?.id) { setTotalUnread(0); return; }
    try {
      const convs = await getConversations();
      const total = convs.reduce((sum, c) => {
        const mine = String(user.id) === String(c.ownerId) ? c.ownerUnread : c.renterUnread;
        return sum + (mine ?? 0);
      }, 0);
      setTotalUnread(total);
    } catch {
      // Non-critical — badge keeps last known value
    }
  }, [user]);

  // Debounced refresh: if 5 messages arrive at once, only ONE API call fires
  const scheduleRefresh = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(refreshUnread, 500);
  }, [refreshUnread]);

  useEffect(() => {
    // ── LOGOUT / NO USER ─────────────────────────────────────────────────
    if (!user?.id) {
      // Security: disconnect immediately so no previous user's messages
      // can bleed into the next session on the same browser tab
      websocketService.disconnectPermanently();

      // Clean up all refs
      if (inboxSubRef.current) {
        inboxSubRef.current.unsubscribe();
        inboxSubRef.current = null;
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      authCleanupRef.current?.();
      authCleanupRef.current = null;
      isSubscribed.current   = false;
      setTotalUnread(0);
      return;
    }

    // ── LOGGED IN ─────────────────────────────────────────────────────────

    // 1. Load initial badge count from REST
    refreshUnread();

    // 2. Connect WS + subscribe to personal inbox queue
    websocketService.connect(() => {
      // React 18 Strict Mode fires effects twice: mount → cleanup → mount.
      // The guard is HERE (inside the callback), not at the top of useEffect.
      // This correctly handles: first call sets flag, cleanup resets it,
      // second call subscribes fresh. No duplicate subscriptions.
      if (isSubscribed.current) return;

      const sub = websocketService.subscribeToInbox(() => {
        // Debounced re-fetch instead of prev + 1 (prevents state drift)
        scheduleRefresh();
      });

      inboxSubRef.current  = sub;
      isSubscribed.current = true;
    });

    // 3. Wire JWT expiry → auto logout via DOM event
    // (avoids circular import between websocketService ↔ AuthContext)
    authCleanupRef.current = websocketService.onAuthFailure(() => {
      window.dispatchEvent(new CustomEvent('ws:auth-failure'));
    });

    // ── CLEANUP ───────────────────────────────────────────────────────────
    // Runs when user?.id changes (login/logout) and on React 18 Strict Mode unmount.
    // Does NOT run on normal page navigation — that is intentional.
    return () => {
      // Unsubscribe inbox sub so React 18's second mount gets a fresh one
      if (inboxSubRef.current) {
        inboxSubRef.current.unsubscribe();
        inboxSubRef.current = null;
      }
      // Reset guard so the second Strict Mode mount re-subscribes correctly
      isSubscribed.current = false;

      // Clean up auth failure listener
      authCleanupRef.current?.();
      authCleanupRef.current = null;

      if (debounceRef.current) clearTimeout(debounceRef.current);

      // DO NOT call disconnectPermanently() here — the connection is intentionally
      // persistent across page navigations. Only disconnect on logout (user?.id = null).
    };
  }, [user?.id, refreshUnread, scheduleRefresh]);

  return (
    <ChatContext.Provider value={{ totalUnread, refreshUnread }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
