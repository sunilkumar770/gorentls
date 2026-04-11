import api from '@/lib/axios';
import type { Notification, NotificationPage } from '@/types';

export const notificationService = {
  /** GET /api/notifications?page=0&size=20 */
  getNotifications: async (page = 0, size = 20): Promise<NotificationPage> =>
    (await api.get(`/notifications?page=${page}&size=${size}`)).data,

  /** GET /api/notifications/unread-count */
  getUnreadCount: async (): Promise<number> => {
    const res = await api.get('/notifications/unread-count');
    return res.data.unreadCount ?? 0;
  },

  /** PATCH /api/notifications/{id}/read */
  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  /** PATCH /api/notifications/read-all */
  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },

  /** DELETE /api/notifications/{id} */
  deleteNotification: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};
