import api from '@/lib/axios';
import type { Notification, NotificationPage } from '@/types';

export async function getNotifications(
  page = 0,
  size = 20,
): Promise<NotificationPage> {
  const res = await api.get<NotificationPage>('/notifications', {
    params: { page, size },
  });
  return res.data;
}

export async function markAsRead(notificationId: string): Promise<void> {
  await api.patch(`/notifications/${notificationId}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}

export async function getUnreadCount(): Promise<number> {
  const res = await api.get<{ count: number }>('/notifications/unread-count');
  return res.data.count ?? 0;
}
