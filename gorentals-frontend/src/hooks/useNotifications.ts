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
    
    // Use a unique channel name to prevent React Strict Mode 
    // from reusing a channel that has already been subscribed to.
    const channelName = `notifications:${userId}:${Math.random().toString(36).slice(2)}`;
    const channel = supabase.channel(channelName);

    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const n = payload.new as Notification;
        setNotifications(prev => [n, ...prev]);
        if (!n.isRead) setUnreadCount(c => c + 1);
      });

    // Only subscribe after adding handlers
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[useNotifications] Subscribed to ${channelName}`);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Polling for unread count as fallback/sync
  useEffect(() => {
    if (!userId) return;

    const fetchCount = async () => {
      try {
        const res = await api.get<{ unreadCount: number }>('/notifications?size=1');
        setUnreadCount(res.data.unreadCount);
      } catch (err) {
        console.warn('[useNotifications] Polling silent failure:', err);
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
