// src/hooks/useNotifications.ts
'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Notification } from '@/types';
import api from '@/lib/axios';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    if (!userId) return;
    api.get<{ content: Notification[]; unreadCount: number }>('/notifications?size=20')
      .then(res => {
        setNotifications(res.data.content);
        setUnreadCount(res.data.unreadCount);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  // Real-time channel
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,  // NOTE: snake_case matches Supabase column
      }, (payload) => {
        const n = payload.new as Notification;
        setNotifications(prev => [n, ...prev]);
        if (!n.isRead) setUnreadCount(c => c + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Polling for unread count as fallback/sync
  useEffect(() => {
    if (!userId) return;

    const fetchCount = async () => {
      try {
        const res = await api.get<{ unreadCount: number }>('/notifications/unread-count');
        setUnreadCount(res.data.unreadCount);
      } catch (err) {
        console.error('[useNotifications] Polling error:', err);
      }
    };

    const interval = setInterval(fetchCount, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [userId]);

  const markAllRead = useCallback(async () => {
    await api.patch('/notifications/mark-all-read');
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);


  return { notifications, unreadCount, loading, markAllRead };
}
