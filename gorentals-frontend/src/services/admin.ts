import api from '../lib/axios';

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

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  userType: 'RENTER' | 'OWNER' | 'ADMIN';
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  // KYC fields
  kycStatus: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | null;
  kycDocumentType: string | null;
  kycDocumentId: string | null;
  kycDocumentUrl: string | null;
  profilePicture: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  pincode: string | null;
}

export interface AdminBooking {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  rentalAmount: number;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
  renter: { id: string; fullName: string; email: string; phone: string };
  listing: {
    id: string; title: string; city: string;
    owner: { id: string; fullName: string; email: string };
  };
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const adminService = {
  // ── Stats ────────────────────────────────────────────────────────────────
  getStats: async (): Promise<AdminStats> => {
    const r = await api.get('/admin/dashboard/stats');
    return r.data;
  },

  // ── Users ────────────────────────────────────────────────────────────────
  getUsers: async (page = 0, size = 20): Promise<PageResponse<AdminUser>> => {
    const r = await api.get(`/admin/users?page=${page}&size=${size}`);
    return r.data;
  },

  verifyUserKYC: async (userId: string) => {
    const r = await api.patch(`/admin/users/${userId}/verify`);
    return r.data;
  },

  suspendUser: async (userId: string) => {
    const r = await api.patch(`/admin/users/${userId}/suspend`);
    return r.data;
  },

  unsuspendUser: async (userId: string) => {
    const r = await api.patch(`/admin/users/${userId}/unsuspend`);
    return r.data;
  },

  // ── Owners ───────────────────────────────────────────────────────────────
  getOwners: async (page = 0, size = 20): Promise<PageResponse<AdminUser>> => {
    const r = await api.get(`/admin/owners?page=${page}&size=${size}`);
    return r.data;
  },

  verifyOwner: async (ownerId: string) => {
    const r = await api.patch(`/admin/owners/${ownerId}/verify`);
    return r.data;
  },

  // ── Listings ─────────────────────────────────────────────────────────────
  getAllListings: async (page = 0, size = 20): Promise<PageResponse<any>> => {
    const r = await api.get(`/admin/listings?page=${page}&size=${size}`);
    return r.data;
  },

  getPendingListings: async (page = 0, size = 20): Promise<PageResponse<any>> => {
    const r = await api.get(`/admin/listings/pending?page=${page}&size=${size}`);
    return r.data;
  },

  approveListing: async (listingId: string) => {
    const r = await api.patch(`/admin/listings/${listingId}/approve`);
    return r.data;
  },

  rejectListing: async (listingId: string) => {
    const r = await api.delete(`/admin/listings/${listingId}/reject`);
    return r.data;
  },

  // ── Bookings ─────────────────────────────────────────────────────────────
  getAllBookings: async (page = 0, size = 20): Promise<PageResponse<AdminBooking>> => {
    const r = await api.get(`/admin/bookings?page=${page}&size=${size}`);
    return r.data;
  },
};
