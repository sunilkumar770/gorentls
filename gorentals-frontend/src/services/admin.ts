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

export interface AdminPayout {
  id: string;
  bookingId: string;
  ownerId: string;
  grossAmount: number;
  tdsAmount: number;
  netAmount: number;
  status: 'PENDING' | 'INITIATED' | 'SUCCESS' | 'FAILED' | 'ON_HOLD';
  scheduledAt: string | null;
  executedAt: string | null;
  failureReason: string | null;
  rpPayoutId: string | null;
  fundAccountId: string | null;
  createdAt: string;
  updatedAt: string;
  retryCount: number;
  nextRetryAt: string | null;
}

export interface AdminLedgerTransaction {
  id: string;
  bookingId: string;
  paymentId: string | null;
  account: 'BANK_SETTLEMENT' | 'RENTER_ESCROW' | 'OWNER_ESCROW' | 'SECURITY_HOLD' | 'PLATFORM_FEE' | 'TAX_TCS' | 'TAX_TDS';
  direction: 'DEBIT' | 'CREDIT';
  amount: number;
  currency: string;
  reason: string;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export interface AdminOwnerPayoutAccount {
  id: string;
  ownerId: string;
  accountType: 'BANK' | 'UPI';
  accountNumber: string | null;
  ifsc: string | null;
  upiId: string | null;
  fundAccountId: string | null;
  status: 'PENDING' | 'VERIFIED' | 'SUSPENDED' | 'BLOCKED';
  verificationRef: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
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

export interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  ipAddress: string | null;
  createdAt: string;
}

export interface AdminListing {
  id: string;
  title: string;
  city?: string;
  category?: string;
  approvalStatus?: string;
  is_published?: boolean;
  isPublished?: boolean;
  pricePerDay?: number;
  price_per_day?: number;
  rentalPricePerDay?: number;
  ownerName?: string;
  owner?: { fullName?: string; email?: string };
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
  /**
   * Fetch paginated users with optional free-text search.
   * search='' returns all users.
   */
  getUsers: async (page = 0, size = 20, search = ''): Promise<PageResponse<AdminUser>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search.trim()) params.set('search', search.trim());
    const r = await api.get(`/admin/users?${params}`);
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
  /**
   * Fetch paginated owners with optional free-text search.
   */
  getOwners: async (page = 0, size = 20, search = ''): Promise<PageResponse<AdminUser>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search.trim()) params.set('search', search.trim());
    const r = await api.get(`/admin/owners?${params}`);
    return r.data;
  },

  verifyOwner: async (ownerId: string) => {
    const r = await api.patch(`/admin/owners/${ownerId}/verify`);
    return r.data;
  },

  // ── Listings ─────────────────────────────────────────────────────────────
  getAllListings: async (page = 0, size = 20): Promise<PageResponse<AdminListing>> => {
    const r = await api.get(`/admin/listings?page=${page}&size=${size}`);
    return r.data;
  },

  getPendingListings: async (page = 0, size = 20): Promise<PageResponse<AdminListing>> => {
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

  // ── Audit Log ────────────────────────────────────────────────────────────
  getAuditLog: async (page = 0, size = 50): Promise<PageResponse<AuditLog>> => {
    const r = await api.get(`/admin/audit-log?page=${page}&size=${size}`);
    return r.data;
  },

  // ── Secure Deletion ──────────────────────────────────────────────────────
  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/admin/users/${userId}`);
  },

  deleteListing: async (listingId: string): Promise<void> => {
    await api.delete(`/admin/listings/${listingId}`);
  },

  // ── Financial Controls: Payouts ──────────────────────────────────────────
  getPayouts: async (page = 0, size = 20, status?: string, ownerId?: string): Promise<PageResponse<AdminPayout>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.set('status', status);
    if (ownerId) params.set('ownerId', ownerId);
    const r = await api.get(`/admin/payouts?${params}`);
    return r.data;
  },

  holdPayout: async (payoutId: string): Promise<AdminPayout> => {
    const r = await api.patch(`/admin/payouts/${payoutId}/hold`);
    return r.data;
  },

  releasePayout: async (payoutId: string): Promise<AdminPayout> => {
    const r = await api.patch(`/admin/payouts/${payoutId}/release`);
    return r.data;
  },

  forceSuccessPayout: async (payoutId: string): Promise<AdminPayout> => {
    const r = await api.patch(`/admin/payouts/${payoutId}/force-success`);
    return r.data;
  },

  forceFailedPayout: async (payoutId: string, reason?: string): Promise<AdminPayout> => {
    const r = await api.patch(`/admin/payouts/${payoutId}/force-failed`, { reason });
    return r.data;
  },

  // ── Financial Controls: Ledger ───────────────────────────────────────────
  getLedger: async (page = 0, size = 20, account?: string): Promise<PageResponse<AdminLedgerTransaction>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (account) params.set('account', account);
    const r = await api.get(`/admin/ledger?${params}`);
    return r.data;
  },

  getLedgerForBooking: async (bookingId: string): Promise<AdminLedgerTransaction[]> => {
    const r = await api.get(`/admin/ledger/booking/${bookingId}`);
    return r.data;
  },

  // ── Financial Controls: Owner Payout Onboarding Accounts ──────────────────
  getOwnerPayoutAccounts: async (page = 0, size = 20, status?: string): Promise<PageResponse<AdminOwnerPayoutAccount>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.set('status', status);
    const r = await api.get(`/admin/owner-payout-accounts?${params}`);
    return r.data;
  },

  verifyOwnerPayoutAccount: async (accountId: string, fundAccountId?: string, verificationRef?: string): Promise<AdminOwnerPayoutAccount> => {
    const r = await api.patch(`/admin/owner-payout-accounts/${accountId}/verify`, { fundAccountId, verificationRef });
    return r.data;
  },

  suspendOwnerPayoutAccount: async (accountId: string): Promise<AdminOwnerPayoutAccount> => {
    const r = await api.patch(`/admin/owner-payout-accounts/${accountId}/suspend`);
    return r.data;
  },

  blockOwnerPayoutAccount: async (accountId: string): Promise<AdminOwnerPayoutAccount> => {
    const r = await api.patch(`/admin/owner-payout-accounts/${accountId}/block`);
    return r.data;
  },

  reinstateOwnerPayoutAccount: async (accountId: string, verificationRef?: string): Promise<AdminOwnerPayoutAccount> => {
    const r = await api.patch(`/admin/owner-payout-accounts/${accountId}/reinstate`, { verificationRef });
    return r.data;
  },
};
