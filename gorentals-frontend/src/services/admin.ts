import api from '../lib/axios';
import { Profile, Listing, Store } from '../types';

export interface AdminStats {
  totalUsers: number;
  totalOwners: number;
  totalRenters: number;
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  totalRevenue: number;
  platformCommission: number;
  pendingKYC: number;
  pendingOwnerVerifications: number;
}

export const adminService = {
  getStats: async () => {
    const response = await api.get<AdminStats>('/admin/dashboard/stats');
    return response.data;
  },

  getUsers: async (page = 0, size = 10) => {
    const response = await api.get<{ content: Profile[] }>(`/admin/users?page=${page}&size=${size}`);
    return response.data;
  },

  verifyUserKYC: async (userId: string) => {
    const response = await api.patch<Profile>(`/admin/users/${userId}/verify`);
    return response.data;
  },

  getPendingListings: async (page = 0, size = 10) => {
    const response = await api.get<{ content: Listing[] }>(`/admin/listings/pending?page=${page}&size=${size}`);
    return response.data;
  },

  approveListing: async (listingId: string) => {
    const response = await api.patch<Listing>(`/admin/listings/${listingId}/approve`);
    return response.data;
  }
};
