// src/hooks/useNotifications.ts
'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Notification } from '@/types';
import api from '@/lib/axios';

// Client is created lazily inside the hook only when env vars are present.

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  // Lazy-init Supabase client only when env vars are available
  const getSupabase = (): SupabaseClient | null => {
    if (supabaseRef.current) return supabaseRef.current;
    const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;  // graceful degradation, no crash
    supabaseRef.current = createClient(url, key);
    return supabaseRef.current;
  };

  // Initial fetch
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    api.get<{ content: Notification[]; unreadCount: number }>('/notifications?size=20')
      .then(res => {
        setNotifications(res.data.content ?? []);
        setUnreadCount(res.data.unreadCount ?? 0);
      })
      .catch(() => {}) // silent — backend may not be running locally
      .finally(() => setLoading(false));
  }, [userId]);

  // Real-time channel — only runs if Supabase is configured
  useEffect(() => {
    if (!userId) return;
    const client = getSupabase();
    if (!client) return; // no Supabase keys = skip realtime, polling still works

    const channel = client
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const n = payload.new as Notification;
        setNotifications(prev => [n, ...prev]);
        if (!n.isRead) setUnreadCount(c => c + 1);
      })
      .subscribe();

    return () => { client.removeChannel(channel); };
  }, [userId]);

  // 30s polling fallback (works even without Supabase keys)
  useEffect(() => {
    if (!userId) return;
    const fetchCount = async () => {
      try {
        const res = await api.get<{ unreadCount: number }>('/notifications/unread-count');
        setUnreadCount(res.data.unreadCount ?? 0);
      } catch {} // silent
    };
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const markAllRead = useCallback(async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  }, []);

  return { notifications, unreadCount, loading, markAllRead };
}

